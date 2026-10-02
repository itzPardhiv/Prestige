import React from 'react';
import { Sliders, Key, Zap } from 'lucide-react';
import { CipherType } from '../../../types/cipher';

interface CipherControlsProps {
  cipherType: CipherType;
  shift?: number;
  onShiftChange?: (shift: number) => void;
  vigenereKey?: string;
  onVigenereKeyChange?: (key: string) => void;
  onAutoDetectCaesar?: () => void;
  className?: string;
}

export const CipherControls: React.FC<CipherControlsProps> = ({
  cipherType,
  shift = 0,
  onShiftChange,
  vigenereKey = '',
  onVigenereKeyChange,
  onAutoDetectCaesar,
  className = '',
}) => {
  return (
    <div className={`surface-card p-4 space-y-4 font-sans text-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <span className="font-semibold text-content-primary">
          Decryption controls · <span className="capitalize">{cipherType}</span>
        </span>
        {cipherType === 'caesar' && onAutoDetectCaesar && (
          <button
            type="button"
            onClick={onAutoDetectCaesar}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Auto-detect shift
          </button>
        )}
      </div>

      {/* Caesar Shift Slider & Steppers */}
      {cipherType === 'caesar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-content-secondary">Rotational offset</span>
            <span className="font-technical text-content-primary font-semibold text-sm">+{shift}</span>
          </div>

          <input
            type="range"
            min="0"
            max="25"
            value={shift}
            onChange={(e) => onShiftChange && onShiftChange(parseInt(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer h-1.5 bg-surface-secondary rounded-lg"
          />

          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[11px] text-content-tertiary mr-1">Presets:</span>
            {[1, 2, 3, 5, 7, 13, 19, 23].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onShiftChange && onShiftChange(val)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  shift === val
                    ? 'bg-brand-500 text-white font-medium'
                    : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
                }`}
              >
                +{val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vigenere Passphrase Input */}
      {cipherType === 'vigenere' && (
        <div className="space-y-2">
          <label className="block text-content-secondary text-xs">
            Passphrase keyword
          </label>
          <div className="relative">
            <input
              type="text"
              value={vigenereKey}
              onChange={(e) => onVigenereKeyChange && onVigenereKeyChange(e.target.value.toUpperCase())}
              placeholder="e.g. LEMON"
              className="w-full bg-surface-secondary border border-border rounded-md px-3 py-1.5 text-xs text-content-primary font-technical uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <Key className="w-3.5 h-3.5 text-content-tertiary absolute right-2.5 top-2.5" />
          </div>
        </div>
      )}

      {/* Atbash Summary */}
      {cipherType === 'atbash' && (
        <div className="text-content-secondary text-xs leading-relaxed">
          Reciprocal alphabet mapping is active (<span className="font-technical text-content-primary">A ↔ Z</span>). No rotational variable key required.
        </div>
      )}

      {/* Morse Code Summary */}
      {cipherType === 'morse' && (
        <div className="text-content-secondary text-xs leading-relaxed">
          Standard international timing. Letters delimited by space, words by slash (<span className="font-technical text-content-primary">/</span>).
        </div>
      )}

      {/* Binary / Base64 Summary */}
      {(cipherType === 'binary' || cipherType === 'base64') && (
        <div className="text-content-secondary text-xs leading-relaxed">
          {cipherType === 'binary'
            ? 'Translates 8-bit ASCII bitstream to UTF-8 character representation.'
            : 'Decodes RFC 4648 radix-64 payload into plain text stream.'}
        </div>
      )}

      {/* Substitution Summary */}
      {cipherType === 'substitution' && (
        <div className="text-content-secondary text-xs leading-relaxed">
          Use the keyboard matrix below to map arbitrary ciphertext characters to target plaintext letters.
        </div>
      )}
    </div>
  );
};
