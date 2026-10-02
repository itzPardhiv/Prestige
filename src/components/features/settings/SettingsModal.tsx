import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Moon, Sun, User, RotateCcw, Check, Sparkles, Terminal as TerminalIcon } from 'lucide-react';
import { UserProfile } from '../../../types/user';
import { modalBackdropVariants, modalDialogVariants } from '../../../lib/motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (name: string, callsign: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onReplayBoot?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  darkMode,
  onToggleDarkMode,
  onReplayBoot,
}) => {
  const [name, setName] = useState(user.name || user.username);
  const [callsign, setCallsign] = useState(user.callsign);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('prestige_sound') !== 'disabled';
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setName(user.name || user.username);
    setCallsign(user.callsign);
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, callsign);
    localStorage.setItem('prestige_sound', soundEnabled ? 'enabled' : 'disabled');
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
        >
          <motion.div
            key="settings-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md surface-card border border-border rounded-xl shadow-2xl p-6 space-y-6 relative transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h2 className="text-base font-semibold text-content-primary">
                  Settings & Preferences
                </h2>
                <p className="text-xs text-content-secondary">
                  Manage your learner profile and environment settings.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Profile Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-brand-500" />
                  <span>Profile Identity</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Learner Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-surface-secondary border border-border rounded-md text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1">
                      Research Callsign
                    </label>
                    <input
                      type="text"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-technical bg-surface-secondary border border-border rounded-md text-content-primary focus:outline-none focus:border-brand-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-3 pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>Environment & Display</span>
                </div>

                {/* Dark / Light Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle">
                  <div>
                    <span className="text-xs font-medium text-content-primary">Theme Mode</span>
                    <p className="text-[11px] text-content-secondary">
                      Toggle light and dark interface palette
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="p-1.5 rounded-md border border-border bg-surface-card hover:bg-surface-secondary text-content-secondary hover:text-content-primary transition-colors flex items-center gap-1.5 text-xs"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                    <span>{darkMode ? 'Dark' : 'Light'}</span>
                  </button>
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle">
                  <div>
                    <span className="text-xs font-medium text-content-primary">Audio Feedback</span>
                    <p className="text-[11px] text-content-secondary">
                      Web Audio synthesizers for typing and verification
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-1.5 rounded-md border transition-colors flex items-center gap-1.5 text-xs ${
                      soundEnabled
                        ? 'border-brand-500/50 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'border-border bg-surface-card text-content-tertiary'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
                  </button>
                </div>

                {/* Replay Boot Sequence */}
                {onReplayBoot && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle">
                    <div>
                      <span className="text-xs font-medium text-content-primary">Terminal Boot Sequence</span>
                      <p className="text-[11px] text-content-secondary">
                        Re-run the cryptographic system boot animation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onReplayBoot();
                      }}
                      className="p-1.5 rounded-md border border-border bg-surface-card hover:bg-surface-secondary text-content-secondary hover:text-content-primary transition-colors flex items-center gap-1.5 text-xs"
                    >
                      <TerminalIcon className="w-3.5 h-3.5 text-brand-500" />
                      <span>Replay</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{savedNotice ? 'Saved' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
