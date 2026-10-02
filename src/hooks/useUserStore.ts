import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types/user';
import { storageService, DEFAULT_USER_PROFILE } from '../services/storage';
import { authService } from '../services/auth';
import { supabaseAuthService } from '../services/supabaseAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useUserStore() {
  const [user, setUser] = useState<UserProfile>(() => {
    const authUser = authService.getCurrentUser();
    if (authUser) return authUser;
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

  // Initialize and subscribe to Supabase Auth state changes
  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured()) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      return;
    }

    // 1. Initial check for existing Supabase session
    const checkSupabaseSession = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (!isMountedRef.current) return;

        if (currentUser) {
          syncUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // If no Supabase user, clear stale local session
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
    if (isSupabaseConfigured()) {
      const res = await supabaseAuthService.signIn(email, pass);
      if (res.success && res.user) {
        syncUser(res.user);
        setIsAuthenticated(true);
      }
      return {
        success: res.success,
        error: res.error,
      };
    }

    // Local fallback when Supabase is not configured
    const res = authService.login(email, pass);
    if (res.success && res.user) {
      syncUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  }, [syncUser]);

  const signup = useCallback(async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured()) {
      const res = await supabaseAuthService.signUp(name, email, pass);
      if (res.success && res.user) {
        syncUser(res.user);
        setIsAuthenticated(true);
      }
      return {
        success: res.success,
        error: res.error,
      };
    }

    // Local fallback when Supabase is not configured
    const res = authService.signup(name, email, pass);
    if (res.success && res.user) {
      syncUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
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
    if (isSupabaseConfigured()) {
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
        level: undefined,
        progress: undefined,
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
    return supabaseAuthService.requestPasswordReset(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return supabaseAuthService.updatePassword(newPassword);
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
    addXp,
    recordReportGenerated,
    updateUsername,
    updateProfile,
  };
}
