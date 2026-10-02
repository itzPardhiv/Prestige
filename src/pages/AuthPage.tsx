import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onSignup: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onRequestPasswordReset?: (email: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  onDemoLogin?: () => void;
  onOpenFaq?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onSignup,
  onRequestPasswordReset,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          setError('Please enter your email address.');
          setIsLoading(false);
          return;
        }

        if (onRequestPasswordReset) {
          await onRequestPasswordReset(cleanEmail);
        }

        // Privacy standard: neutral message prevents email enumeration
        setSuccessNotice('If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.');
        setIsLoading(false);
        return;
      }

      if (mode === 'signin') {
        const res = await onLogin(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials.');
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
                <span className="text-xs font-semibold text-content-primary">Password Recovery</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessNotice(null);
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
                <span>Reset Link Dispatched</span>
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

          {/* Form */}
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
                  Enter your registered email address. If an account exists, a secure recovery link will be sent.
                </p>
              )}
            </div>

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
                        setError(null);
                        setSuccessNotice(null);
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>
                {isLoading
                  ? 'Processing...'
                  : mode === 'forgot'
                  ? 'Send Recovery Link'
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
                    setError(null);
                    setSuccessNotice(null);
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

          <p className="text-[11px] text-content-tertiary text-center">
            PRESTIGE uses Supabase for authentication and operational tracking. Cipher decodes and full reports remain strictly local in your browser.
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
