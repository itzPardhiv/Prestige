import { CipherType, CipherMetadata, DecodeOperationResult } from '../../types/cipher';
import { decodeCaesar, encodeCaesar, detectCaesarShift } from './caesar';
import { decodeAtbash, encodeAtbash } from './atbash';
import { decodeVigenere, encodeVigenere } from './vigenere';
import { decodeMorse, encodeMorse } from './morse';
import { decodeBinary, encodeBinary } from './binary';
import { decodeBase64, encodeBase64 } from './base64';
import { decodeSubstitution, createEmptySubstitutionMap, createShiftSubstitutionMap } from './substitution';
import { detectCipher } from './detector';

export {
  decodeCaesar,
  encodeCaesar,
  detectCaesarShift,
  decodeAtbash,
  encodeAtbash,
  decodeVigenere,
  encodeVigenere,
  decodeMorse,
  encodeMorse,
  decodeBinary,
  encodeBinary,
  decodeBase64,
  encodeBase64,
  decodeSubstitution,
  createEmptySubstitutionMap,
  createShiftSubstitutionMap,
  detectCipher,
};

export const CIPHER_METADATA: Record<CipherType, CipherMetadata> = {
  caesar: {
    id: 'caesar',
    name: 'Caesar Shift Cipher',
    category: 'classical',
    description: 'Monoalphabetic shift cipher where each letter in the plaintext is shifted a fixed number of positions down the alphabet.',
    historicalContext: 'Attributed to Julius Caesar around 58 BC for military dispatches during the Gallic Wars, using a shift of 3.',
    howItWorks: 'C = (P + K) mod 26. Each character is replaced by character K positions ahead. Easily broken via frequency analysis or trying all 25 shifts.',
    complexity: 'Low',
  },
  atbash: {
    id: 'atbash',
    name: 'Atbash Cipher',
    category: 'classical',
    description: 'Reciprocal monoalphabetic substitution cipher formed by reversing the alphabet (A becomes Z, B becomes Y).',
    historicalContext: 'Originally used in ancient Biblical Hebrew texts (Book of Jeremiah, Babel transformed to Sheshach).',
    howItWorks: 'Self-inversive cipher: C = (25 - P) mod 26. Encoding and decoding procedures are identical.',
    complexity: 'Low',
  },
  vigenere: {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'polyalphabetic',
    description: 'Polyalphabetic substitution cipher employing a repeating secret keyword to generate different Caesar shifts per character.',
    historicalContext: 'Invented by Giovan Battista Bellaso in 1553 and later attributed to Blaise de Vigenère; hailed for centuries as "le chiffre indéchiffrable".',
    howItWorks: 'Ci = (Pi + Ki) mod 26. Resists simple frequency analysis because single plaintext letters encode into different ciphertext letters depending on keyword position.',
    complexity: 'High',
  },
  morse: {
    id: 'morse',
    name: 'International Morse Code',
    category: 'encoding',
    description: 'Telecommunication method that encodes text characters as standardized sequences of two distinct signal durations (dots and dashes).',
    historicalContext: 'Developed in the 1830s and 1840s by Samuel Morse and Alfred Vail for the electrical telegraph.',
    howItWorks: 'Variable-length code where most frequent English letter (E) has shortest code (.) and rare letters have longer codes.',
    complexity: 'Medium',
  },
  binary: {
    id: 'binary',
    name: 'Binary Radix-2 Encoding',
    category: 'encoding',
    description: 'Base-2 numeral system expressing text using sequences of two distinct symbols: 0 and 1 (standard 8-bit ASCII).',
    historicalContext: 'Formalized by Gottfried Wilhelm Leibniz in 1679; fundamental foundation of modern computer architectures.',
    howItWorks: 'Each printable character maps to an 8-bit byte (0-255). For example, "A" is ASCII 65 = 01000001.',
    complexity: 'Medium',
  },
  base64: {
    id: 'base64',
    name: 'Base64 Radix-64 Encoding',
    category: 'encoding',
    description: 'Binary-to-text encoding scheme that translates binary data into an ASCII string format using 64 printable characters.',
    historicalContext: 'Defined in RFC 4648 to transfer arbitrary 8-bit data safely over 7-bit protocols like MIME email.',
    howItWorks: 'Takes 3 bytes (24 bits) and divides them into 4 groups of 6 bits each, mapping to characters A-Z, a-z, 0-9, +, / with = padding.',
    complexity: 'Medium',
  },
  substitution: {
    id: 'substitution',
    name: 'Simple Substitution Cipher',
    category: 'classical',
    description: 'Monoalphabetic cipher in which each letter of the plaintext is systematically replaced with another predetermined symbol or letter.',
    historicalContext: 'Documented extensively by 9th-century Arab polymath Al-Kindi, who authored the first known treatise on cryptanalysis via letter frequency.',
    howItWorks: 'Has 26! possible permutations (~4 x 10^26 keys), yet vulnerable to frequency analysis of vowels, single-letter words, and digrams.',
    complexity: 'High',
  },
  unknown: {
    id: 'unknown',
    name: 'Unidentified Cipher Stream',
    category: 'classical',
    description: 'Unknown or compound cipher requiring cryptanalytic inspection, entropy measurement, and heuristic pattern matching.',
    historicalContext: 'Cryptanalysts and researchers frequently encounter obfuscated, compound, or non-standard encodings requiring multi-pass algorithmic analysis.',
    howItWorks: 'Requires systematic testing across shift distributions, structural delimiters, and dictionary frequency attacks.',
    complexity: 'Expert',
  },
};

/**
 * Universal decoding dispatcher.
 */
export function executeUniversalDecode(
  cipherType: CipherType,
  ciphertext: string,
  options?: {
    shift?: number;
    vigenereKey?: string;
    substitutionMap?: Record<string, string>;
  }
): DecodeOperationResult {
  const startTime = performance.now();

  try {
    switch (cipherType) {
      case 'caesar': {
        const shift = options?.shift !== undefined ? options.shift : detectCaesarShift(ciphertext).bestShift;
        const plaintext = decodeCaesar(ciphertext, shift);
        return {
          success: true,
          plaintext,
          cipherType: 'caesar',
          keyUsed: `Shift +${shift}`,
          confidence: 95,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'atbash': {
        const plaintext = decodeAtbash(ciphertext);
        return {
          success: true,
          plaintext,
          cipherType: 'atbash',
          keyUsed: 'Reciprocal Alphabet (A-Z -> Z-A)',
          confidence: 90,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'vigenere': {
        const key = options?.vigenereKey || '';
        if (!key.trim()) {
          return {
            success: false,
            plaintext: '',
            cipherType: 'vigenere',
            error: 'Vigenère deciphering requires an alphabet keyword.',
            confidence: 0,
            timeTakenMs: Math.round(performance.now() - startTime),
          };
        }
        const plaintext = decodeVigenere(ciphertext, key);
        return {
          success: true,
          plaintext,
          cipherType: 'vigenere',
          keyUsed: key.toUpperCase(),
          confidence: 85,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'morse': {
        const morseResult = decodeMorse(ciphertext);
        return {
          success: morseResult.success,
          plaintext: morseResult.text,
          cipherType: 'morse',
          error: morseResult.error,
          confidence: morseResult.success ? 95 : 40,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'binary': {
        const binResult = decodeBinary(ciphertext);
        return {
          success: binResult.success,
          plaintext: binResult.text,
          cipherType: 'binary',
          error: binResult.error,
          confidence: binResult.success ? 98 : 20,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'base64': {
        const b64Result = decodeBase64(ciphertext);
        return {
          success: b64Result.success,
          plaintext: b64Result.text,
          cipherType: 'base64',
          error: b64Result.error,
          confidence: b64Result.success ? 98 : 20,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'substitution': {
        const map = options?.substitutionMap || {};
        const plaintext = decodeSubstitution(ciphertext, map);
        return {
          success: true,
          plaintext,
          cipherType: 'substitution',
          keyUsed: 'Custom Substitution Matrix',
          confidence: 80,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }

      case 'unknown':
      default: {
        const detection = detectCipher(ciphertext);
        const topCandidate = detection.candidateDecodes[0];
        return {
          success: Boolean(topCandidate),
          plaintext: topCandidate ? topCandidate.previewText : ciphertext,
          cipherType: detection.detectedCipher,
          keyUsed: detection.possibleKey !== undefined ? `Inferred: ${detection.possibleKey}` : undefined,
          confidence: detection.confidence,
          timeTakenMs: Math.round(performance.now() - startTime),
        };
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown decoding exception';
    return {
      success: false,
      plaintext: '',
      cipherType,
      error: errorMsg,
      confidence: 0,
      timeTakenMs: Math.round(performance.now() - startTime),
    };
  }
}
