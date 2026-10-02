import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, BookOpen, Lock, Check } from 'lucide-react';
import { modalBackdropVariants, modalDialogVariants } from '../../../lib/motion';

interface TermsPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPoliciesModal: React.FC<TermsPoliciesModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="terms-modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
        >
          <motion.div
            key="terms-modal-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg surface-card border border-border rounded-xl shadow-2xl p-6 space-y-5 relative transition-colors max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle sticky top-0 bg-surface-card z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-brand-500/10 text-brand-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-content-primary">
                    Terms & Privacy Policies
                  </h2>
                  <p className="text-xs text-content-secondary">
                    PRESTIGE Educational Cryptography Platform
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs text-content-secondary leading-relaxed">
              <div className="p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle space-y-1">
                <h3 className="font-semibold text-content-primary flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                  1. Educational Scope & Intended Use
                </h3>
                <p>
                  PRESTIGE is designed solely as an interactive academic and educational cryptography simulator. All algorithms—including Caesar, Vigenère, Atbash, Substitution, Morse, and Base64—are intended to demonstrate mathematical transformations, historical cryptanalysis techniques, and computational principles in computer science.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle space-y-1">
                <h3 className="font-semibold text-content-primary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  2. Privacy, Supabase Backend & Local-First Architecture
                </h3>
                <p>
                  PRESTIGE utilizes a hybrid architecture pairing secure cloud authentication with client-side privacy:
                </p>
                <div className="space-y-1.5 pt-1 text-content-secondary">
                  <p className="font-medium text-content-primary text-[11px]">Backend Services (Supabase PostgreSQL & Auth):</p>
                  <ul className="list-disc list-inside space-y-0.5 text-content-tertiary pl-1">
                    <li>Account authentication and persistent sessions (Supabase Auth)</li>
                    <li>Basic profile metadata (display name, callsign, account role, timestamp)</li>
                    <li>Security login telemetry (timestamp, success/failure status, client platform)</li>
                    <li>Operational report metadata (Report ID, cipher type used, character count, verification status)</li>
                    <li>System audit log events governed strictly by Row Level Security (RLS)</li>
                  </ul>
                  <p className="font-medium text-content-primary text-[11px] pt-1">Client-Side Local Storage (Browser):</p>
                  <ul className="list-disc list-inside space-y-0.5 text-content-tertiary pl-1">
                    <li>Zero server transmission of plaintext inputs, ciphertexts, or decoded solutions</li>
                    <li>Full technical cryptanalysis dossiers and investigations remain in browser <code className="font-mono text-[11px] text-content-primary">localStorage</code></li>
                    <li>PDF, TXT, and Markdown exports are compiled strictly client-side</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-secondary/60 border border-border-subtle space-y-1">
                <h3 className="font-semibold text-content-primary flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-500" />
                  3. Ethics & Responsible Learning
                </h3>
                <p>
                  Users agree to use PRESTIGE for lawful academic, research, and self-study purposes. PRESTIGE does not implement modern industrial ciphers (e.g. AES-GCM, RSA, ECC) and should not be used as a production secret-storage system.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
              <span className="text-[11px] text-content-tertiary">
                Version 1.0 · Last updated 2026
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
