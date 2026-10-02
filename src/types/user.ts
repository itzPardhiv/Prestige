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

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email: string;
  callsign: string;
  avatar?: string;
  avatarSeed: string;
  level?: string;
  progress?: number;
  role?: UserRole;
  isActive?: boolean;
  stats: UserStats;
  completedChallengeIds: string[];
  achievements: Achievement[];
  joinedDate: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  email: string;
  expiresAt: number;
}

