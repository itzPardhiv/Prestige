import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { soundService } from "../../services/sound";
import { cn } from "../../lib/utils";

export interface TerminalProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  onSkip?: () => void;
  showWindowControls?: boolean;
}

/**
 * Polished macOS-style terminal container for PRESTIGE
 */
export const Terminal: React.FC<TerminalProps> = ({
  children,
  className,
  title = "PRESTIGE — Cipher Intelligence System",
  onSkip,
  showWindowControls = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new output appears
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-[#0c0c0e] text-zinc-100 shadow-2xl overflow-hidden font-mono text-xs sm:text-sm antialiased transition-all",
        className
      )}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border-b border-zinc-800/80 select-none">
        <div className="flex items-center space-x-2">
          {showWindowControls && (
            <>
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block" />
            </>
          )}
          <span className="ml-2 text-xs font-medium text-zinc-400 tracking-wide truncate">
            {title}
          </span>
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition-colors"
            title="Skip sequence (ESC or Space)"
          >
            Skip [ESC]
          </button>
        )}
      </div>

      {/* Terminal Viewport */}
      <div
        ref={scrollRef}
        className="p-5 overflow-y-auto max-h-[460px] min-h-[340px] space-y-2 leading-relaxed scroll-smooth"
      >
        {children}
      </div>
    </div>
  );
};

export interface AnimatedSpanProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * AnimatedSpan reveals sequentially with subtle fade-in
 */
export const AnimatedSpan: React.FC<AnimatedSpanProps> = ({
  children,
  delay = 0,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={cn("block", className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: delay / 1000, ease: "easeOut" }}
      className={cn("block", className)}
    >
      {children}
    </motion.div>
  );
};

export interface TypingAnimationProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  playAudio?: boolean;
}

/**
 * TypingAnimation types text character-by-character with optional subtle keystroke sound
 */
export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  delay = 0,
  speed = 28,
  className,
  onComplete,
  playAudio = true,
}) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedText(text);
      onComplete?.();
      return;
    }

    const startTimer = setTimeout(() => {
      setHasStarted(true);
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          const nextChar = text.charAt(currentIndex);
          setDisplayedText((prev) => prev + nextChar);
          currentIndex++;

          if (playAudio && Math.random() > 0.3) {
            try {
              soundService.playKeyClick();
            } catch {
              // Gracefully continue without audio
            }
          }
        } else {
          clearInterval(interval);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, delay, speed, shouldReduceMotion]);

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      {hasStarted && displayedText.length < text.length && (
        <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-zinc-200 animate-pulse" />
      )}
    </span>
  );
};
