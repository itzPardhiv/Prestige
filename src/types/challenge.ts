import { CipherType } from './cipher';

export type ChallengeDifficulty = 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ChallengeHint {
  id: number;
  clue: string;
  costXp: number;
  revealed?: boolean;
}

export interface Challenge {
  id: string;
  missionNumber: string;
  title: string;
  cipherType: CipherType;
  difficulty: ChallengeDifficulty;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  source: string;
  interceptedMessage: string;
  expectedAnswer: string;
  key?: string | number;
  targetKeywords?: string[];
  hints: ChallengeHint[];
  explanation: string;
  xpReward: number;
  category: string;
  estimatedTime: string;
}
