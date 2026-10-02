import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';
import { ActiveInvestigation } from '../../../types/investigation';
import { MyAnimatedButton } from '../../ui/MyAnimatedButton';
import { modalBackdropVariants, modalDialogVariants } from '../../../lib/motion';

interface DecodedResultModalProps {
  isOpen: boolean;
  investigation: ActiveInvestigation;
  onGenerateReport: () => void;
  onSaveInvestigation: () => void;
  onContinue: () => void;
}

export const DecodedResultModal: React.FC<DecodedResultModalProps> = ({
  isOpen,
  investigation,
  onGenerateReport,
  onSaveInvestigation,
  onContinue,
}) => {
  const result = investigation.decodedResult;

  return (
    <AnimatePresence>
      {isOpen && result && (
        <motion.div
          key="result-modal-backdrop"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onContinue}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
        >
          <motion.div
            key="result-modal-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="surface-card max-w-lg w-full p-6 space-y-6 shadow-modal border border-border"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">
                    Deciphered successfully
                  </h3>
                  <p className="text-xs text-content-secondary">
                    {investigation.missionNumber} · {investigation.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onContinue}
                className="text-content-tertiary hover:text-content-primary p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side by side comparison */}
            <div className="space-y-3 bg-surface-secondary p-4 rounded-md">
              <div className="space-y-1">
                <span className="text-[11px] text-content-tertiary uppercase font-medium">Ciphertext</span>
                <div className="font-technical text-xs text-content-secondary break-words">
                  {investigation.interceptedMessage}
                </div>
              </div>

              <div className="border-t border-border-subtle pt-2 space-y-1">
                <span className="text-[11px] text-brand-600 dark:text-brand-400 uppercase font-medium">Decoded plaintext</span>
                <div className="font-technical text-sm font-semibold text-content-primary break-words">
                  {result.plaintext}
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs border-y border-border-subtle py-3 text-content-secondary">
              <div>
                <span className="text-[11px] text-content-tertiary block">Key / Offset</span>
                <span className="font-medium text-content-primary">{result.keyUsed || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-content-tertiary block">Time</span>
                <span className="font-medium text-content-primary">{result.timeTakenSeconds}s</span>
              </div>
              <div>
                <span className="text-[11px] text-content-tertiary block">Status</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Verified</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <MyAnimatedButton
                variant="ghost"
                size="sm"
                onClick={onSaveInvestigation}
              >
                Save to archive
              </MyAnimatedButton>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MyAnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={onContinue}
                >
                  Continue
                </MyAnimatedButton>

                <MyAnimatedButton
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={onGenerateReport}
                >
                  Generate report
                </MyAnimatedButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
