/**
 * Simple Monoalphabetic Substitution Cipher implementation.
 * Supports arbitrary character mappings (e.g., A -> D, B -> E) with case preservation.
 */

export function decodeSubstitution(ciphertext: string, mapping: Record<string, string>): string {
  // Normalize mapping keys and values to uppercase for matching
  const normalizedMap: Record<string, string> = {};
  for (const [cipherChar, plainChar] of Object.entries(mapping)) {
    if (cipherChar && plainChar) {
      normalizedMap[cipherChar.toUpperCase()] = plainChar.toUpperCase();
    }
  }

  let result = '';

  for (let i = 0; i < ciphertext.length; i++) {
    const char = ciphertext[i];
    const upper = char.toUpperCase();

    if (normalizedMap[upper]) {
      const mapped = normalizedMap[upper];
      // Preserve original case
      if (char >= 'a' && char <= 'z') {
        result += mapped.toLowerCase();
      } else {
        result += mapped;
      }
    } else {
      // Unmapped characters remain as they were or visually marked
      result += char;
    }
  }

  return result;
}

/**
 * Creates an empty A-Z mapping template
 */
export function createEmptySubstitutionMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    map[letter] = '';
  }
  return map;
}

/**
 * Creates an initial Caesar shift mapping template for interactive keyboard exploration
 */
export function createShiftSubstitutionMap(shift: number): Record<string, string> {
  const map: Record<string, string> = {};
  const normShift = ((shift % 26) + 26) % 26;
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const mapped = String.fromCharCode(((i - 65 - normShift + 26) % 26) + 65);
    map[letter] = mapped;
  }
  return map;
}
