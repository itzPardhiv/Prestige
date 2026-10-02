import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveInvestigation } from '../types/investigation';
import { Challenge } from '../types/challenge';
import { CipherType, AnalysisMetrics } from '../types/cipher';
import { INITIAL_CHALLENGES } from '../data/mockChallenges';
import { executeUniversalDecode, detectCaesarShift } from '../utils/ciphers';
import { soundService } from '../services/sound';

export function useDecoder(initialChallengeId: string = 'mission-07') {
  const currentChallenge = INITIAL_CHALLENGES.find((c) => c.id === initialChallengeId) || INITIAL_CHALLENGES[1];

  const [investigation, setInvestigation] = useState<ActiveInvestigation>(() => ({
    id: `INV-${Date.now()}`,
    challengeId: currentChallenge.id,
    missionNumber: currentChallenge.missionNumber,
    title: currentChallenge.title,
    cipherType: currentChallenge.cipherType,
    difficulty: currentChallenge.difficulty,
    threatLevel: currentChallenge.threatLevel,
    source: currentChallenge.source,
    interceptedMessage: currentChallenge.interceptedMessage,
    expectedAnswer: currentChallenge.expectedAnswer,
    knownKey: currentChallenge.key,
    userInput: '',
    targetKeywords: currentChallenge.targetKeywords || ['PRESTIGE'],
    currentShift: 0,
    currentVigenereKey: '',
    substitutionMap: {},
    status: 'idle',
    startTime: Date.now(),
    elapsedSeconds: 0,
    hintsUsed: 0,
    penaltyXp: 0,
    attempts: 0,
    terminalLogs: [
      '> PRESTIGE CIPHER ENGINE READY',
      '> READY FOR CIPHERTEXT INPUT',
    ],
    metrics: {
      charactersAnalyzed: 0,
      patternsTested: 0,
      possibleKeys: 0,
      shiftCombinations: 0,
      matchConfidence: 0,
      targetWordDetected: undefined,
      targetWordFrozen: false,
    },
  }));

  const [activeDecodedText, setActiveDecodedText] = useState<string>('');
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);

  // Stop all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, []);

  // Update active decoded preview whenever shift/key/map changes
  useEffect(() => {
    if (!investigation.interceptedMessage) {
      setActiveDecodedText('');
      return;
    }

    const res = executeUniversalDecode(
      investigation.cipherType,
      investigation.interceptedMessage,
      {
        shift: investigation.currentShift,
        vigenereKey: investigation.currentVigenereKey,
        substitutionMap: investigation.substitutionMap,
      }
    );

    if (res.success) {
      setActiveDecodedText(res.plaintext);
    }
  }, [
    investigation.cipherType,
    investigation.interceptedMessage,
    investigation.currentShift,
    investigation.currentVigenereKey,
    investigation.substitutionMap,
  ]);

  // Load a new challenge into workspace
  const loadChallenge = useCallback((challenge: Challenge) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);

    setInvestigation({
      id: `INV-${Date.now()}`,
      challengeId: challenge.id,
      missionNumber: challenge.missionNumber,
      title: challenge.title,
      cipherType: challenge.cipherType,
      difficulty: challenge.difficulty,
      threatLevel: challenge.threatLevel,
      source: challenge.source,
      interceptedMessage: challenge.interceptedMessage,
      expectedAnswer: challenge.expectedAnswer,
      knownKey: challenge.key,
      userInput: '',
      targetKeywords: challenge.targetKeywords || ['PRESTIGE'],
      currentShift: 0,
      currentVigenereKey: '',
      substitutionMap: {},
      status: 'idle',
      startTime: Date.now(),
      elapsedSeconds: 0,
      hintsUsed: 0,
      penaltyXp: 0,
      attempts: 0,
      terminalLogs: [
        `> SESSION LOADED: ${challenge.missionNumber}`,
        `> SOURCE: ${challenge.source}`,
        `> CIPHERTEXT RECEIVED (${challenge.interceptedMessage.length} CHARACTERS)`,
      ],
      metrics: {
        charactersAnalyzed: 0,
        patternsTested: 0,
        possibleKeys: 0,
        shiftCombinations: 0,
        matchConfidence: 0,
        targetWordDetected: undefined,
        targetWordFrozen: false,
      },
    });

    setErrorMsg(null);
    setGlitchActive(false);
  }, []);

  // Start automated progressive cryptanalysis sequence
  const startAnalysis = useCallback(() => {
    soundService.playRadarBeep();
    setGlitchActive(true);
    setErrorMsg(null);

    setInvestigation((prev) => ({
      ...prev,
      status: 'analyzing',
      startTime: Date.now(),
      terminalLogs: [
        '> INITIALIZING DECODER',
        '> INPUT STREAM RECEIVED',
        '> IDENTIFYING CHARACTER DISTRIBUTION...',
      ],
      metrics: {
        charactersAnalyzed: 0,
        patternsTested: 0,
        possibleKeys: 0,
        shiftCombinations: 0,
        matchConfidence: 12,
        targetWordDetected: undefined,
        targetWordFrozen: false,
      },
    }));

    // Start elapsed timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setInvestigation((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);

    const targetKeyword = investigation.targetKeywords?.[0] || 'PRESTIGE';
    let step = 0;

    // Simulation sequence for progressive detection
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);

    analysisIntervalRef.current = window.setInterval(() => {
      step++;

      setInvestigation((prev) => {
        const totalChars = prev.interceptedMessage.length;
        const currentChars = Math.min(totalChars, Math.round((step / 6) * totalChars));
        
        let newLogs = [...prev.terminalLogs];
        let newTargetFrozen = prev.metrics.targetWordFrozen;
        let detectedWord = prev.metrics.targetWordDetected;

        if (step === 1) {
          newLogs.push('> TESTING HEURISTIC SIGNATURES...');
          newLogs.push('> CHECKING ROTATIONAL DISPLACEMENTS...');
        } else if (step === 2) {
          newLogs.push('> SHIFT +1 ........ FAILED (Chi²: 412.3)');
          newLogs.push('> SHIFT +2 ........ FAILED (Chi²: 320.1)');
        } else if (step === 3) {
          // Target word detected! Freeze pattern counter!
          soundService.playGlitch();
          newTargetFrozen = true;
          detectedWord = targetKeyword;
          newLogs.push(`> PATTERN MATCH FOUND: [${targetKeyword}]`);
          newLogs.push('> CONFIRMING LEXICAL MATCH: [PRESTIGE]');
          newLogs.push('> CONTINUING KEYSPACE SEARCH FOR REMAINING TOKENS...');
        } else if (step === 4) {
          newLogs.push('> SHIFT +3 ........ MATCH (Chi²: 42.8)');
          newLogs.push('> POLYNOMIAL CONVERGENCE REACHED');
        } else if (step === 5) {
          soundService.playSuccess();
          newLogs.push('> PATTERN CONFIRMED: 98% CONFIDENCE');
          newLogs.push('> DECODE COMPLETE. READY FOR INTERACTIVE VERIFICATION');
          
          if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
          setGlitchActive(false);

          // Apply detected best shift if Caesar
          const autoShift = typeof prev.knownKey === 'number' ? prev.knownKey : (detectCaesarShift(prev.interceptedMessage).bestShift || 3);
          
          return {
            ...prev,
            status: 'interactive',
            currentShift: autoShift,
            terminalLogs: newLogs,
            metrics: {
              charactersAnalyzed: totalChars,
              patternsTested: 40,
              possibleKeys: 14,
              shiftCombinations: 26,
              matchConfidence: 98,
              targetWordDetected: detectedWord,
              targetWordFrozen: true,
            },
          };
        }

        // Return progressive counters (notice characters & target stay frozen if targetWordFrozen is true)
        return {
          ...prev,
          terminalLogs: newLogs,
          metrics: {
            charactersAnalyzed: newTargetFrozen ? totalChars : currentChars,
            patternsTested: 10 + step * 7,
            possibleKeys: Math.min(26, step * 4),
            shiftCombinations: Math.min(26, step * 5),
            matchConfidence: Math.min(95, 20 + step * 18),
            targetWordDetected: detectedWord,
            targetWordFrozen: newTargetFrozen,
          },
        };
      });
    }, 900);
  }, [investigation.targetKeywords, investigation.knownKey]);

  // Request a hint with penalty
  const requestHint = useCallback((hintId: number) => {
    soundService.playRadarBeep();
    setInvestigation((prev) => {
      const challenge = INITIAL_CHALLENGES.find((c) => c.id === prev.challengeId);
      const hint = challenge?.hints.find((h) => h.id === hintId);
      const penalty = hint ? hint.costXp : 10;

      return {
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        penaltyXp: prev.penaltyXp + penalty,
        terminalLogs: [
          ...prev.terminalLogs,
          `> [HINT REVEALED]: ${hint ? hint.clue : 'Cipher distribution analyzed.'}`,
        ],
      };
    });
  }, []);

  // Update Caesar shift
  const setShift = useCallback((shift: number) => {
    soundService.playKeyClick();
    setInvestigation((prev) => ({
      ...prev,
      currentShift: ((shift % 26) + 26) % 26,
    }));
  }, []);

  // Update Vigenere key
  const setVigenereKey = useCallback((key: string) => {
    soundService.playKeyClick();
    setInvestigation((prev) => ({
      ...prev,
      currentVigenereKey: key.toUpperCase(),
    }));
  }, []);

  // Update Substitution map
  const setSubstitutionChar = useCallback((cipherChar: string, plainChar: string) => {
    soundService.playKeyClick();
    setInvestigation((prev) => ({
      ...prev,
      substitutionMap: {
        ...prev.substitutionMap,
        [cipherChar.toUpperCase()]: plainChar.toUpperCase(),
      },
    }));
  }, []);

  // Set user manual text input - updates both userInput and interceptedMessage
  const setUserInput = useCallback((text: string) => {
    setInvestigation((prev) => ({
      ...prev,
      userInput: text,
      interceptedMessage: text,
    }));
  }, []);

  // Submit and verify solution
  const verifyDecode = useCallback((submittedText?: string): boolean => {
    const textToVerify = (submittedText || activeDecodedText || investigation.userInput).trim().toUpperCase();
    const expected = (investigation.expectedAnswer || '').trim().toUpperCase();

    // Check match or high similarity
    const isMatch = textToVerify === expected || (expected && textToVerify.replace(/[^A-Z0-9]/g, '') === expected.replace(/[^A-Z0-9]/g, ''));

    setInvestigation((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
    }));

    if (isMatch) {
      soundService.playSuccess();
      const baseReward = 200;
      const score = Math.max(50, baseReward - investigation.penaltyXp);
      const timeTaken = investigation.elapsedSeconds || Math.round((Date.now() - investigation.startTime) / 1000);

      setInvestigation((prev) => ({
        ...prev,
        status: 'verified',
        terminalLogs: [
          ...prev.terminalLogs,
          `> VERIFICATION: SUCCESS`,
          `> PLAINTEXT SIGNATURE AUTHENTICATED`,
          `> TIME: ${timeTaken}s | SCORE AWARDED: +${score} XP`,
        ],
        decodedResult: {
          plaintext: textToVerify,
          cipherType: prev.cipherType,
          keyUsed: prev.knownKey || `Shift +${prev.currentShift}`,
          confidence: 100,
          timeTakenSeconds: timeTaken,
          score,
          verifiedAt: new Date().toISOString(),
        },
      }));
      return true;
    } else {
      soundService.playGlitch();
      setErrorMsg('VERIFICATION FAILED: Plaintext does not match expected decryption solution.');
      setInvestigation((prev) => ({
        ...prev,
        terminalLogs: [
          ...prev.terminalLogs,
          `> VERIFICATION FAILED: Discrepancy detected in decoded message.`,
        ],
      }));
      return false;
    }
  }, [activeDecodedText, investigation.userInput, investigation.expectedAnswer, investigation.penaltyXp, investigation.elapsedSeconds, investigation.startTime]);

  return {
    investigation,
    activeDecodedText,
    glitchActive,
    errorMsg,
    loadChallenge,
    startAnalysis,
    requestHint,
    setShift,
    setVigenereKey,
    setSubstitutionChar,
    setUserInput,
    verifyDecode,
    setCipherType: (type: CipherType) => {
      setInvestigation((prev) => ({ ...prev, cipherType: type }));
    },
  };
}
