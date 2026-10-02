import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ResetPasswordPageProps {
  onUpdatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  onNavigateHome: () => void;
  onNavigateToForgot?: () => void;
  darkMode?: boolean;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onUpdatePassword,
  onNavigateHome,
  onNavigateToForgot,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Recovery session validation
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Local development or unconfigured mode: allow inspecting and testing reset UI
      setHasValidSession(true);
      setIsCheckingSession(false);
      return;
    }

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const hasRecoveryMarker =
      hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      search.includes('code=');

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || hasRecoveryMarker) {
        setHasValidSession(true);
      } else {
        setHasValidSession(false);
      }
      setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && hasRecoveryMarker)) {
        setHasValidSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validation rules consistent with PRESTIGE policy
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim()) {
      setError('Please provide a new password.');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await onUpdatePassword(newPassword);
      // Immediately clear sensitive password strings from component memory
      setNewPassword('');
      setConfirmPassword('');

      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Failed to update password. Your recovery link may have expired.');
      }
    } catch (err: unknown) {
      setNewPassword('');
      setConfirmPassword('');
      setError(err instanceof Error ? err.message : 'An error occurred while updating your password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToSignIn = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // non-blocking
    }
    onNavigateHome();
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2.5">
        {/* Brand Wordmark & Eyebrow */}
        <div className="label-eyebrow text-brand-600 dark:text-brand-400">
          Security & Access Recovery
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-content-primary">
          PRESTIGE
        </h1>
        <p className="text-sm text-content-secondary max-w-sm mx-auto">
          {isSuccess
            ? 'Account recovery finalized successfully.'
            : 'Update your operational clearance credentials.'}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="surface-card p-6 sm:p-7 shadow-xs border border-border rounded-lg space-y-5">
          {/* Header Strip */}
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <KeyRound className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-semibold text-content-primary">
              {isSuccess ? 'Password Reset Complete' : 'Reset Account Password'}
            </span>
          </div>

          {/* Loading Session Check */}
          {isCheckingSession && (
            <div className="py-8 text-center space-y-2">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-content-secondary">Verifying recovery credentials...</p>
            </div>
          )}

          {/* Invalid or Expired Recovery Session State */}
          {!isCheckingSession && !hasValidSession && !isSuccess && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="label-eyebrow text-red-500">Recovery Link Invalid or Expired</span>
                <h2 className="text-lg font-semibold text-content-primary">Session Clearance Expired</h2>
                <p className="text-xs text-content-secondary max-w-xs mx-auto leading-relaxed">
                  This password recovery link is invalid, expired, or has already been used. Please request a new recovery link.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onNavigateToForgot || onNavigateHome}
                  className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Request New Recovery Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full py-2 px-4 bg-surface-secondary hover:bg-surface-elevated text-content-primary text-xs font-medium rounded-md border border-border transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {!isCheckingSession && isSuccess && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="label-eyebrow text-emerald-500">Credentials Updated</span>
                <h2 className="text-lg font-semibold text-content-primary">Password Successfully Changed</h2>
                <p className="text-xs text-content-secondary max-w-xs mx-auto leading-relaxed">
                  Your password has been updated securely. You can now access your PRESTIGE workspace using your new password.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleReturnToSignIn}
                  className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Form State */}
          {!isCheckingSession && hasValidSession && !isSuccess && (
            <>
              {error && (
                <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-secondary block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-9 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-secondary block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-9 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary p-0.5"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Requirements Checklist */}
                <div className="p-3 bg-surface-secondary/70 border border-border rounded-md space-y-1.5 text-[11px]">
                  <span className="font-semibold text-content-primary block mb-1">
                    Password Requirements:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-content-tertiary shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-content-secondary'}>
                      At least 6 characters long
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-content-tertiary shrink-0" />
                    )}
                    <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-content-secondary'}>
                      Password confirmation matches
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full mt-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="text-xs text-content-secondary hover:text-content-primary transition-colors"
                  >
                    Cancel and <span className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Return to Sign In</span>
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="border-t border-border-subtle pt-3 flex items-center justify-center gap-1.5 text-[11px] text-content-tertiary">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span>Encrypted transmission via Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  );
};
