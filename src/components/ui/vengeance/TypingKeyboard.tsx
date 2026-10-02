import React, { useEffect, useState, useRef } from 'react';
import { soundService } from '../../../services/sound';

export interface TypingKeyboardProps {
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
  durationMs?: number;
}

const PHRASES = [
  'Generating decoding report...',
  'Analyzing cipher profile...',
  'Writing cryptanalytic findings...',
  'Preparing educational breakdown...',
  'Finalizing decoding report...',
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '␣'],
];

export const TypingKeyboard: React.FC<TypingKeyboardProps> = ({
  message = 'Generating decoding report...',
  subMessage,
  onComplete,
  durationMs = 2400,
}) => {
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(0);
  const [typedChars, setTypedChars] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    let charIdx = 0;
    let phraseIdx = 0;
    const phrase = PHRASES[phraseIdx];
    const totalPhrases = PHRASES.length;

    const interval = setInterval(() => {
      if (phraseIdx >= totalPhrases) {
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          if (onComplete) onComplete();
        }
        return;
      }

      const activePhrase = PHRASES[phraseIdx];
      if (charIdx < activePhrase.length) {
        const nextChar = activePhrase[charIdx];
        setTypedChars(activePhrase.slice(0, charIdx + 1));
        setActiveKey(nextChar.toUpperCase() === ' ' ? '␣' : nextChar.toUpperCase());
        soundService.playKeyClick();
        charIdx++;
      } else {
        // Move to next phrase
        phraseIdx++;
        setCurrentPhraseIdx(phraseIdx);
        charIdx = 0;
        setTypedChars('');
      }

      const totalSteps = totalPhrases * 15;
      const currentStep = phraseIdx * 15 + charIdx;
      setProgressPercent(Math.min(100, Math.round((currentStep / totalSteps) * 100)));
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-surface-card border border-border rounded-xl shadow-sm text-center">
      {/* Header text */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-content-primary mb-1">
          {message}
        </h4>
        <p className="text-xs text-content-secondary min-h-[1.25rem] font-technical">
          {typedChars}
          <span className="inline-block w-1.5 h-3 ml-0.5 bg-brand-500 animate-pulse align-middle" />
        </p>
      </div>

      {/* Vengeance UI mechanical keyboard matrix */}
      <div className="p-3 bg-surface-secondary/70 border border-border rounded-lg inline-block mx-auto mb-4 select-none">
        <div className="space-y-1">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1">
              {row.map((k) => {
                const isPressed = activeKey === k;
                return (
                  <div
                    key={k}
                    className={`
                      w-6 h-6 rounded flex items-center justify-center text-[10px] font-technical transition-all duration-75
                      ${
                        isPressed
                          ? 'bg-brand-500 text-white font-bold scale-95 shadow-inner'
                          : 'bg-surface-canvas text-content-secondary border border-border/80 shadow-xs'
                      }
                      ${k === '␣' ? 'w-14' : ''}
                    `}
                  >
                    {k}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Linear progress bar */}
      <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-brand-500 h-full transition-all duration-150 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-[10px] text-content-tertiary font-technical">
        <span>{subMessage || 'Synthesizing cryptanalysis report'}</span>
        <span>{progressPercent}%</span>
      </div>
    </div>
  );
};
