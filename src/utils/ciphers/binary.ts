/**
 * Binary data encoding and decoding utilities.
 */

export function encodeBinary(text: string): string {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

export function decodeBinary(binaryText: string): { text: string; success: boolean; error?: string } {
  const cleanInput = binaryText.trim();
  if (!cleanInput) return { text: '', success: true };

  // Check if contains non-binary characters other than whitespace
  if (/[^01\s]/.test(cleanInput)) {
    return {
      text: '',
      success: false,
      error: 'Input contains non-binary characters. Only 0 and 1 allowed.',
    };
  }

  // Handle both space-delimited bytes and continuous binary streams
  let bytes: string[] = [];
  if (cleanInput.includes(' ')) {
    bytes = cleanInput.split(/\s+/).filter(Boolean);
  } else {
    // Chunk into 8-bit blocks
    for (let i = 0; i < cleanInput.length; i += 8) {
      bytes.push(cleanInput.slice(i, i + 8));
    }
  }

  let result = '';
  for (const byte of bytes) {
    if (byte.length === 0) continue;
    const charCode = parseInt(byte, 2);
    if (isNaN(charCode)) {
      return { text: '', success: false, error: `Invalid binary byte: ${byte}` };
    }
    result += String.fromCharCode(charCode);
  }

  return {
    text: result,
    success: true,
  };
}
