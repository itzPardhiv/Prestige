import { CipherType, CipherAnalysisResult } from '../../types/cipher';
import { calculateFrequencies } from '../frequency';
import { detectCaesarShift } from './caesar';
import { decodeAtbash } from './atbash';
import { decodeBinary } from './binary';
import { decodeBase64 } from './base64';
import { decodeMorse } from './morse';

/**
 * Intelligent Cryptanalysis Heuristic Engine.
 * Inspects character set, distribution entropy, structural delimiters, and statistical metrics.
 */
export function detectCipher(ciphertext: string): CipherAnalysisResult {
  const trimmed = ciphertext.trim();
  const frequencyData = calculateFrequencies(trimmed);
  const heuristicsLog: string[] = [];

  heuristicsLog.push('INITIALIZING CIPHER SIGNATURE SCANNER');

  if (!trimmed) {
    return {
      detectedCipher: 'unknown',
      confidence: 0,
      frequencyData,
      candidateDecodes: [],
      heuristicsLog: ['NO INPUT STREAM RECEIVED'],
    };
  }

  // 1. Check for Binary Signature (only 0, 1 and whitespace)
  if (/^[01\s]+$/.test(trimmed) && trimmed.replace(/\s/g, '').length >= 8) {
    heuristicsLog.push('BINARY PATTERN DETECTED: Binary radix alphabet [0, 1]');
    const binaryTry = decodeBinary(trimmed);
    if (binaryTry.success && binaryTry.text) {
      heuristicsLog.push(`BINARY CONVERSION SUCCESS: Preview "${binaryTry.text.slice(0, 30)}..."`);
      return {
        detectedCipher: 'binary',
        confidence: 99,
        frequencyData,
        candidateDecodes: [
          { cipherType: 'binary', previewText: binaryTry.text, score: 99 },
        ],
        heuristicsLog,
      };
    }
  }

  // 2. Check for Morse Code Signature (only ., -, /, and space)
  if (/^[.\-/\s]+$/.test(trimmed) && (trimmed.includes('.') || trimmed.includes('-'))) {
    heuristicsLog.push('PULSE TELEMETRY DETECTED: International Morse pattern [., -]');
    const morseTry = decodeMorse(trimmed);
    if (morseTry.success && morseTry.text) {
      heuristicsLog.push(`MORSE DECODE SUCCESS: Preview "${morseTry.text.slice(0, 30)}..."`);
      return {
        detectedCipher: 'morse',
        confidence: 96,
        frequencyData,
        candidateDecodes: [
          { cipherType: 'morse', previewText: morseTry.text, score: 96 },
        ],
        heuristicsLog,
      };
    }
  }

  // 3. Check for Base64 Signature (alphanumeric + / + = padding, length multiple of 4 or plausible base64)
  const cleanNoSpace = trimmed.replace(/\s+/g, '');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleanNoSpace) && cleanNoSpace.length % 4 === 0 && cleanNoSpace.length >= 8) {
    // Only if it doesn't look like standard space-separated words
    if (!trimmed.includes(' ') || cleanNoSpace.endsWith('=')) {
      heuristicsLog.push('RADIX-64 STRUCTURE DETECTED: MIME Base64 formatting signature');
      const b64Try = decodeBase64(cleanNoSpace);
      if (b64Try.success && b64Try.text && /^[\x20-\x7E\s]+$/.test(b64Try.text)) {
        heuristicsLog.push(`BASE64 VERIFIED: Decoded readable ASCII stream`);
        return {
          detectedCipher: 'base64',
          confidence: 95,
          frequencyData,
          candidateDecodes: [
            { cipherType: 'base64', previewText: b64Try.text, score: 95 },
          ],
          heuristicsLog,
        };
      }
    }
  }

  // 4. Classical Letter Ciphers (Caesar / Atbash / Substitution / Vigenere)
  heuristicsLog.push('ANALYZING MONOALPHABETIC & POLYALPHABETIC DISTRIBUTIONS');
  
  // Test Caesar
  const caesarResult = detectCaesarShift(trimmed);
  heuristicsLog.push(`TESTING SHIFT PATTERNS: Optimal candidate Shift +${caesarResult.bestShift}`);
  
  // Test Atbash
  const atbashText = decodeAtbash(trimmed);
  heuristicsLog.push('TESTING ATBASH RECIPROCAL INVOLUTION');

  const candidates: Array<{ cipherType: CipherType; key?: string | number; previewText: string; score: number }> = [
    {
      cipherType: 'caesar',
      key: caesarResult.bestShift,
      previewText: caesarResult.bestPlaintext,
      score: caesarResult.confidence,
    },
    {
      cipherType: 'atbash',
      previewText: atbashText,
      score: 65, // baseline comparative score
    },
  ];

  // If Caesar confidence is strong
  if (caesarResult.confidence >= 80) {
    heuristicsLog.push(`CONFIRMED CAESAR SHIFT SIGNATURE: Confidence ${caesarResult.confidence}%`);
    return {
      detectedCipher: 'caesar',
      confidence: caesarResult.confidence,
      possibleKey: caesarResult.bestShift,
      frequencyData,
      candidateDecodes: candidates,
      heuristicsLog,
    };
  }

  // Fallback to Substitution or Unknown
  heuristicsLog.push('MONOALPHABETIC SHIFT AMBIGUOUS: Suggesting Substitution or Polyalphabetic Investigation');
  return {
    detectedCipher: 'caesar', // Default primary hypothesis
    confidence: caesarResult.confidence,
    possibleKey: caesarResult.bestShift,
    frequencyData,
    candidateDecodes: candidates,
    heuristicsLog,
  };
}
