import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { UserProfile } from '../types/user';

interface AdminLoginPageProps {
  onAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  onNavigateHome: () => void;
  darkMode?: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onAdminLogin,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState<string>('itzpardhiv@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Lockout countdown effect
  React.useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      setErrorMessage(`Too many failed attempts. Terminal locked for ${lockoutTimer} seconds.`);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'itzpardhiv') {
      cleanEmail = 'itzpardhiv@gmail.com';
    }
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both administrator email and master password.');
      return;
    }

    setIsLoading(true);
    soundService.playKeyClick();

    try {
      const res = await onAdminLogin(cleanEmail, password);
      if (res.success) {
        if (res.user && res.user.role !== 'ADMIN') {
          setErrorMessage('Clearance Denied: This account does not possess administrator privileges.');
          setIsLoading(false);
          return;
        }
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('prestige_admin_session_active', 'true');
        }
        setFailedAttempts(0);
        setSuccessMessage('Administrator clearance verified. Initializing operations console...');
        soundService.playRadarBeep();
      } else {
        const nextFailures = failedAttempts + 1;
        setFailedAttempts(nextFailures);
        if (nextFailures >= 5) {
          setLockoutTimer(60);
          setErrorMessage('Multiple failed clearance attempts detected. Administrative portal temporarily locked for 60 seconds.');
        } else {
          setErrorMessage(res.error || `Authentication failed. Invalid administrator credentials (${5 - nextFailures} attempts remaining).`);
        }
      }
    } catch {
      setErrorMessage('An unexpected error occurred during administrative verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12 antialiased selection:bg-amber-500/20 selection:text-amber-500">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Terminal Header Tag */}
        <div className="flex items-center justify-between px-1 mb-3 text-[11px] font-mono text-content-tertiary">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amber-500" />
            <span className="tracking-wider uppercase">RESTRICTED TERMINAL // LVL-5</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
            Admin Auth Required
          </span>
        </div>

        {/* Main Card */}
        <div className="surface-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Cyber Grid Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header Icon & Title */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-content-primary">
                Administrative Gateway
              </h1>
              <p className="text-xs text-content-secondary leading-relaxed max-w-xs mx-auto">
                Compulsory authentication required for administrative telemetry, user directories, and audit systems.
              </p>
            </div>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-semibold tracking-wider uppercase text-content-secondary"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-tertiary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@prestige.local"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-secondary/50 text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-semibold tracking-wider uppercase text-content-secondary"
                >
                  Master Security Password
                </label>
                <span className="text-[10px] text-content-tertiary font-mono">
                  SHA-256 Protected
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-tertiary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  autoFocus
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-border bg-surface-secondary/50 text-content-primary placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-tertiary hover:text-content-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockoutTimer > 0}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Clearance...</span>
                </>
              ) : lockoutTimer > 0 ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Terminal Locked ({lockoutTimer}s)</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Authenticate Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content-primary transition-colors text-[11px] font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Workspace</span>
            </button>

            <span className="text-[10px] text-content-tertiary font-mono">
              PRESTIGE // SEC-AUTH
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[10px] text-content-tertiary leading-relaxed px-4">
          All administrative operations are encrypted and audited under Row Level Security.
          Unauthorized entry attempts trigger automatic security logging.
        </p>
      </motion.div>
    </div>
  );
};
