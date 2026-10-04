import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';
import { authService } from '../services/auth';
import { USE_LOCAL_DEV_AUTH } from '../config/authMode';

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onSignup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onRequestPasswordReset?: (email: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onResetPasswordLocal?: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onDemoLogin?: () => void;
  onOpenFaq?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onSignup,
  onRequestPasswordReset,
  onResetPasswordLocal,
  onDemoLogin,
  onOpenFaq,
  darkMode,
  onToggleDarkMode,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Local interactive forgot-password flow states
  const [forgotStep, setForgotStep] = useState<'find' | 'reset' | 'success'>('find');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForgotFlow = () => {
    setForgotStep('find');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessNotice(null);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your account email address.');
      return;
    }

    if (cleanEmail === 'itzpardhiv@gmail.com') {
      setError('Password recovery is restricted for this administrative account.');
      return;
    }

    // In Production Supabase Mode, dispatch a real recovery email via Supabase Auth
    if (!USE_LOCAL_DEV_AUTH) {
      setIsLoading(true);
      try {
        if (onRequestPasswordReset) {
          const res = await onRequestPasswordReset(cleanEmail);
          if (res.success) {
            setForgotStep('success');
            setSuccessNotice('A secure recovery link has been dispatched to your email address.');
          } else {
            setError(res.error || 'Failed to dispatch recovery email. Please try again.');
          }
        } else {
          setError('Password recovery service is unavailable.');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred while requesting password reset.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (forgotStep === 'find') {
      setIsLoading(true);
      try {
        const hasAccount = authService.hasAccount(cleanEmail);
        if (!hasAccount) {
          setError('No account found with this email address. Please check your credentials or create a new account.');
          setIsLoading(false);
          return;
        }
        // Account located locally; advance to new password creation
        setForgotStep('reset');
      } catch {
        setError('Failed to verify local account.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (forgotStep === 'reset') {
      if (!newPassword) {
        setError('Please enter a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Password confirmation does not match.');
        return;
      }

      setIsLoading(true);
      try {
        let res: { success: boolean; error?: string };
        if (onResetPasswordLocal) {
          res = await onResetPasswordLocal(cleanEmail, newPassword);
        } else {
          res = await authService.resetPasswordLocal(cleanEmail, newPassword);
        }

        // Immediately wipe plaintext password strings from component memory
        setNewPassword('');
        setConfirmPassword('');

        if (res.success) {
          setForgotStep('success');
        } else {
          setError(res.error || 'Failed to update password.');
        }
      } catch (err: unknown) {
        setNewPassword('');
        setConfirmPassword('');
        setError(err instanceof Error ? err.message : 'An error occurred while resetting password.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot') {
      return handleForgotSubmit(e);
    }

    setError(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await onLogin(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid email or password.');
          setIsLoading(false);
        }
      } else {
        const res = await onSignup(name, email, password);
        if (!res.success) {
          setError(res.error || 'Failed to create account.');
          setIsLoading(false);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An authentication error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-content-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2.5">
        {/* Brand Wordmark & Eyebrow */}
        <div className="label-eyebrow text-brand-600 dark:text-brand-400">
          Interactive Cryptography Platform
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-content-primary">
          PRESTIGE
        </h1>
        <p className="text-sm text-content-secondary max-w-sm mx-auto">
          Sign in to access your personalized learning workspace, saved cipher analyses, and challenge progress.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="surface-card p-6 sm:p-7 shadow-xs border border-border rounded-lg space-y-5">
          {/* Mode Switch Tabs or Password Recovery Header */}
          {mode === 'forgot' ? (
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold text-content-primary">
                  {forgotStep === 'success' ? 'Password Reset Complete' : 'Local Password Reset'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetForgotFlow();
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="flex rounded-lg bg-surface-secondary p-1 border border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === 'signin'
                    ? 'bg-surface-elevated text-content-primary shadow-sm font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === 'signup'
                    ? 'bg-surface-elevated text-content-primary shadow-sm font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successNotice && (
            <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Notice</span>
              </div>
              <p className="leading-relaxed">{successNotice}</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          {/* Forgot Password: Step 3 Success Display */}
          {mode === 'forgot' && forgotStep === 'success' ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="label-eyebrow text-emerald-500">
                  {!USE_LOCAL_DEV_AUTH ? 'Recovery Link Sent' : 'Credentials Updated'}
                </span>
                <h2 className="text-lg font-semibold text-content-primary">
                  {!USE_LOCAL_DEV_AUTH ? 'Check Your Email' : 'Password Successfully Changed'}
                </h2>
                <p className="text-xs text-content-secondary max-w-xs mx-auto leading-relaxed">
                  {!USE_LOCAL_DEV_AUTH
                    ? 'A secure password recovery email has been sent. Follow the link to reset your credentials on the recovery terminal.'
                    : 'Your new password has been cryptographically hashed (SHA-256) and saved locally. Plaintext passwords are never stored.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    resetForgotFlow();
                  }}
                  className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Forms (Signin / Signup / Forgot Step 1 & 2) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-secondary block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Input (Always shown for Signin, Signup, and Forgot Step 1) */}
              {(mode !== 'forgot' || forgotStep === 'find') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-secondary block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                  {mode === 'forgot' && (
                    <p className="text-[11px] text-content-tertiary">
                      {!USE_LOCAL_DEV_AUTH
                        ? 'Enter your registered email address to receive a secure recovery link.'
                        : 'Enter the registered email of your local account to proceed with password reset.'}
                    </p>
                  )}
                </div>
              )}

              {/* Forgot Step 2: Show Verified Target Account */}
              {mode === 'forgot' && forgotStep === 'reset' && (
                <div className="p-2.5 rounded-md bg-surface-secondary border border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="font-mono text-content-primary truncate">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep('find')}
                    className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline shrink-0 font-medium"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Password Input for Sign In / Sign Up */}
              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-content-secondary block">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          resetForgotFlow();
                        }}
                        className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
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
              )}

              {/* Forgot Step 2: New Password & Confirm New Password */}
              {mode === 'forgot' && forgotStep === 'reset' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-content-secondary block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-9 py-2 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary p-0.5"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

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
                        placeholder="Re-enter new password"
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
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {isLoading
                    ? 'Processing...'
                    : mode === 'forgot'
                    ? !USE_LOCAL_DEV_AUTH
                      ? 'Send Recovery Link'
                      : forgotStep === 'find'
                      ? 'Find Account & Continue'
                      : 'Save New Password'
                    : mode === 'signin'
                    ? 'Sign In to Workspace'
                    : 'Create Learner Account'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {mode === 'forgot' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetForgotFlow();
                    }}
                    className="text-xs text-content-secondary hover:text-content-primary transition-colors"
                  >
                    Remember your password?{' '}
                    <span className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                      Sign In
                    </span>
                  </button>
                </div>
              )}
            </form>
          )}

          <p className="text-[11px] text-content-tertiary text-center">
            {USE_LOCAL_DEV_AUTH
              ? 'PRESTIGE local development mode: passwords are cryptographically hashed (SHA-256). All ciphers and reports remain local on your device.'
              : 'PRESTIGE security clearance active. Authentication and authorization are protected by Supabase & PostgreSQL RLS.'}
          </p>
        </div>

        {/* Learning Pillars Preview: Cohesive Feature Strip */}
        <div className="mt-6 surface-card divide-x divide-border-subtle grid grid-cols-3 rounded-lg border border-border text-center overflow-hidden">
          <div className="p-3 space-y-1">
            <div className="text-[11px] font-semibold text-content-primary">Learn & Analyze</div>
            <p className="text-[10px] text-content-secondary leading-snug">Understand cipher mathematics & letter frequencies</p>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-[11px] font-semibold text-content-primary">Hands-on Practice</div>
            <p className="text-[10px] text-content-secondary leading-snug">Interactive decoders for Caesar, Vigenère, and more</p>
          </div>
          <div className="p-3 space-y-1">
            <div className="text-[11px] font-semibold text-content-primary">Track Progress</div>
            <p className="text-[10px] text-content-secondary leading-snug">Track investigations, verify decodes, and export PDF reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};
