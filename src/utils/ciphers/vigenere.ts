/**
 * Vigenère Cipher implementation.
 * Polyalphabetic substitution cipher employing a keyword to shift characters.
 */

export function encodeVigenere(plaintext: string, key: string): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return plaintext;

  let result = '';
  let keyIndex = 0;

  for (let i = 0; i < plaintext.length; i++) {
    const char = plaintext[i];
    const code = plaintext.charCodeAt(i);

    if (code >= 65 && code <= 90) { // Uppercase
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((code - 65 + shift) % 26) + 65);
      keyIndex++;
    } else if (code >= 97 && code <= 122) { // Lowercase
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((code - 97 + shift) % 26) + 97);
      keyIndex++;
    } else {
      result += char;
    }
  }

  return result;
}

export function decodeVigenere(ciphertext: string, key: string): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return ciphertext;

  let result = '';
  let keyIndex = 0;

  for (let i = 0; i < ciphertext.length; i++) {
    const char = ciphertext[i];
    const code = ciphertext.charCodeAt(i);

    if (code >= 65 && code <= 90) { // Uppercase
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      keyIndex++;
    } else if (code >= 97 && code <= 122) { // Lowercase
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      keyIndex++;
    } else {
      result += char;
    }
  }

  return result;
}
