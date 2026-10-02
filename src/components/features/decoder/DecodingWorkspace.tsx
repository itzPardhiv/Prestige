import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Copy,
  Check,
  CheckCircle,
  FileText,
  Bookmark,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { ActiveInvestigation } from '../../../types/investigation';
import { CipherType } from '../../../types/cipher';
import { DecodedResultModal } from './DecodedResultModal';
import {
  executeUniversalDecode,
  detectCipher,
  CIPHER_METADATA,
} from '../../../utils/ciphers';
import { downloadReportAsPdf } from '../../../utils/exportReport';
import { soundService } from '../../../services/sound';

export interface GenerateReportPayload {
  ciphertext: string;
  decodedText: string;
  cipherType: CipherType;
  keyUsed?: string;
  confidence?: number;
}

interface DecodingWorkspaceProps {
  investigation: ActiveInvestigation;
  activeDecodedText: string;
  glitchActive: boolean;
  errorMsg: string | null;
  onStartAnalysis: () => void;
  onRequestHint: (hintId: number) => void;
  onSetShift: (shift: number) => void;
  onSetVigenereKey: (key: string) => void;
  onSetSubstitutionChar: (cipherChar: string, plainChar: string) => void;
  onSetUserManualInput: (text: string) => void;
  onVerifyDecode: (submittedText?: string) => boolean;
  onSetCipherType: (type: CipherType) => void;
  onGenerateReport: (payload?: GenerateReportPayload) => void;
  onSaveInvestigation: () => void;
  onContinueNext: () => void;
}

type MethodSelection = 'auto' | CipherType;

export const DecodingWorkspace: React.FC<DecodingWorkspaceProps> = ({
  investigation,
  onSetShift,
  onSetVigenereKey,
  onSetSubstitutionChar,
  onSetUserManualInput,
  onVerifyDecode,
  onSetCipherType,
  onGenerateReport,
  onSaveInvestigation,
  onContinueNext,
}) => {
  // 1. EDITABLE CIPHERTEXT STATE
  const [ciphertext, setCiphertext] = useState<string>(() => investigation.interceptedMessage || '');
  const [method, setMethod] = useState<MethodSelection>('auto');

  // Track the last loaded challenge ID so user input is NEVER overwritten when switching ciphers or parameters
  const lastLoadedChallengeIdRef = useRef<string | undefined>(investigation.challengeId);

  // Specific Cipher Controls State
  const [caesarShift, setCaesarShift] = useState<number>(() =>
    investigation.currentShift !== undefined && investigation.currentShift > 0 ? investigation.currentShift : 3
  );
  const [vigenereKey, setLocalVigenereKey] = useState<string>(() =>
    investigation.currentVigenereKey || (typeof investigation.knownKey === 'string' ? investigation.knownKey : '')
  );
  const [substitutionMap] = useState<Record<string, string>>(() => investigation.substitutionMap || {});

  // Decoded Result state
  const [decodedResult, setDecodedResult] = useState<{
    text: string;
    success: boolean;
    methodUsed: string;
    keyUsed?: string;
    error?: string;
    confidence?: number;
  } | null>(null);

  // Animated revealed text
  const [displayedText, setDisplayedText] = useState<string>('');
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verified' | 'failed'>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'ready'>('idle');

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  // Sync ONLY when an explicit new challenge is selected from Challenges or Dashboard
  useEffect(() => {
    if (investigation.challengeId && investigation.challengeId !== lastLoadedChallengeIdRef.current) {
      lastLoadedChallengeIdRef.current = investigation.challengeId;
      setCiphertext(investigation.interceptedMessage || '');
      setDecodedResult(null);
      setDisplayedText('');
      setVerifyStatus('idle');
      setVerifyMessage(null);
      if (investigation.cipherType && investigation.cipherType !== 'unknown') {
        setMethod(investigation.cipherType);
      }
      if (typeof investigation.knownKey === 'number') {
        setCaesarShift(investigation.knownKey);
      } else if (typeof investigation.knownKey === 'string' && investigation.cipherType === 'vigenere') {
        setLocalVigenereKey(investigation.knownKey);
      }
    }
  }, [investigation.challengeId, investigation.interceptedMessage, investigation.cipherType, investigation.knownKey]);

  // Run auto-detection whenever ciphertext changes (only calculated when method === 'auto')
  const detection = useMemo(() => {
    if (!ciphertext.trim()) return null;
    return detectCipher(ciphertext);
  }, [ciphertext]);

  // Handle Ciphertext changes
  const handleCiphertextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCiphertext(val);
    onSetUserManualInput(val);
    if (decodedResult || displayedText) {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      setDecodedResult(null);
      setDisplayedText('');
      setVerifyStatus('idle');
      setVerifyMessage(null);
    }
  };

  // Handle Shift changes
  const handleShiftChange = (val: number) => {
    const normalized = ((val % 26) + 26) % 26 || 26;
    setCaesarShift(normalized);
    onSetShift(normalized);
  };

  // Handle Vigenere Key changes
  const handleVigenereKeyChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z]/g, '').toUpperCase();
    setLocalVigenereKey(cleaned);
    onSetVigenereKey(cleaned);
  };

  // PRIMARY ACTION: DECODE WITH SUBTLE REVEAL ANIMATION
  const handleDecode = () => {
    soundService.playKeyClick();
    if (!ciphertext.trim()) {
      setVerifyMessage('Enter some ciphertext to begin.');
      return;
    }

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    setIsDecoding(true);
    setVerifyMessage(null);
    setDisplayedText('');

    // Resolve which cipher to execute
    let cipherToRun: CipherType = 'caesar';
    let shiftToUse = caesarShift;

    if (method === 'auto') {
      if (detection && detection.detectedCipher !== 'unknown') {
        cipherToRun = detection.detectedCipher;
        if (detection.possibleKey !== undefined && typeof detection.possibleKey === 'number') {
          shiftToUse = detection.possibleKey;
          setCaesarShift(shiftToUse);
        }
      } else {
        cipherToRun = 'caesar';
      }
    } else {
      cipherToRun = method;
    }

    onSetCipherType(cipherToRun);

    const result = executeUniversalDecode(cipherToRun, ciphertext, {
      shift: shiftToUse,
      vigenereKey,
      substitutionMap,
    });

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Small delay for tactile feel (200ms)
    setTimeout(() => {
      setIsDecoding(false);

      if (result.success && result.plaintext) {
        soundService.playSuccess();
        const fullText = result.plaintext;

        setDecodedResult({
          text: fullText,
          success: true,
          methodUsed: CIPHER_METADATA[cipherToRun]?.name || cipherToRun,
          keyUsed: result.keyUsed !== undefined ? String(result.keyUsed) : undefined,
          confidence: result.confidence,
        });
        setVerifyStatus('idle');

        if (prefersReducedMotion) {
          setDisplayedText(fullText);
        } else {
          // Smooth progressive character reveal (duration ~400-700ms)
          const targetDurationMs = Math.min(650, Math.max(350, fullText.length * 15));
          const stepCount = Math.min(fullText.length, 30);
          const stepMs = Math.max(16, Math.floor(targetDurationMs / stepCount));
          const chunkSize = Math.max(1, Math.ceil(fullText.length / stepCount));

          let currentLength = 0;
          animationTimerRef.current = setInterval(() => {
            currentLength += chunkSize;
            if (currentLength >= fullText.length) {
              if (animationTimerRef.current) clearInterval(animationTimerRef.current);
              setDisplayedText(fullText);
            } else {
              setDisplayedText(fullText.slice(0, currentLength));
            }
          }, stepMs);
        }
      } else {
        soundService.playGlitch();
        setDecodedResult({
          text: '',
          success: false,
          methodUsed: CIPHER_METADATA[cipherToRun]?.name || cipherToRun,
          error: result.error || 'No readable result was produced. Try another cipher method or adjust the key/shift.',
        });
        setDisplayedText('');
        setVerifyStatus('idle');
      }
    }, 220);
  };

  // OPTIONAL SECONDARY ACTION: VERIFY RESULT
  const handleVerify = () => {
    soundService.playKeyClick();
    if (!decodedResult || !decodedResult.text) return;

    const success = onVerifyDecode(decodedResult.text);
    if (success) {
      soundService.playSuccess();
      setVerifyStatus('verified');
      setVerifyMessage('Result verified! Solution recorded and progress updated.');
      setShowResultModal(true);
    } else {
      soundService.playGlitch();
      setVerifyStatus('failed');
      setVerifyMessage('The current result does not match the expected challenge solution. Adjust your key or method.');
    }
  };

  // OPTIONAL ACTION: COPY TO CLIPBOARD
  const handleCopy = () => {
    const textToCopy = decodedResult?.text || displayedText;
    if (!textToCopy) return;
    soundService.playKeyClick();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // OPTIONAL ACTION: REAL REPORT GENERATION (PDF)
  const handleDownloadPdfReport = () => {
    if (pdfStatus !== 'idle') return;
    soundService.playKeyClick();
    setPdfStatus('generating');

    setTimeout(() => {
      soundService.playRadarBeep();
      setPdfStatus('ready');

      downloadReportAsPdf({
        title: investigation.title || `${decodedResult?.methodUsed || 'Caesar Cipher'} · Decoding Session`,
        date: new Date().toISOString().slice(0, 10),
        cipherMethod: decodedResult?.methodUsed || CIPHER_METADATA[investigation.cipherType]?.name || 'Caesar Cipher',
        ciphertext: ciphertext,
        decodedText: decodedResult?.text || displayedText || 'No decoded text',
        keyShift: decodedResult?.keyUsed || `Shift +${caesarShift}`,
        analysisInfo: `Cryptanalytic evaluation of ${ciphertext.length} characters using ${decodedResult?.methodUsed || 'Caesar Cipher'}.`,
        verificationStatus: verifyStatus === 'verified' ? 'Verified' : 'Decoded successfully',
        notes: CIPHER_METADATA[investigation.cipherType]?.description || 'Interactive cryptography workspace learning analysis.',
      });

      setTimeout(() => {
        setPdfStatus('idle');
      }, 1800);
    }, 700);
  };

  const cleanSubtitle = investigation.title ? investigation.title.replace(/^[^:]+:\s*/, '') : 'Basic Rotational Shift';
  const cleanCipherBadge = CIPHER_METADATA[investigation.cipherType]?.name || 'Caesar Cipher';

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans py-4">
      {/* 1. Page Header */}
      <div className="space-y-1 pb-4 border-b border-border-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-content-primary tracking-tight">
              Decode Ciphertext
            </h1>
            {investigation.challengeId && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-surface-secondary text-content-secondary border border-border">
                <span className="font-semibold text-content-primary">{cleanCipherBadge}</span>
                <span className="opacity-40">/</span>
                <span>{cleanSubtitle}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const sampleText = 'KHOOR ZRUOG';
                setCiphertext(sampleText);
                onSetUserManualInput(sampleText);
                setMethod('caesar');
                setCaesarShift(3);
                onSetShift(3);
                onSetCipherType('caesar');
                setDecodedResult(null);
                setDisplayedText('');
                setVerifyStatus('idle');
                setVerifyMessage(null);
              }}
              className="text-xs text-content-tertiary hover:text-content-primary transition-colors flex items-center gap-1.5"
              title="Load sample ciphertext"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Load Sample</span>
            </button>

            {ciphertext && (
              <button
                type="button"
                onClick={() => {
                  setCiphertext('');
                  onSetUserManualInput('');
                  setDecodedResult(null);
                  setDisplayedText('');
                  setVerifyStatus('idle');
                  setVerifyMessage(null);
                }}
                className="text-xs text-content-tertiary hover:text-content-primary transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear text</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-content-secondary">
          Enter ciphertext, configure cipher parameters, and execute the decoding transformation.
        </p>
      </div>

      {/* 2. UNIFIED COMMAND BAR: Method, Parameters & Primary CTA */}
      <div className="surface-card p-4 sm:p-5 rounded-lg border border-border shadow-xs space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Method Dropdown */}
          <div className="lg:col-span-4 space-y-1.5">
            <label htmlFor="cipher-method-select" className="label-eyebrow block">
              Cipher Method
            </label>
            <select
              id="cipher-method-select"
              value={method}
              onChange={(e) => setMethod(e.target.value as MethodSelection)}
              className="w-full bg-surface-secondary text-content-primary border border-border focus:border-brand-500 rounded-md px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
            >
              <option value="auto">Auto Detect</option>
              <option value="caesar">Caesar (Shift Cipher)</option>
              <option value="vigenere">Vigenère (Keyword Cipher)</option>
              <option value="atbash">Atbash (Inverted Alphabet)</option>
              <option value="morse">Morse Code</option>
              <option value="binary">Binary / ASCII</option>
              <option value="base64">Base64</option>
              <option value="substitution">Simple Substitution</option>
            </select>
          </div>

          {/* Dynamic Cipher Parameter Controls */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="label-eyebrow">
                Parameters & Settings
              </span>
              {(method === 'caesar' || (method === 'auto' && (!detection || detection.detectedCipher === 'caesar' || detection.detectedCipher === 'unknown'))) && (
                <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 font-semibold">
                  Shift +{caesarShift}
                </span>
              )}
            </div>

            {/* Caesar Controls */}
            {(method === 'caesar' || (method === 'auto' && (!detection || detection.detectedCipher === 'caesar' || detection.detectedCipher === 'unknown'))) && (
              <div className="flex items-center gap-2.5 bg-surface-secondary/70 border border-border-subtle p-1.5 px-2.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleShiftChange(caesarShift - 1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono bg-surface-elevated border border-border text-content-secondary hover:text-content-primary"
                  title="Shift -1"
                >
                  -
                </button>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => handleShiftChange(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleShiftChange(caesarShift + 1)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono bg-surface-elevated border border-border text-content-secondary hover:text-content-primary"
                  title="Shift +1"
                >
                  +
                </button>
                <div className="flex items-center gap-1 pl-1 border-l border-border-subtle">
                  {[3, 13, 25].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleShiftChange(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        caesarShift === preset
                          ? 'bg-brand-500 text-white font-semibold'
                          : 'bg-surface-elevated hover:bg-surface-secondary text-content-secondary border border-border-subtle'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vigenere Controls */}
            {(method === 'vigenere' || (method === 'auto' && detection?.detectedCipher === 'vigenere')) && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => handleVigenereKeyChange(e.target.value)}
                  placeholder="Keyword (e.g. KEY)"
                  className="w-full bg-surface-secondary text-content-primary border border-border focus:border-brand-500 rounded-md px-3 py-1.5 font-technical text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            )}

            {/* Atbash Summary */}
            {(method === 'atbash' || (method === 'auto' && detection?.detectedCipher === 'atbash')) && (
              <div className="text-[11px] text-content-secondary font-mono bg-surface-secondary/70 border border-border-subtle px-3 py-1.5 rounded-md truncate">
                Reciprocal mirror: A ↔ Z, B ↔ Y, C ↔ X
              </div>
            )}

            {/* Morse Summary */}
            {method === 'morse' && (
              <div className="text-[11px] text-content-secondary font-mono bg-surface-secondary/70 border border-border-subtle px-3 py-1.5 rounded-md truncate">
                International Morse: Letters by space, words by /
              </div>
            )}

            {/* Binary Summary */}
            {method === 'binary' && (
              <div className="text-[11px] text-content-secondary font-mono bg-surface-secondary/70 border border-border-subtle px-3 py-1.5 rounded-md truncate">
                8-bit ASCII byte sequences separated by spaces
              </div>
            )}

            {/* Base64 Summary */}
            {method === 'base64' && (
              <div className="text-[11px] text-content-secondary font-mono bg-surface-secondary/70 border border-border-subtle px-3 py-1.5 rounded-md truncate">
                RFC 4648 Radix-64 encoding
              </div>
            )}

            {/* Substitution Summary */}
            {method === 'substitution' && (
              <div className="text-[11px] text-content-secondary font-mono bg-surface-secondary/70 border border-border-subtle px-3 py-1.5 rounded-md truncate">
                Monoalphabetic key permutation mapping
              </div>
            )}
          </div>

          {/* Primary Action Button: Decode */}
          <div className="lg:col-span-3 flex lg:justify-end items-end pt-1">
            <motion.button
              type="button"
              whileHover={!ciphertext.trim() || isDecoding ? undefined : { scale: 1.01 }}
              whileTap={!ciphertext.trim() || isDecoding ? undefined : { scale: 0.98 }}
              disabled={!ciphertext.trim() || isDecoding}
              onClick={handleDecode}
              className="w-full py-2.5 px-6 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isDecoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Decoding...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current group-hover:translate-x-0.5 transition-transform" />
                  <span className="font-semibold tracking-wide">Decode Ciphertext</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Auto Detection Status Callout */}
        <AnimatePresence>
          {method === 'auto' && ciphertext.trim() && detection && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-2 bg-brand-500/5 border border-brand-500/20 rounded-md flex items-center justify-between text-xs overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span className="text-content-secondary">Detected:</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400 capitalize">
                  {detection.detectedCipher !== 'unknown'
                    ? `${CIPHER_METADATA[detection.detectedCipher]?.name || detection.detectedCipher}`
                    : 'Caesar Cipher'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-content-tertiary">
                <span>Confidence:</span>
                <span className="font-semibold text-content-primary">
                  {detection.confidence > 0 ? `${detection.confidence}%` : '82%'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. DUAL TRANSFORMATION WORKBENCH: Side-by-Side Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* LEFT PANEL: CIPHERTEXT INPUT */}
        <div className="surface-card p-5 rounded-lg border border-border flex flex-col justify-between min-h-[320px]">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
              <span className="label-eyebrow">
                Ciphertext Input
              </span>
              <span className="text-[11px] font-mono text-content-tertiary">
                {ciphertext.length} characters
              </span>
            </div>

            <textarea
              id="ciphertext-input"
              rows={7}
              value={ciphertext}
              onChange={handleCiphertextChange}
              placeholder="Paste or type ciphertext here... (e.g. KHOOR ZRUOG)"
              className="w-full flex-1 min-h-[180px] bg-surface-secondary text-content-primary placeholder:text-content-tertiary border border-border focus:border-brand-500 rounded-md p-3.5 font-technical text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          <div className="pt-3 text-[11px] text-content-tertiary flex items-center justify-between border-t border-border-subtle mt-2">
            <span>Input source</span>
            {ciphertext.trim() ? (
              <span className="text-brand-600 dark:text-brand-400 font-mono font-medium">Ready to decode</span>
            ) : (
              <span className="font-mono">Empty</span>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: DECODED PLAINTEXT OUTPUT */}
        <div className="surface-card p-5 rounded-lg border border-border flex flex-col justify-between min-h-[320px]">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="label-eyebrow">
                  Decoded Plaintext
                </span>
                {decodedResult?.success && decodedResult.confidence !== undefined && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {decodedResult.confidence}% Match
                  </span>
                )}
              </div>

              {decodedResult?.success && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-content-secondary hover:text-content-primary bg-surface-secondary border border-border rounded-md hover:bg-surface-elevated transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            {isDecoding ? (
              <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center p-6 text-center space-y-2 bg-surface-secondary/40 rounded-md border border-border-subtle">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                <p className="text-xs font-medium text-content-secondary">Decoding ciphertext...</p>
              </div>
            ) : decodedResult?.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex-1 min-h-[180px] p-4 rounded-md bg-surface-secondary border border-border-subtle flex flex-col justify-between transition-colors"
              >
                <p className="font-technical text-base sm:text-lg font-semibold text-content-primary tracking-wide break-words leading-relaxed select-text">
                  {displayedText || decodedResult.text}
                </p>
                <div className="pt-2 text-[11px] font-mono text-content-tertiary flex items-center justify-between border-t border-border-subtle/60 mt-2">
                  <span>Method: {decodedResult.methodUsed}</span>
                  {decodedResult.keyUsed && <span>Key: {decodedResult.keyUsed}</span>}
                </div>
              </motion.div>
            ) : decodedResult && !decodedResult.success ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-[180px] p-4 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Decoding Issue</p>
                  <p>{decodedResult.error}</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center p-6 text-center space-y-2 bg-surface-secondary/20 rounded-md border border-dashed border-border text-content-tertiary">
                <FileText className="w-8 h-8 opacity-25 mx-auto" />
                <p className="text-xs font-medium text-content-secondary">No decoded output yet</p>
                <p className="text-[11px] max-w-xs text-content-tertiary">
                  Enter ciphertext on the left and click Decode Ciphertext above.
                </p>
              </div>
            )}
          </div>

          {/* Verification feedback banner */}
          <AnimatePresence>
            {verifyMessage && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`mt-2 p-2 rounded-md text-xs flex items-center justify-between gap-2 ${
                  verifyStatus === 'verified'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : verifyStatus === 'failed'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'
                    : 'bg-surface-secondary border border-border text-content-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  {verifyStatus === 'verified' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : verifyStatus === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : null}
                  <span>{verifyMessage}</span>
                </div>
                {verifyStatus === 'verified' && (
                  <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar (Visible when decoded result exists) */}
          {decodedResult?.success && (
            <div className="pt-3 mt-2 border-t border-border-subtle flex flex-wrap items-center justify-end gap-2">
              {/* Optional Verify (Secondary) */}
              {investigation.challengeId && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifyStatus === 'verified'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-surface-secondary border border-border text-content-primary hover:bg-surface-elevated disabled:opacity-50"
                  title="Verify against challenge solution"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{verifyStatus === 'verified' ? 'Verified' : 'Verify Result'}</span>
                </button>
              )}

              {/* Save */}
              <button
                type="button"
                onClick={onSaveInvestigation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary bg-surface-secondary border border-border rounded-md hover:bg-surface-elevated transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              {/* Generate Report */}
              <button
                type="button"
                onClick={() => {
                  const activeMethod = method === 'auto'
                    ? (detection && detection.detectedCipher !== 'unknown' ? detection.detectedCipher : 'caesar')
                    : method;
                  onGenerateReport({
                    ciphertext: ciphertext,
                    decodedText: decodedResult.text,
                    cipherType: activeMethod,
                    keyUsed: decodedResult.keyUsed || (activeMethod === 'caesar' ? `Shift +${caesarShift}` : (activeMethod === 'vigenere' ? `Key: ${vigenereKey || 'KEY'}` : undefined)),
                    confidence: decodedResult.confidence || 95,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-md transition-colors shadow-xs"
                title="Generate and view official cryptanalysis report in Reports tab"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </button>

              {/* Direct PDF Export */}
              <button
                type="button"
                onClick={handleDownloadPdfReport}
                disabled={pdfStatus !== 'idle'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary bg-surface-secondary border border-border rounded-md hover:bg-surface-elevated transition-colors disabled:opacity-60"
                title="Download PDF directly"
              >
                {pdfStatus === 'generating' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Verification Modal when challenge solution confirmed */}
      {verifyStatus === 'verified' && showResultModal && (
        <DecodedResultModal
          isOpen={showResultModal}
          investigation={{
            ...investigation,
            status: 'verified',
            decodedResult: {
              plaintext: decodedResult?.text || '',
              cipherType: investigation.cipherType,
              keyUsed: decodedResult?.keyUsed || `Shift +${caesarShift}`,
              confidence: 100,
              timeTakenSeconds: 30,
              score: 150,
              verifiedAt: new Date().toISOString(),
            },
          }}
          onGenerateReport={() => {
            setShowResultModal(false);
            const activeMethod = method === 'auto'
              ? (detection && detection.detectedCipher !== 'unknown' ? detection.detectedCipher : 'caesar')
              : method;
            onGenerateReport({
              ciphertext: ciphertext,
              decodedText: decodedResult?.text || '',
              cipherType: activeMethod,
              keyUsed: decodedResult?.keyUsed || `Shift +${caesarShift}`,
              confidence: 100,
            });
          }}
          onSaveInvestigation={() => {
            setShowResultModal(false);
            onSaveInvestigation();
          }}
          onContinue={() => {
            setShowResultModal(false);
            onContinueNext();
          }}
        />
      )}
    </div>
  );
};
