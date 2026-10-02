import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, AnimatedSpan, TypingAnimation } from "./ui/terminal";
import { CheckCircle2 } from "lucide-react";

export interface TerminalDemoProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

/**
 * PRESTIGE Terminal Boot Experience
 * 
 * Creator: A.J. Pardhiv
 * Product: PRESTIGE — Cipher Intelligence System
 * 
 * Executes an authentic, sequential cryptographic boot routine
 * before transitioning smoothly into the workspace.
 */
export const TerminalDemo: React.FC<TerminalDemoProps> = ({
  onComplete,
  autoStart = true,
}) => {
  const [step, setStep] = useState<number>(0);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const handleFinish = useCallback(() => {
    if (isFinishing) return;
    setIsFinishing(true);
    // Smooth transition pause before revealing application
    setTimeout(() => {
      onComplete?.();
    }, 450);
  }, [isFinishing, onComplete]);

  // Support ESC or Space to skip boot animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Space") {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFinish]);

  // Sequential progression controller
  useEffect(() => {
    if (!autoStart) return;

    if (step === 1) {
      // Pause briefly after command 1 finishes typing, then proceed to outputs
      const timer = setTimeout(() => setStep(2), 220);
      return () => clearTimeout(timer);
    }
    if (step === 2) {
      // Outputs for phase 1 complete after 7 lines (approx 7 * 90ms = 630ms)
      const timer = setTimeout(() => setStep(3), 750);
      return () => clearTimeout(timer);
    }
    if (step === 4) {
      // Pause briefly after typing 'authenticate creator'
      const timer = setTimeout(() => setStep(5), 220);
      return () => clearTimeout(timer);
    }
    if (step === 5) {
      // Outputs for phase 2 (creator credentials)
      const timer = setTimeout(() => setStep(6), 480);
      return () => clearTimeout(timer);
    }
    if (step === 7) {
      // Pause briefly after typing 'launch'
      const timer = setTimeout(() => setStep(8), 220);
      return () => clearTimeout(timer);
    }
    if (step === 8) {
      // Outputs for phase 3 (capabilities)
      const timer = setTimeout(() => setStep(9), 700);
      return () => clearTimeout(timer);
    }
    if (step === 9) {
      // "PRESTIGE is ready." display, then transition
      const timer = setTimeout(() => {
        handleFinish();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [step, autoStart, handleFinish]);

  return (
    <AnimatePresence>
      <motion.div
        key="prestige-boot-screen"
        initial={{ opacity: 1, scale: 1 }}
        animate={
          isFinishing
            ? { opacity: 0, scale: 0.985, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
            : { opacity: 1, scale: 1 }
        }
        exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.35 } }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl"
      >
        <div className="w-full max-w-2xl relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-blue-600/10 via-transparent to-transparent blur-xl pointer-events-none" />

          <Terminal
            title="PRESTIGE — Cipher Intelligence System"
            onSkip={handleFinish}
          >
            {/* Command 1: initialize prestige */}
            <div className="flex items-center text-zinc-300">
              <span className="text-blue-400 font-semibold select-none mr-2">
                PRESTIGE@system:~$
              </span>
              <TypingAnimation
                text="initialize prestige"
                delay={100}
                speed={24}
                onComplete={() => setStep(1)}
              />
            </div>

            {/* Output 1: System Core Initializing */}
            {step >= 2 && (
              <div className="space-y-1 pt-1 pb-2">
                <AnimatedSpan delay={0} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Loading Cipher Engine...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={90} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Initializing Frequency Analysis Pipeline...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={180} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Loading Decoder Workspace...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={270} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Loading Verification Layer...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={360} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Restoring Investigation Archive...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={450} className="text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Restoring Local Workspace & Report Engine...</span>
                </AnimatedSpan>
                <AnimatedSpan delay={540} className="text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Workspace integrity verified.</span>
                </AnimatedSpan>
              </div>
            )}

            {/* Command 2: authenticate creator */}
            {step >= 3 && (
              <div className="flex items-center text-zinc-300 pt-2 border-t border-zinc-800/50">
                <span className="text-blue-400 font-semibold select-none mr-2">
                  PRESTIGE@system:~$
                </span>
                <TypingAnimation
                  text="authenticate creator"
                  delay={120}
                  speed={24}
                  onComplete={() => setStep(4)}
                />
              </div>
            )}

            {/* Output 2: Creator Identity Verification */}
            {step >= 5 && (
              <div className="space-y-1 pt-1 pb-2">
                <AnimatedSpan delay={0} className="text-zinc-200 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    Creator: <strong className="text-white font-semibold">A.J. Pardhiv</strong>
                  </span>
                </AnimatedSpan>
                <AnimatedSpan delay={120} className="text-emerald-400 font-medium flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Access granted.</span>
                </AnimatedSpan>
              </div>
            )}

            {/* Command 3: launch */}
            {step >= 6 && (
              <div className="flex items-center text-zinc-300 pt-2 border-t border-zinc-800/50">
                <span className="text-blue-400 font-semibold select-none mr-2">
                  PRESTIGE@system:~$
                </span>
                <TypingAnimation
                  text="launch"
                  delay={120}
                  speed={24}
                  onComplete={() => setStep(7)}
                />
              </div>
            )}

            {/* Output 3: Workflow Pipeline */}
            {step >= 8 && (
              <div className="space-y-1 pt-1 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <AnimatedSpan delay={0} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> INPUT
                  </AnimatedSpan>
                  <AnimatedSpan delay={60} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> ANALYZE
                  </AnimatedSpan>
                  <AnimatedSpan delay={120} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> DECODE
                  </AnimatedSpan>
                  <AnimatedSpan delay={180} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> VERIFY
                  </AnimatedSpan>
                  <AnimatedSpan delay={240} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> GENERATE REPORT
                  </AnimatedSpan>
                  <AnimatedSpan delay={300} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> STUDY
                  </AnimatedSpan>
                  <AnimatedSpan delay={360} className="text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400 font-bold">✓</span> SAVE
                  </AnimatedSpan>
                </div>

                <AnimatedSpan delay={460} className="pt-2 text-emerald-400 font-semibold text-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>PRESTIGE is ready.</span>
                </AnimatedSpan>
              </div>
            )}
          </Terminal>

          {/* Bottom subtle indicator */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono px-2 select-none">
            <span>PRESTIGE Architecture v1.0</span>
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">ESC</kbd> to skip</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
