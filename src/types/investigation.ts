import { CipherType, AnalysisMetrics } from './cipher';
import { ChallengeDifficulty } from './challenge';

export type InvestigationStatus = 
  | 'idle'
  | 'analyzing'
  | 'interactive'
  | 'verified'
  | 'error';

export interface ActiveInvestigation {
  id: string;
  challengeId?: string;
  missionNumber: string;
  title: string;
  cipherType: CipherType;
  difficulty: ChallengeDifficulty;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  source: string;
  interceptedMessage: string;
  expectedAnswer?: string;
  knownKey?: string | number;
  userInput: string;
  targetKeywords?: string[];
  
  // Decoding engine state
  currentShift?: number;
  currentVigenereKey?: string;
  substitutionMap: Record<string, string>;
  
  // Execution telemetry
  status: InvestigationStatus;
  startTime: number;
  elapsedSeconds: number;
  hintsUsed: number;
  penaltyXp: number;
  attempts: number;
  
  // Terminal logs & metrics
  terminalLogs: string[];
  metrics: AnalysisMetrics;
  
  // Final verification
  decodedResult?: {
    plaintext: string;
    cipherType: CipherType;
    keyUsed?: string | number;
    confidence: number;
    timeTakenSeconds: number;
    score: number;
    verifiedAt: string;
  };
}

export interface SavedInvestigation {
  id: string;
  name: string;
  folderId: string;
  challengeId?: string;
  missionNumber: string;
  cipherType: CipherType;
  originalCipher: string;
  decodedText: string;
  keyUsed?: string | number;
  date: string;
  difficulty: ChallengeDifficulty;
  score: number;
  timeTakenSeconds: number;
  hasReport: boolean;
  reportId?: string;
}
