/**
 * International Morse Code Lookup Dictionary and Decoders.
 */

export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.',
  F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---',
  P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--',
  Z: '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/'
};

// Inverted lookup map (Morse sequence -> Character)
export const REVERSE_MORSE_TABLE: Record<string, string> = Object.entries(MORSE_TABLE).reduce(
  (acc, [char, code]) => {
    acc[code] = char;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Encodes plain English into standard Morse code separated by spaces, with '/' representing word boundaries.
 */
export function encodeMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((char) => MORSE_TABLE[char] || char)
    .join(' ');
}

/**
 * Decodes Morse code into English text.
 * Accepts letters separated by single space, and words separated by '/' or double/triple spaces.
 */
export function decodeMorse(morseText: string): { text: string; success: boolean; error?: string } {
  if (!morseText.trim()) return { text: '', success: true };

  // Normalize delimiters: treat triple/double spaces or '/' as word separators
  const words = morseText.trim().replace(/\s*\/\s*/g, ' / ').split(' / ');
  const decodedWords: string[] = [];
  let unmappedCount = 0;

  for (const word of words) {
    const symbols = word.trim().split(/\s+/);
    const decodedChars: string[] = [];

    for (const sym of symbols) {
      if (!sym) continue;
      if (REVERSE_MORSE_TABLE[sym]) {
        decodedChars.push(REVERSE_MORSE_TABLE[sym]);
      } else {
        decodedChars.push(`[${sym}]`);
        unmappedCount++;
      }
    }
    decodedWords.push(decodedChars.join(''));
  }

  const result = decodedWords.join(' ');
  const success = unmappedCount === 0 || (decodedWords.length > 0 && unmappedCount < decodedWords.length * 2);

  return {
    text: result,
    success,
    error: unmappedCount > 0 ? `Unrecognized morse sequences (${unmappedCount} symbols)` : undefined,
  };
}
