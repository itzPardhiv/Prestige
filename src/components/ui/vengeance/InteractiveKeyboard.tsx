import React, { useEffect, useState } from 'react';
import { soundService } from '../../../services/sound';
import { ENGLISH_FREQUENCIES } from '../../../utils/frequency';

export interface InteractiveKeyboardProps {
  currentShift?: number;
  substitutionMap?: Record<string, string>;
  onKeyClick?: (char: string) => void;
  onShiftChange?: (shift: number) => void;
  onSubstitutionChange?: (orig: string, mapped: string) => void;
  mode?: 'view' | 'caesar' | 'substitution';
  activeKey?: string | null;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const InteractiveKeyboard: React.FC<InteractiveKeyboardProps> = ({
  currentShift = 0,
  substitutionMap = {},
  onKeyClick,
  onShiftChange,
  onSubstitutionChange,
  mode = 'view',
  activeKey = null,
}) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [targetLetter, setTargetLetter] = useState<string>('');

  // Physical keyboard event mirroring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        setPressedKey(key);
        soundService.playKeyClick();
        if (onKeyClick) onKeyClick(key);
      }
    };

    const handleKeyUp = () => {
      setPressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyClick]);

  const handleKeySelect = (char: string) => {
    soundService.playKeyClick();
    setSelectedLetter(char);
    if (onKeyClick) onKeyClick(char);
  };

  const handleApplySubstitution = () => {
    if (selectedLetter && targetLetter && onSubstitutionChange) {
      soundService.playSuccess();
      onSubstitutionChange(selectedLetter, targetLetter);
      setSelectedLetter(null);
      setTargetLetter('');
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-lg p-4 transition-colors">
      {/* Top Header & Frequency Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold text-content-primary">
            Interactive Tactile Crypt-Keyboard
          </span>
          <span className="text-[11px] text-content-tertiary ml-2 hidden sm:inline">
            Physical keyboard mirroring active
          </span>
        </div>

        {/* Selected letter substitution mapping control */}
        {selectedLetter && (
          <div className="flex items-center gap-2 bg-surface-secondary px-2.5 py-1 rounded border border-border text-xs">
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {selectedLetter}
            </span>
            <span className="text-content-tertiary">→</span>
            <input
              type="text"
              maxLength={1}
              value={targetLetter}
              onChange={(e) => setTargetLetter(e.target.value.toUpperCase())}
              placeholder="?"
              className="w-6 h-6 text-center font-technical font-bold text-xs bg-surface-canvas border border-border rounded text-content-primary focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <button
              onClick={handleApplySubstitution}
              className="px-2 py-0.5 bg-brand-500 text-white rounded text-[11px] font-medium hover:bg-brand-600"
            >
              Map
            </button>
            <button
              onClick={() => setSelectedLetter(null)}
              className="text-content-tertiary hover:text-content-primary text-[10px]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Caesar Alphabet Alignment Ribbon (when in caesar or view mode) */}
      <div className="mb-3 p-2 bg-surface-secondary/40 rounded border border-border-subtle overflow-x-auto">
        <div className="flex items-center gap-1 text-[10px] font-technical text-content-secondary min-w-[500px]">
          <span className="w-12 text-content-tertiary font-medium">PLAIN:</span>
          {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((c) => (
            <span key={c} className="w-4 text-center">
              {c}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-technical text-brand-600 dark:text-brand-400 font-semibold min-w-[500px] mt-0.5">
          <span className="w-12 text-content-tertiary font-medium">SHIFT+{currentShift}:</span>
          {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((_, idx) => {
            const shifted = String.fromCharCode(65 + ((idx + currentShift) % 26));
            return (
              <span key={idx} className="w-4 text-center">
                {shifted}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main QWERTY tactile keyboard chassis */}
      <div className="space-y-1.5 overflow-x-auto pb-1">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1.5 min-w-[480px]">
            {row.map((char) => {
              const freq = (ENGLISH_FREQUENCIES[char] || 0).toFixed(1);
              const isPhysicallyPressed = pressedKey === char;
              const isSelected = selectedLetter === char;
              const mappedTarget = substitutionMap[char];

              return (
                <button
                  key={char}
                  onClick={() => handleKeySelect(char)}
                  className={`
                    flex flex-col items-center justify-between w-9 sm:w-10 h-12 p-1 rounded-md border
                    transition-all duration-75 select-none
                    ${
                      isPhysicallyPressed
                        ? 'bg-brand-500 text-white font-bold scale-95 border-brand-600 shadow-inner'
                        : isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold shadow-xs'
                        : 'bg-surface-secondary/70 hover:bg-surface-secondary text-content-primary border-border hover:border-border-hover'
                    }
                  `}
                  title={`Letter ${char} (English Frequency: ${freq}%)`}
                >
                  <span className="font-technical text-xs font-semibold">
                    {char}
                  </span>

                  {mappedTarget ? (
                    <span className="text-[9px] font-technical text-brand-600 dark:text-brand-400 font-bold">
                      →{mappedTarget}
                    </span>
                  ) : (
                    <span className="text-[8px] font-technical text-content-tertiary opacity-75">
                      {freq}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
