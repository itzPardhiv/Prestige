import React, { useEffect, useState } from "react";
import { motion, useReducedMotion, Transition, Variants } from "framer-motion";
import { cn } from "./utils";

/**
 * Standard PRESTIGE motion tokens
 * Professional, restrained, Apple-like easing and durations.
 */
export const motionTokens = {
  duration: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
  },
  ease: {
    page: [0.16, 1, 0.3, 1], // ease-out quad/cubic blend
    micro: [0.4, 0, 0.2, 1], // standard ease-in-out
    emphasized: [0.05, 0.7, 0.1, 1.0],
  },
} as const;

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.ease.page,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: motionTokens.duration.fast,
      ease: motionTokens.ease.micro,
    },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.ease.page,
    },
  },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

export const modalDialogVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

/**
 * Reusable animated page container wrapper
 */
export const AnimatedPage: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className, id }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      initial={shouldReduceMotion ? { opacity: 0 } : "initial"}
      animate={shouldReduceMotion ? { opacity: 1 } : "animate"}
      exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
      variants={shouldReduceMotion ? undefined : pageVariants}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
};

/**
 * Reusable card with subtle hover micro-interaction
 */
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverElevation?: boolean;
}> = ({ children, className, onClick, hoverElevation = true }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : staggerItemVariants}
      whileHover={
        hoverElevation && !shouldReduceMotion
          ? {
              y: -2,
              transition: { duration: 0.18, ease: "easeOut" },
            }
          : undefined
      }
      whileTap={
        onClick && !shouldReduceMotion
          ? {
              scale: 0.99,
              transition: { duration: 0.1 },
            }
          : undefined
      }
      onClick={onClick}
      className={cn("transition-colors", className)}
    >
      {children}
    </motion.div>
  );
};

/**
 * Reusable number counter that animates smoothly from zero to target value
 */
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({
  value,
  duration = 0.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;

    let frameId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, shouldReduceMotion]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
