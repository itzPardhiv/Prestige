import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user';
import { ProfileRow } from '../types/supabase';
import { DEFAULT_USER_PROFILE } from './storage';

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
   * Convert a Supabase ProfileRow into the client UserProfile format
   */
  mapProfileToUser(profile: ProfileRow): UserProfile {
    return {
      ...DEFAULT_USER_PROFILE,
      id: profile.id,
      username: profile.display_name || profile.email.split('@')[0],
      name: profile.display_name || profile.email.split('@')[0],
      email: profile.email,
      callsign: (profile.display_name || 'ANALYST').toUpperCase().slice(0, 8),
      role: profile.role as UserRole,
      stats: {
        ...DEFAULT_USER_PROFILE.stats,
        reportsGenerated: profile.report_count || 0,
      },
      joinedDate: profile.created_at,
    };
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
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
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

      const clientUser: UserProfile = profile
        ? this.mapProfileToUser(profile)
        : {
            ...DEFAULT_USER_PROFILE,
            id: data.user.id,
            email: cleanEmail,
            username: name.trim(),
            name: name.trim(),
            role: 'USER' as UserRole,
          };

      return { success: true, user: clientUser, profile: profile || undefined };
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

    const cleanEmail = email.trim().toLowerCase();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
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
      const clientUser: UserProfile = profile
        ? this.mapProfileToUser(profile)
        : {
            ...DEFAULT_USER_PROFILE,
            id: data.user.id,
            email: cleanEmail,
            role: 'USER' as UserRole,
          };

      return { success: true, user: clientUser, profile: profile || undefined };
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
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

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

      const profile = await this.getProfile(session.user.id);
      if (profile) {
        if (!profile.is_active) {
          await this.signOut();
          return null;
        }
        return this.mapProfileToUser(profile);
      }

      // Safe fallback when profile trigger is delayed or table is being created
      const userMeta = session.user.user_metadata || {};
      const fallbackName = userMeta.name || userMeta.display_name || session.user.email?.split('@')[0] || 'Analyst';
      return {
        ...DEFAULT_USER_PROFILE,
        id: session.user.id,
        email: session.user.email || '',
        username: fallbackName,
        name: fallbackName,
        role: session.user.email?.toLowerCase() === 'itzpardhiv@gmail.com' ? 'ADMIN' : 'USER',
        joinedDate: session.user.created_at || new Date().toISOString(),
      };
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
