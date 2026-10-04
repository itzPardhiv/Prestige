export type UserRole = 'USER' | 'ADMIN';

export type UserRank = 
  | 'INITIATE'
  | 'ANALYST'
  | 'DECODER'
  | 'CRYPTANALYST'
  | 'MASTER DECODER';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  category: 'ciphers' | 'speed' | 'accuracy' | 'mastery';
}

export interface UserStats {
  codesDecoded: number;
  accuracy: number; // percentage
  currentStreak: number;
  bestStreak: number;
  xp: number;
  rank: UserRank;
  fastestSolveSeconds: number;
  highestDifficultySolved: string;
  reportsGenerated: number;
  savedInvestigationsCount: number;
}

export interface CurriculumMasteryItem {
  id: string;
  name: string;
  percent: number;
}

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email: string;
  callsign: string;
  avatar?: string;
  avatarSeed: string;
  role?: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  firstLoginAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
  stats: UserStats;
  completedChallengeIds: string[];
  achievements: Achievement[];
  curriculumMastery?: CurriculumMasteryItem[];
  joinedDate: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  email: string;
  expiresAt: number;
}

