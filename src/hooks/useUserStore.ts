import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types/user';
import { storageService, DEFAULT_USER_PROFILE } from '../services/storage';
import { authService } from '../services/auth';
import { supabaseAuthService } from '../services/supabaseAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { USE_LOCAL_DEV_AUTH } from '../config/authMode';

export function useUserStore() {
  const [user, setUser] = useState<UserProfile>(() => {
    const authUser = authService.getCurrentUser();
    if (authUser) {
      // Anti-tamper check on initial state derivation
      if (authUser.role === 'ADMIN' && authUser.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
        authUser.role = 'USER';
      }
      if (authUser.name === 'Alex Morgan' || authUser.username === 'Alex Morgan') {
        authUser.name = 'User / Learner';
        authUser.username = 'User / Learner';
        authUser.email = 'learner@prestige.local';
        authUser.callsign = 'LEARNER-01';
      }
      return authUser;
    }
    return storageService.getUserProfile();
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return authService.getCurrentSession() !== null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const isMountedRef = useRef(true);

  const syncUser = useCallback((updated: UserProfile) => {
    // Single-Admin Security Rule: only itzpardhiv@gmail.com can possess ADMIN privileges
    if (updated.role === 'ADMIN' && updated.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
      updated = { ...updated, role: 'USER' };
    }
    setUser(updated);
    storageService.saveUserProfile(updated);
    authService.saveCurrentUser(updated);
  }, []);

  // Initialize and subscribe to Auth state changes
  useEffect(() => {
    isMountedRef.current = true;

    // TEMPORARY LOCAL DEVELOPMENT AUTHENTICATION MODE:
    // Restore session purely from Chrome localStorage without requiring Supabase email recovery
    if (USE_LOCAL_DEV_AUTH || !isSupabaseConfigured()) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        if (currentUser.role === 'ADMIN' && currentUser.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
          currentUser.role = 'USER';
        }
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      return;
    }

    // 1. Initial check for existing Supabase session (used when USE_LOCAL_DEV_AUTH is false)
    const checkSupabaseSession = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!isMountedRef.current) return;

        if (currentUser) {
          syncUser(currentUser);
          setIsAuthenticated(true);
        } else {
          if (authService.getCurrentSession()) {
            authService.logout();
          }
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingAuth(false);
        }
      }
    };

    checkSupabaseSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profileUser = await supabaseAuthService.getCurrentUser();
          if (profileUser && isMountedRef.current) {
            syncUser(profileUser);
            setIsAuthenticated(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        authService.logout();
        if (isMountedRef.current) {
          setIsAuthenticated(false);
          setUser(storageService.getUserProfile() || DEFAULT_USER_PROFILE);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [syncUser]);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // When in local development mode, authenticate using Chrome localStorage & Web Crypto SHA-256
    if (USE_LOCAL_DEV_AUTH || !isSupabaseConfigured()) {
      const res = await authService.login(email, pass);
      if (res.success && res.user) {
        syncUser(res.user);
        setIsAuthenticated(true);
      }
      return res;
    }

    // Production Supabase Auth path
    const res = await supabaseAuthService.signIn(email, pass);
    if (res.success && res.user) {
      syncUser(res.user);
      setIsAuthenticated(true);
    }
    return {
      success: res.success,
      error: res.error,
    };
  }, [syncUser]);

  const signup = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // When in local development mode, register using Chrome localStorage & Web Crypto SHA-256
    if (USE_LOCAL_DEV_AUTH || !isSupabaseConfigured()) {
      const res = await authService.signup(name, email, pass);
      if (res.success && res.user) {
        syncUser(res.user);
        setIsAuthenticated(true);
      }
      return res;
    }

    // Production Supabase Auth path
    const res = await supabaseAuthService.signUp(name, email, pass);
    if (res.success && res.user) {
      syncUser(res.user);
      setIsAuthenticated(true);
    }
    return {
      success: res.success,
      error: res.error,
    };
  }, [syncUser]);

  const demoLogin = useCallback(() => {
    const res = authService.demoLogin();
    if (res.success && res.user) {
      syncUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  }, [syncUser]);

  const logout = useCallback(async () => {
    if (!USE_LOCAL_DEV_AUTH && isSupabaseConfigured()) {
      await supabaseAuthService.signOut();
    }
    authService.logout();
    setIsAuthenticated(false);
    setUser(DEFAULT_USER_PROFILE);
  }, []);

  const addXp = useCallback((_amount: number, solvedChallengeId?: string, timeSeconds?: number) => {
    setUser((prev) => {
      const newCodesDecoded = solvedChallengeId ? prev.stats.codesDecoded + 1 : prev.stats.codesDecoded;
      const newFastest = timeSeconds && (prev.stats.fastestSolveSeconds === 0 || timeSeconds < prev.stats.fastestSolveSeconds)
        ? timeSeconds 
        : prev.stats.fastestSolveSeconds;

      const completedIds = solvedChallengeId && !prev.completedChallengeIds.includes(solvedChallengeId)
        ? [...prev.completedChallengeIds, solvedChallengeId]
        : prev.completedChallengeIds;

      const updatedProfile: UserProfile = {
        ...prev,
        completedChallengeIds: completedIds,
        stats: {
          ...prev.stats,
          codesDecoded: newCodesDecoded,
          fastestSolveSeconds: newFastest,
        },
      };

      storageService.saveUserProfile(updatedProfile);
      authService.saveCurrentUser(updatedProfile);
      return updatedProfile;
    });
  }, []);

  const recordReportGenerated = useCallback(() => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        stats: {
          ...prev.stats,
          reportsGenerated: prev.stats.reportsGenerated + 1,
        },
      };
      storageService.saveUserProfile(updated);
      authService.saveCurrentUser(updated);
      return updated;
    });
  }, []);

  const updateUsername = useCallback((newUsername: string, newCallsign: string) => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        username: newUsername || prev.username,
        name: newUsername || prev.name || prev.username,
        callsign: newCallsign || prev.callsign,
      };
      storageService.saveUserProfile(updated);
      authService.saveCurrentUser(updated);
      return updated;
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        ...updates,
      };
      storageService.saveUserProfile(updated);
      authService.saveCurrentUser(updated);
      return updated;
    });
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (email.trim().toLowerCase() === 'itzpardhiv@gmail.com') {
      return { success: false, error: 'Password recovery is restricted for this administrative account.' };
    }
    if (USE_LOCAL_DEV_AUTH) {
      const hasAcct = authService.hasAccount(email);
      if (!hasAcct) {
        return { success: false, error: 'No account found with this email address.' };
      }
      return { success: true };
    }
    return supabaseAuthService.requestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    const targetEmail = email?.trim().toLowerCase() || user?.email?.toLowerCase() || authService.getCurrentSession()?.email?.toLowerCase();
    if (targetEmail === 'itzpardhiv@gmail.com') {
      return { success: false, error: 'Password reset is restricted for this administrative account.' };
    }
    if (USE_LOCAL_DEV_AUTH) {
      if (!targetEmail) {
        return { success: false, error: 'Unable to identify account for password update. Please provide your email.' };
      }
      return authService.resetPasswordLocal(targetEmail, newPassword);
    }
    return supabaseAuthService.updatePassword(newPassword);
  }, [user]);

  const resetPasswordLocal = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return authService.resetPasswordLocal(email, newPassword);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoadingAuth,
    login,
    signup,
    demoLogin,
    logout,
    requestPasswordReset,
    updatePassword,
    resetPasswordLocal,
    addXp,
    recordReportGenerated,
    updateUsername,
    updateProfile,
  };
}
