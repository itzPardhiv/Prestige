import { CurriculumMasteryItem, UserProfile } from '../types/user';

export type CurriculumId =
  | 'caesar-rotational'
  | 'atbash-inverted'
  | 'vigenere-polyalphabetic'
  | 'morse-code'
  | 'substitution-frequency'
  | 'base64-binary';

export interface CanonicalCurriculum {
  id: CurriculumId;
  name: string;
  category: string;
  challengeIds: string[];
  totalChallenges: number;
}

export const CANONICAL_CURRICULUM: CanonicalCurriculum[] = [
  {
    id: 'caesar-rotational',
    name: 'Caesar & Rotational Ciphers',
    category: 'Classical Cryptography',
    challengeIds: ['mission-01', 'mission-07'],
    totalChallenges: 2,
  },
  {
    id: 'atbash-inverted',
    name: 'Atbash Inverted Alphabet',
    category: 'Substitution Ciphers',
    challengeIds: ['mission-02'],
    totalChallenges: 1,
  },
  {
    id: 'vigenere-polyalphabetic',
    name: 'Vigenère Polyalphabetic Key Schedules',
    category: 'Polyalphabetic Ciphers',
    challengeIds: ['mission-03'],
    totalChallenges: 1,
  },
  {
    id: 'morse-code',
    name: 'International Morse Code Encoding',
    category: 'Signal Encoding',
    challengeIds: ['mission-04'],
    totalChallenges: 1,
  },
  {
    id: 'substitution-frequency',
    name: 'Monoalphabetic Substitution & Letter Frequency',
    category: 'Frequency Cryptanalysis',
    challengeIds: ['mission-08'],
    totalChallenges: 1,
  },
  {
    id: 'base64-binary',
    name: 'Base64 & 8-Bit Binary Encodings',
    category: 'Binary-to-Text Encoding',
    challengeIds: ['mission-05', 'mission-06'],
    totalChallenges: 2,
  },
];

/**
 * Returns default 0% mastery items for a new user
 */
export function getDefaultCurriculumMastery(): CurriculumMasteryItem[] {
  return CANONICAL_CURRICULUM.map((item) => ({
    id: item.id,
    name: item.name,
    percent: 0,
  }));
}

/**
 * Find which curriculum module a challenge belongs to
 */
export function findCurriculumForChallenge(challengeId: string): CanonicalCurriculum | undefined {
  return CANONICAL_CURRICULUM.find((c) => c.challengeIds.includes(challengeId));
}

/**
 * Dynamically compute curriculum mastery from a user's completed challenges
 * or from persisted database records.
 *
 * For a completely new user: completedChallengeIds is empty, yielding all 0%.
 * For existing users: completed challenges dynamically determine mastery percentage.
 */
export function computeCurriculumMastery(
  user?: Partial<UserProfile> | null,
  persistedMastery?: Record<string, number>
): CurriculumMasteryItem[] {
  return CANONICAL_CURRICULUM.map((item) => {
    // 1. If explicit persisted database value exists for this curriculum ID, respect it
    if (persistedMastery && typeof persistedMastery[item.id] === 'number') {
      return {
        id: item.id,
        name: item.name,
        percent: Math.min(100, Math.max(0, Math.round(persistedMastery[item.id]))),
      };
    }

    const completedIds = user?.completedChallengeIds || [];

    // 2. If user has completed challenges, dynamically compute mastery percentage
    if (completedIds.length > 0) {
      const completedInModule = item.challengeIds.filter((cid) => completedIds.includes(cid)).length;
      const calculatedPercent = Math.round((completedInModule / item.totalChallenges) * 100);

      // If user has a stored curriculumMastery that is higher, take the maximum
      let storedPercent = 0;
      if (user?.curriculumMastery && Array.isArray(user.curriculumMastery)) {
        const existing = user.curriculumMastery.find((c) => c.id === item.id || c.name === item.name);
        if (existing && typeof existing.percent === 'number') {
          storedPercent = existing.percent;
        }
      }

      return {
        id: item.id,
        name: item.name,
        percent: Math.min(100, Math.max(0, Math.max(calculatedPercent, storedPercent))),
      };
    }

    // 3. New user or user with no completed challenges starts at strictly 0%
    return {
      id: item.id,
      name: item.name,
      percent: 0,
    };
  });
}
