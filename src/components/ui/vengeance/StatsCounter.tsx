import React, { useEffect, useState, useRef } from 'react';
import { Check, ShieldCheck, Target, Activity } from 'lucide-react';
import { AnalysisMetrics } from '../../../types/cipher';

export interface StatsCounterProps {
  isAnalyzing: boolean;
  targetWordDetected?: string;
  targetWordFrozen?: boolean;
  metrics: AnalysisMetrics;
  onTargetDetected?: (word: string) => void;
  onComplete?: () => void;
}

interface CounterItem {
  id: 'chars' | 'patterns' | 'keys' | 'shifts' | 'confidence';
  label: string;
  current: number;
  target: number;
  unit: string;
  step: number;
  intervalMs: number;
  isLocked: boolean;
  lockTag?: string;
}

export const StatsCounter: React.FC<StatsCounterProps> = ({
  isAnalyzing,
  targetWordDetected,
  targetWordFrozen,
  metrics,
  onTargetDetected,
  onComplete,
}) => {
  // Independent counter states representing true asynchronous cryptanalytic pipelines
  const [charsCount, setCharsCount] = useState<number>(0);
  const [patternsCount, setPatternsCount] = useState<number>(0);
  const [keysCount, setKeysCount] = useState<number>(0);
  const [shiftsCount, setShiftsCount] = useState<number>(0);
  const [confidenceCount, setConfidenceCount] = useState<number>(0);

  // Independent lock statuses
  const [charsLocked, setCharsLocked] = useState<boolean>(false);
  const [patternsLocked, setPatternsLocked] = useState<boolean>(false);
  const [keysLocked, setKeysLocked] = useState<boolean>(false);
  const [shiftsLocked, setShiftsLocked] = useState<boolean>(false);
  const [confidenceLocked, setConfidenceLocked] = useState<boolean>(false);

  // Target values derived from actual cipher investigation payload
  const targetChars = metrics.charactersAnalyzed || 248;
  const targetPatterns = metrics.patternsTested || 37;
  const targetKeys = metrics.possibleKeys || 14;
  const targetShifts = metrics.shiftCombinations || 26;
  const targetConfidence = metrics.matchConfidence || 98.4;

  const prevAnalyzingRef = useRef<boolean>(false);

  // Reset or initialize when analysis starts
  useEffect(() => {
    if (isAnalyzing && !prevAnalyzingRef.current) {
      setCharsCount(0);
      setPatternsCount(0);
      setKeysCount(0);
      setShiftsCount(0);
      setConfidenceCount(0);

      setCharsLocked(false);
      setPatternsLocked(false);
      setKeysLocked(false);
      setShiftsLocked(false);
      setConfidenceLocked(false);
    }
    prevAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  // Sync with completed/verified state if not actively running
  useEffect(() => {
    if (!isAnalyzing && targetConfidence > 0) {
      setCharsCount(targetChars);
      setPatternsCount(targetPatterns);
      setKeysCount(targetKeys);
      setShiftsCount(targetShifts);
      setConfidenceCount(targetConfidence);

      setCharsLocked(true);
      setPatternsLocked(true);
      setKeysLocked(true);
      setShiftsLocked(true);
      setConfidenceLocked(true);
    }
  }, [isAnalyzing, targetChars, targetPatterns, targetKeys, targetShifts, targetConfidence]);

  // 1. CHARACTERS ANALYZED: Steps smoothly by 6-9 until targetChars
  useEffect(() => {
    if (!isAnalyzing || charsLocked) return;

    const interval = setInterval(() => {
      setCharsCount((prev) => {
        const next = prev + Math.floor(Math.random() * 5 + 6);
        if (next >= targetChars) {
          setCharsLocked(true);
          return targetChars;
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [isAnalyzing, charsLocked, targetChars]);

  // 2. PATTERNS TESTED: Steps smoothly by 1-2 until targetPatterns
  useEffect(() => {
    if (!isAnalyzing || patternsLocked) return;

    const interval = setInterval(() => {
      setPatternsCount((prev) => {
        const next = prev + 1;
        if (next >= targetPatterns) {
          setPatternsLocked(true);
          return targetPatterns;
        }
        return next;
      });
    }, 75);

    return () => clearInterval(interval);
  }, [isAnalyzing, patternsLocked, targetPatterns]);

  // 3. CANDIDATE KEYS: Steps by 1 until targetKeys
  useEffect(() => {
    if (!isAnalyzing || keysLocked) return;

    const interval = setInterval(() => {
      setKeysCount((prev) => {
        const next = prev + 1;
        if (next >= targetKeys) {
          setKeysLocked(true);
          return targetKeys;
        }
        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [isAnalyzing, keysLocked, targetKeys]);

  // 4. SHIFT COMBINATIONS: Sweeps 0 -> 26
  useEffect(() => {
    if (!isAnalyzing || shiftsLocked) return;

    const interval = setInterval(() => {
      setShiftsCount((prev) => {
        const next = prev + 1;
        if (next >= targetShifts) {
          setShiftsLocked(true);
          return targetShifts;
        }
        return next;
      });
    }, 65);

    return () => clearInterval(interval);
  }, [isAnalyzing, shiftsLocked, targetShifts]);

  // 5. MATCH CONFIDENCE:
  // When targetWordDetected / targetWordFrozen occurs, it locks immediately:
  // "Match Confidence 98.4% ✓ DETECTED" and remains frozen while other counters continue!
  useEffect(() => {
    if (!isAnalyzing || confidenceLocked) return;

    // If external state indicates target is detected/frozen, lock immediately at target
    if (targetWordFrozen || targetWordDetected) {
      setConfidenceCount(targetConfidence);
      setConfidenceLocked(true);
      return;
    }

    const interval = setInterval(() => {
      setConfidenceCount((prev) => {
        const step = Math.random() * 4 + 2;
        const next = Math.min(targetConfidence, prev + step);

        // Midway trigger: when confidence crosses 90%, target is detected and freezes!
        if (next >= targetConfidence * 0.95) {
          setConfidenceLocked(true);
          if (onTargetDetected) onTargetDetected('PRESTIGE');
          return targetConfidence;
        }
        return parseFloat(next.toFixed(1));
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isAnalyzing, confidenceLocked, targetWordFrozen, targetWordDetected, targetConfidence, onTargetDetected]);

  // Check if all finished
  useEffect(() => {
    if (charsLocked && patternsLocked && keysLocked && shiftsLocked && confidenceLocked) {
      if (onComplete) onComplete();
    }
  }, [charsLocked, patternsLocked, keysLocked, shiftsLocked, confidenceLocked, onComplete]);

  const items: CounterItem[] = [
    {
      id: 'chars',
      label: 'Characters Analyzed',
      current: charsCount,
      target: targetChars,
      unit: '',
      step: 7,
      intervalMs: 45,
      isLocked: charsLocked,
      lockTag: charsLocked ? '✓' : undefined,
    },
    {
      id: 'patterns',
      label: 'Patterns Tested',
      current: patternsCount,
      target: targetPatterns,
      unit: '',
      step: 1,
      intervalMs: 75,
      isLocked: patternsLocked,
      lockTag: patternsLocked ? '✓' : undefined,
    },
    {
      id: 'keys',
      label: 'Candidate Keys',
      current: keysCount,
      target: targetKeys,
      unit: '',
      step: 1,
      intervalMs: 110,
      isLocked: keysLocked,
      lockTag: keysLocked ? '✓' : undefined,
    },
    {
      id: 'shifts',
      label: 'Shift Combinations',
      current: shiftsCount,
      target: targetShifts,
      unit: '',
      step: 1,
      intervalMs: 65,
      isLocked: shiftsLocked,
      lockTag: shiftsLocked ? '✓' : undefined,
    },
    {
      id: 'confidence',
      label: 'Match Confidence',
      current: confidenceCount,
      target: targetConfidence,
      unit: '%',
      step: 3,
      intervalMs: 60,
      isLocked: confidenceLocked,
      lockTag: confidenceLocked ? (targetWordDetected ? '✓ MATCH' : '✓') : undefined,
    },
  ];

  return (
    <div className="bg-surface-card border border-border rounded-lg p-4 transition-colors">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${isAnalyzing ? 'text-brand-500 animate-pulse' : 'text-content-tertiary'}`} />
          <span className="text-xs font-medium text-content-primary">
            Cryptanalysis Metrics
          </span>
        </div>
        {targetWordDetected && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Pattern [{targetWordDetected}] Confirmed</span>
          </div>
        )}
      </div>

      {/* Grid of independent analysis counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((item) => {
          const isTargetMetric = item.id === 'confidence';
          return (
            <div
              key={item.id}
              className={`
                p-2.5 rounded-md border transition-all duration-300
                ${
                  item.isLocked
                    ? isTargetMetric && targetWordDetected
                      ? 'bg-brand-500/5 border-brand-500/30'
                      : 'bg-surface-secondary/60 border-border'
                    : 'bg-surface-secondary/30 border-border-subtle'
                }
              `}
            >
              <div className="text-[11px] text-content-secondary font-medium truncate mb-1">
                {item.label}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-technical text-base font-semibold text-content-primary tracking-tight">
                  {typeof item.current === 'number' && item.unit === '%'
                    ? item.current.toFixed(1)
                    : item.current}
                  {item.unit}
                </span>

                {item.isLocked ? (
                  <span
                    className={`
                      inline-flex items-center gap-0.5 text-[10px] font-medium px-1 py-0.2 rounded
                      ${
                        isTargetMetric && targetWordDetected
                          ? 'text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-content-secondary'
                      }
                    `}
                  >
                    {item.lockTag || <Check className="w-3 h-3 text-brand-500" />}
                  </span>
                ) : (
                  isAnalyzing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping opacity-75" />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
