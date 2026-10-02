/**
 * Base64 Encoding and Decoding utilities with comprehensive error recovery.
 */

export function encodeBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (err) {
    return btoa(text);
  }
}

export function decodeBase64(base64Text: string): { text: string; success: boolean; error?: string } {
  const cleanInput = base64Text.trim().replace(/\s+/g, '');
  if (!cleanInput) return { text: '', success: true };

  // Validate Base64 characters
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(cleanInput)) {
    return {
      text: '',
      success: false,
      error: 'Invalid Base64 character detected. Only A-Z, a-z, 0-9, +, / and = padding are permitted.',
    };
  }

  try {
    const decodedRaw = atob(cleanInput);
    try {
      const decodedUtf8 = decodeURIComponent(escape(decodedRaw));
      return { text: decodedUtf8, success: true };
    } catch {
      return { text: decodedRaw, success: true };
    }
  } catch (err) {
    return {
      text: '',
      success: false,
      error: 'Failed to decode Base64 payload. Padding or bit alignment may be incorrect.',
    };
  }
}
