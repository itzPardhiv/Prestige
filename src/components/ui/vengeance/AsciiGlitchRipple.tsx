import React, { useEffect, useState, useRef } from 'react';

export interface AsciiGlitchRippleProps {
  text: string;
  isGlitching?: boolean;
  triggerKey?: string | number;
  mode?: 'scramble' | 'ripple' | 'settle';
  durationMs?: number;
  className?: string;
}

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const AsciiGlitchRipple: React.FC<AsciiGlitchRippleProps> = ({
  text,
  isGlitching = false,
  triggerKey,
  mode = 'ripple',
  durationMs = 450,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const animationFrameRef = useRef<number | null>(null);
  const prevTextRef = useRef<string>(text);
  const prevTriggerRef = useRef<string | number | undefined>(triggerKey);

  useEffect(() => {
    const textChanged = prevTextRef.current !== text;
    const triggerChanged = prevTriggerRef.current !== triggerKey;
    prevTextRef.current = text;
    prevTriggerRef.current = triggerKey;

    if (!textChanged && !triggerChanged && !isGlitching) {
      setDisplayText(text);
      return;
    }

    // Trigger directional ripple character settling
    const startTime = performance.now();
    const length = text.length;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Characters settle progressively from left to right
      const settledCount = Math.floor(progress * length);

      let result = '';
      for (let i = 0; i < length; i++) {
        const char = text[i];
        if (char === ' ' || char === '\n' || char === '\t') {
          result += char;
        } else if (i < settledCount) {
          result += char;
        } else {
          // Scramble characters based on position and time
          const randIdx = Math.floor(Math.random() * GLITCH_CHARS.length);
          result += GLITCH_CHARS[randIdx];
        }
      }

      setDisplayText(result);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [text, triggerKey, isGlitching, durationMs]);

  return (
    <span className={`inline-block font-technical tracking-wider select-text ${className}`}>
      {displayText}
    </span>
  );
};
