import { calculateChiSquared } from '../frequency';

/**
 * Encodes text using Caesar cipher with given rightward shift.
 */
export function encodeCaesar(text: string, shift: number): string {
  const normalizedShift = ((shift % 26) + 26) % 26;
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);

    // Uppercase letters
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(((code - 65 + normalizedShift) % 26) + 65);
    }
    // Lowercase letters
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(((code - 97 + normalizedShift) % 26) + 97);
    }
    // Preserve non-alphabetic characters
    else {
      result += char;
    }
  }

  return result;
}

/**
 * Decodes Caesar ciphertext by shifting leftwards by the given shift value.
 * Decoding with shift S is equivalent to encoding with (26 - S).
 */
export function decodeCaesar(ciphertext: string, shift: number): string {
  const decodeShift = (26 - (((shift % 26) + 26) % 26)) % 26;
  return encodeCaesar(ciphertext, decodeShift);
}

/**
 * Automagically determines the most probable Caesar shift using Chi-Squared
 * statistical comparison against typical English letter distribution.
 */
export function detectCaesarShift(ciphertext: string): {
  bestShift: number;
  confidence: number;
  bestPlaintext: string;
  allCandidates: Array<{ shift: number; plaintext: string; score: number }>;
} {
  if (!ciphertext.trim()) {
    return { bestShift: 0, confidence: 0, bestPlaintext: '', allCandidates: [] };
  }

  const candidates: Array<{ shift: number; plaintext: string; score: number }> = [];

  for (let shift = 0; shift < 26; shift++) {
    const candidateText = decodeCaesar(ciphertext, shift);
    const score = calculateChiSquared(candidateText);
    candidates.push({
      shift,
      plaintext: candidateText,
      score,
    });
  }

  // Sort by lowest Chi-Squared score (best English fit)
  candidates.sort((a, b) => a.score - b.score);

  const best = candidates[0];
  const second = candidates[1];

  // Derive confidence percentage based on score separation
  let confidence = 50;
  if (best.score < 100) confidence = 95;
  else if (best.score < 250) confidence = 85;
  else if (second && second.score > best.score * 1.5) confidence = 75;
  else confidence = 60;

  return {
    bestShift: best.shift,
    confidence,
    bestPlaintext: best.plaintext,
    allCandidates: candidates,
  };
}
