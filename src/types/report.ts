import { CipherType, CharacterFrequency } from './cipher';
import { ChallengeDifficulty } from './challenge';

export interface ArtifactMetrics {
  charCount: number;
  letterCount: number;
  digitCount: number;
  whitespaceCount: number;
  wordCount: number;
  lineCount: number;
  uniqueLetters: number;
}

export interface StatisticalMetrics {
  totalLetters: number;
  uniqueLetters: number;
  indexOfCoincidence: number;
  chiSquared: number;
  frequencies: CharacterFrequency[];
}

export interface CipherConfigDetails {
  cipherType: string;
  primaryParameter: string;
  applicableFields: Array<{ label: string; value: string | number }>;
  mathematicalRule: string;
}

export interface VerificationMetrics {
  decoderExecution: string;
  transformationConsistency: string;
  provenance: string;
  isReversible: boolean;
}

export interface TimelineEvent {
  event: string;
  timestamp: string;
}

export interface TechnicalReportData {
  inputMetrics: ArtifactMetrics;
  outputMetrics: ArtifactMetrics;
  cipherConfig: CipherConfigDetails;
  methodDescription: string;
  statistics: StatisticalMetrics;
  verification: VerificationMetrics;
  timeline: TimelineEvent[];
  conclusion: string;
}

export interface InvestigationReport {
  id: string;
  investigationId: string;
  missionNumber: string;
  title: string;
  timestamp: string;
  status: 'VERIFIED' | 'COMPLETED';
  difficulty: ChallengeDifficulty;
  
  // Cipher Data
  originalCipher: string;
  identifiedCipher: CipherType;
  cipherName: string;
  decodingMethod: string;
  keyShift?: string | number;
  decodedMessage: string;
  
  // Cryptanalysis Breakdown
  analysisNarrative: string;
  cryptanalysisSteps: string[];
  
  // Live Telemetry Statistics
  statistics: {
    charactersAnalyzed: number;
    patternsTested: number;
    attempts: number;
    timeTakenSeconds: number;
    confidence: number;
    xpEarned: number;
  };
  
  // Educational / Study Content
  educational: {
    cipherOverview: string;
    historicalContext: string;
    whyItWorks: string;
    vulnerabilities: string;
    interactiveExample: {
      from: string;
      to: string;
      rule: string;
    };
    keyTakeaways: string[];
  };

  // Structured Technical Cryptanalysis Data
  technical?: TechnicalReportData;
}
