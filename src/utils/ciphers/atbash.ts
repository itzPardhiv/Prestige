/**
 * Atbash cipher implementation.
 * An ancient Hebrew reciprocal monoalphabetic substitution cipher:
 * A <-> Z, B <-> Y, C <-> X, etc.
 * Since Atbash is an involution (its own inverse), encoding and decoding are identical.
 */
export function decodeAtbash(text: string): string {
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);

    // Uppercase A(65) - Z(90): mirror formula is 90 - (code - 65) = 155 - code
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(155 - code);
    }
    // Lowercase a(97) - z(122): mirror formula is 122 - (code - 97) = 219 - code
    else if (code >= 97 && code <= 122) {
      result += String.fromCharCode(219 - code);
    }
    // Keep digits and symbols unchanged
    else {
      result += char;
    }
  }

  return result;
}

export const encodeAtbash = decodeAtbash;
