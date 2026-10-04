import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user';
import { ProfileRow } from '../types/supabase';
import { DEFAULT_USER_PROFILE, createNewUserProfile } from './storage';
import { supabaseProgressService } from './supabaseProgress';
import { getDefaultCurriculumMastery } from '../utils/curriculum';

export interface SupabaseAuthResult {
  success: boolean;
  user?: UserProfile;
  profile?: ProfileRow;
  error?: string;
  isDeactivated?: boolean;
}

// Track last processed session to prevent duplicate login events on re-renders / token refresh
let lastRecordedLoginSessionId: string | null = null;

export const supabaseAuthService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Convert a Supabase ProfileRow into the client UserProfile format.
   * New users start at 0% progress across all 6 curricula.
   * Existing users preserve their stats and records.
   */
  mapProfileToUser(profile: ProfileRow): UserProfile {
    // Preserve starter demo profile if it's the legacy demo account
    if (profile.email?.toLowerCase() === 'learner@prestige.local') {
      return {
        ...DEFAULT_USER_PROFILE,
        id: profile.id,
        role: profile.role as UserRole,
        joinedDate: profile.created_at,
      };
    }

    const cleanEmail = profile.email;
    const cleanName = profile.display_name || cleanEmail.split('@')[0] || 'User / Learner';
    const profileRole = (profile.role as UserRole) || 'USER';
    const isAdminRole = profileRole === 'ADMIN';
    const initials = cleanName.slice(0, 2).toUpperCase() || 'LR';

    return {
      id: profile.id,
      username: cleanName,
      name: cleanName,
      email: cleanEmail,
      callsign: isAdminRole ? 'PARDHIV-01' : (cleanName.slice(0, 8).toUpperCase() || `${initials}-01`),
      avatarSeed: `avatar-${profile.id}`,
      role: profileRole,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      firstLoginAt: profile.first_login_at || undefined,
      lastLoginAt: profile.last_login_at || undefined,
      loginCount: profile.login_count || 1,
      stats: {
        codesDecoded: isAdminRole ? 12 : 0,
        accuracy: isAdminRole ? 98 : 0,
        currentStreak: isAdminRole ? 5 : 0,
        bestStreak: isAdminRole ? 15 : 0,
        xp: isAdminRole ? 1000 : 0,
        rank: isAdminRole ? 'MASTER DECODER' : 'INITIATE',
        fastestSolveSeconds: isAdminRole ? 24 : 0,
        highestDifficultySolved: isAdminRole ? 'Expert' : 'None',
        reportsGenerated: profile.report_count || 0,
        savedInvestigationsCount: 0,
      },
      completedChallengeIds: [],
      achievements: [],
      curriculumMastery: getDefaultCurriculumMastery(),
      joinedDate: profile.created_at,
    };
  },

  /**
   * Enrich client UserProfile with persisted user_progress and completed challenges
   */
  async enrichUserProfile(user: UserProfile): Promise<UserProfile> {
    try {
      // Preserve admin profile and do not overwrite with 0% initiate progress
      if (user.role === 'ADMIN') {
        return user;
      }
      const progress = await supabaseProgressService.getUserProgress(user.id);
      const completed = await supabaseProgressService.getCompletedChallenges(user.id);
      const isDemoAccount = user.email?.toLowerCase() === 'learner@prestige.local';

      return {
        ...user,
        curriculumMastery: progress,
        completedChallengeIds: isDemoAccount && completed.length === 0 ? user.completedChallengeIds : completed,
        stats: {
          ...user.stats,
          codesDecoded: isDemoAccount && completed.length === 0 ? user.stats.codesDecoded : completed.length,
        },
      };
    } catch {
      return user;
    }
  },

  /**
   * Register a new user with Supabase Auth
   */
  async signUp(name: string, email: string, pass: string): Promise<SupabaseAuthResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Environment-aware confirmation redirect:
      // Production: https://theprestige.vercel.app/
      // Local dev:   http://localhost:3000/
      const redirectOrigin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://theprestige.vercel.app';
      const emailRedirectTo = `${redirectOrigin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          emailRedirectTo,
          data: {
            name: name.trim(),
            display_name: name.trim(),
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'User registration failed. Please try again.' };
      }

      // Allow trigger to populate profile or fetch/upsert
      let profile = await this.getProfile(data.user.id);
      if (!profile) {
        // Fallback: direct insert if trigger delayed
        const { data: inserted } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: cleanEmail,
            display_name: name.trim(),
            role: 'USER',
            is_active: true,
          })
          .select()
          .single();
        profile = inserted as ProfileRow;
      }

      // Initialize 0% progress in public.user_progress for new user
      await supabaseProgressService.initializeUserProgress(data.user.id);

      const clientUser: UserProfile = profile
        ? this.mapProfileToUser(profile)
        : createNewUserProfile(data.user.id, cleanEmail, name.trim());

      const enrichedUser = await this.enrichUserProfile(clientUser);
      return { success: true, user: enrichedUser, profile: profile || undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration error occurred';
      return { success: false, error: message };
    }
  },

  /**
   * Sign in with Supabase Auth
   */
  async signIn(email: string, pass: string): Promise<SupabaseAuthResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'itzpardhiv' || cleanEmail.includes('itzpardhiv')) {
      cleanEmail = 'itzpardhiv@gmail.com';
    }
    const cleanPassword = pass.trim();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        // Record failed login event
        await this.recordFailedLogin(cleanEmail, error.message, userAgent);
        return { success: false, error: error.message };
      }

      if (!data.user || !data.session) {
        return { success: false, error: 'Authentication failed. No active session returned.' };
      }

      // Check user profile and activation status
      let profile = await this.getProfile(data.user.id);

      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        await this.recordFailedLogin(cleanEmail, 'Account deactivated by administrator', userAgent);
        return {
          success: false,
          isDeactivated: true,
          error: 'Your account has been deactivated by an administrator. Please contact operations clearance.',
        };
      }

      // Record successful login atomically (update counters, first_login_at, login_events, audit_logs)
      if (lastRecordedLoginSessionId !== data.session.access_token) {
        lastRecordedLoginSessionId = data.session.access_token;
        await this.recordSuccessfulLogin(data.user.id, cleanEmail, userAgent);
      }

      // Refresh profile to get updated login count
      profile = await this.getProfile(data.user.id);

      // Self-heal: ensure itzpardhiv@gmail.com profile exists with role = 'ADMIN'
      if (cleanEmail === 'itzpardhiv@gmail.com' && (!profile || profile.role !== 'ADMIN')) {
        try {
          await supabase.rpc('restore_admin_profile', { p_user_id: data.user.id });
          profile = await this.getProfile(data.user.id);
        } catch (e) {
          console.warn('Admin profile restoration error:', e);
        }
      }

      const clientUser: UserProfile = profile
        ? this.mapProfileToUser(profile)
        : createNewUserProfile(data.user.id, cleanEmail);

      const enrichedUser = await this.enrichUserProfile(clientUser);
      return { success: true, user: enrichedUser, profile: profile || undefined };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication';
      await this.recordFailedLogin(cleanEmail, message, userAgent);
      return { success: false, error: message };
    }
  },

  /**
   * Sign out from Supabase Auth
   */
  async signOut(): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('audit_logs').insert({
          actor_user_id: data.user.id,
          action: 'USER_LOGOUT',
          target_user_id: data.user.id,
          metadata: { email: data.user.email },
        });
      }
    } catch {
      // non-blocking
    } finally {
      lastRecordedLoginSessionId = null;
      await supabase.auth.signOut();
    }
  },

  /**
   * Request password reset email via Supabase Auth
   * Security & Privacy: Returns a neutral response to prevent email enumeration.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      // Offline/demo mode: return neutral success so UI flow functions
      return { success: true };
    }

    const cleanEmail = email.trim().toLowerCase();
    try {
      const redirectOrigin = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://theprestige.vercel.app';
      const redirectTo = `${redirectOrigin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        // Non-sensitive operational log; never expose token or leak email existence
        console.warn('Password recovery request status:', error.message);
      }

      // Always return neutral response to client to prevent account enumeration
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  /**
   * Update password via Supabase Auth (auth.updateUser)
   * Must be called during an active recovery session or by an authenticated user.
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Supabase authentication is not configured in this environment.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Password update could not be verified. Please request a new recovery link.' };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while updating password.';
      return { success: false, error: message };
    }
  },

  /**
   * Get the current authenticated user and profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!this.isConfigured()) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return null;

      let profile = await this.getProfile(session.user.id);

      // Self-heal: ensure itzpardhiv@gmail.com profile exists with role = 'ADMIN'
      if (session.user.email?.toLowerCase() === 'itzpardhiv@gmail.com' && (!profile || profile.role !== 'ADMIN')) {
        try {
          await supabase.rpc('restore_admin_profile', { p_user_id: session.user.id });
          profile = await this.getProfile(session.user.id);
        } catch (e) {
          console.warn('Admin self-healing restoration notice:', e);
        }
      }

      if (profile) {
        if (!profile.is_active) {
          await this.signOut();
          return null;
        }
        const user = this.mapProfileToUser(profile);
        return await this.enrichUserProfile(user);
      }

      // Safe fallback when profile trigger is delayed or table is being created
      const userMeta = session.user.user_metadata || {};
      const fallbackName = userMeta.name || userMeta.display_name || session.user.email?.split('@')[0] || 'Analyst';
      const fallbackUser = createNewUserProfile(session.user.id, session.user.email || '', fallbackName);
      return await this.enrichUserProfile(fallbackUser);
    } catch {
      return null;
    }
  },

  /**
   * Get raw ProfileRow from public.profiles
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Failed to load profile:', error.message);
        return null;
      }
      return data as ProfileRow | null;
    } catch {
      return null;
    }
  },

  /**
   * Record successful login event & update profile statistics atomically
   */
  async recordSuccessfulLogin(userId: string, email: string, userAgent: string | null): Promise<void> {
    try {
      // Try RPC first
      const { error } = await supabase.rpc('record_login_success', {
        p_user_id: userId,
        p_email: email,
        p_user_agent: userAgent,
      });

      if (error) {
        // Fallback: direct table updates
        await supabase.from('profiles').update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', userId);

        await supabase.from('login_events').insert({
          user_id: userId,
          email,
          success: true,
          user_agent: userAgent,
        });

        await supabase.from('audit_logs').insert({
          actor_user_id: userId,
          action: 'USER_LOGIN',
          target_user_id: userId,
          metadata: { email },
        });
      }
    } catch (err) {
      console.warn('Non-blocking login tracking warning:', err);
    }
  },

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(email: string, reason: string, userAgent: string | null): Promise<void> {
    try {
      // Try RPC
      const { error } = await supabase.rpc('record_login_failure', {
        p_email: email,
        p_failure_reason: reason,
        p_user_agent: userAgent,
      });

      if (error) {
        // Fallback direct insert
        await supabase.from('login_events').insert({
          email,
          success: false,
          failure_reason: reason,
          user_agent: userAgent,
        });

        await supabase.from('audit_logs').insert({
          action: 'LOGIN_FAILED',
          metadata: { email, reason },
        });
      }
    } catch (err) {
      console.warn('Non-blocking failed login tracking warning:', err);
    }
  },
};
