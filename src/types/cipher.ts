export type CipherType = 
  | 'caesar'
  | 'atbash'
  | 'vigenere'
  | 'morse'
  | 'binary'
  | 'base64'
  | 'substitution'
  | 'unknown';

export interface CipherMetadata {
  id: CipherType;
  name: string;
  category: 'classical' | 'modern' | 'encoding' | 'polyalphabetic';
  description: string;
  historicalContext: string;
  howItWorks: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Expert';
}

export interface CharacterFrequency {
  char: string;
  count: number;
  frequency: number; // percentage (0-100)
  standardFrequency: number; // standard English frequency
}

export interface AnalysisMetrics {
  charactersAnalyzed: number;
  patternsTested: number;
  possibleKeys: number;
  shiftCombinations: number;
  matchConfidence: number;
  targetWordDetected?: string;
  targetWordFrozen?: boolean;
}

export interface CipherAnalysisResult {
  detectedCipher: CipherType;
  confidence: number;
  possibleKey?: string | number;
  frequencyData: CharacterFrequency[];
  candidateDecodes: Array<{
    cipherType: CipherType;
    key?: string | number;
    previewText: string;
    score: number;
  }>;
  heuristicsLog: string[];
}

export interface DecodeOperationResult {
  success: boolean;
  plaintext: string;
  cipherType: CipherType;
  keyUsed?: string | number;
  confidence: number;
  error?: string;
  timeTakenMs: number;
}
