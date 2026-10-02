import { CharacterFrequency } from '../types/cipher';

// Standard English letter frequencies (percentage)
export const ENGLISH_FREQUENCIES: Record<string, number> = {
  A: 8.167, B: 1.492, C: 2.782, D: 4.253, E: 12.702,
  F: 2.228, G: 2.015, H: 6.094, I: 6.966, J: 0.153,
  K: 0.772, L: 4.025, M: 2.406, N: 6.749, O: 7.507,
  P: 1.929, Q: 0.095, R: 5.987, S: 6.327, T: 9.056,
  U: 2.758, V: 0.978, W: 2.360, X: 0.150, Y: 1.974,
  Z: 0.074,
};

/**
 * Calculates character frequency distribution for a given text.
 */
export function calculateFrequencies(text: string): CharacterFrequency[] {
  const counts: Record<string, number> = {};
  const upper = text.toUpperCase();
  let totalLetters = 0;

  // Initialize A-Z
  for (let i = 65; i <= 90; i++) {
    counts[String.fromCharCode(i)] = 0;
  }

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch] = (counts[ch] || 0) + 1;
      totalLetters++;
    }
  }

  return Object.keys(counts).map((char) => {
    const count = counts[char];
    const frequency = totalLetters > 0 ? (count / totalLetters) * 100 : 0;
    return {
      char,
      count,
      frequency: parseFloat(frequency.toFixed(2)),
      standardFrequency: ENGLISH_FREQUENCIES[char] || 0,
    };
  });
}

/**
 * Computes Chi-Squared statistic between observed character frequencies and standard English.
 * A lower Chi-Squared score indicates a distribution that closely matches natural English text.
 */
export function calculateChiSquared(text: string): number {
  const upper = text.toUpperCase();
  const counts: Record<string, number> = {};
  let totalLetters = 0;

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch] = (counts[ch] || 0) + 1;
      totalLetters++;
    }
  }

  if (totalLetters === 0) return 999999;

  let chiSquared = 0;
  for (let i = 65; i <= 90; i++) {
    const char = String.fromCharCode(i);
    const observed = counts[char] || 0;
    const expected = (ENGLISH_FREQUENCIES[char] / 100) * totalLetters;
    chiSquared += Math.pow(observed - expected, 2) / (expected || 0.0001);
  }

  return chiSquared;
}
