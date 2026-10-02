import { UserProfile } from '../types/user';
import { SavedInvestigation } from '../types/investigation';
import { InvestigationReport } from '../types/report';
import { Folder } from '../types/archive';

const STORAGE_VERSION = 'v1.2';
const KEY_PREFIX = `PRESTIGE_${STORAGE_VERSION}_`;

export const STORAGE_KEYS = {
  USER_PROFILE: `${KEY_PREFIX}USER_PROFILE`,
  FOLDERS: `${KEY_PREFIX}FOLDERS`,
  SAVED_INVESTIGATIONS: `${KEY_PREFIX}SAVED_INVESTIGATIONS`,
  REPORTS: `${KEY_PREFIX}REPORTS`,
  CURRENT_MISSION: `${KEY_PREFIX}CURRENT_MISSION`,
};

// Default starter profile
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'learner-alpha-09',
  username: 'Alex Morgan',
  name: 'Alex Morgan',
  email: 'alex@prestige.edu',
  callsign: 'ALEX-09',
  avatarSeed: 'learner-default',
  stats: {
    codesDecoded: 4,
    accuracy: 94,
    currentStreak: 3,
    bestStreak: 7,
    xp: 650,
    rank: 'ANALYST',
    fastestSolveSeconds: 38,
    highestDifficultySolved: 'Advanced',
    reportsGenerated: 3,
    savedInvestigationsCount: 2,
  },
  completedChallengeIds: ['mission-01'],
  achievements: [
    {
      id: 'first-decode',
      title: 'FIRST DECODE',
      description: 'Successfully decode your inaugural ciphertext challenge.',
      icon: 'Key',
      isUnlocked: true,
      unlockedAt: '2026-09-20',
      category: 'ciphers',
    },
    {
      id: '10-ciphers',
      title: '10 CIPHERS',
      description: 'Decode 10 distinct ciphers across all categories.',
      icon: 'Shield',
      isUnlocked: false,
      category: 'ciphers',
    },
    {
      id: 'perfect-run',
      title: 'PERFECT RUN',
      description: 'Decode an Advanced or Expert cipher with 0 hints and 100% accuracy.',
      icon: 'Award',
      isUnlocked: true,
      unlockedAt: '2026-09-22',
      category: 'accuracy',
    },
    {
      id: 'master-decoder',
      title: 'MASTER DECODER',
      description: 'Attain the prestigious level of Master Decoder with 2,500+ XP.',
      icon: 'Crown',
      isUnlocked: false,
      category: 'mastery',
    },
    {
      id: 'speed-analyst',
      title: 'SPEED ANALYST',
      description: 'Solve any cipher challenge in under 45 seconds.',
      icon: 'Zap',
      isUnlocked: true,
      unlockedAt: '2026-09-21',
      category: 'speed',
    },
  ],
  joinedDate: 'SEPTEMBER 2026',
};

// Default archive folders
export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder-my-ciphers', name: 'MY CIPHERS', color: '#00FF9D', createdAt: '2026-09-21', updatedAt: '2026-09-21' },
  { id: 'folder-college-event', name: 'COLLEGE EVENT', color: '#00F0FF', createdAt: '2026-09-22', updatedAt: '2026-09-22' },
  { id: 'folder-practice', name: 'PRACTICE', color: '#FFB800', createdAt: '2026-09-22', updatedAt: '2026-09-22' },
  { id: 'folder-mastered', name: 'MASTERED', color: '#A855F7', createdAt: '2026-09-23', updatedAt: '2026-09-23' },
  { id: 'folder-research', name: 'RESEARCH', color: '#38BDF8', createdAt: '2026-09-23', updatedAt: '2026-09-23' },
];

// Initial seeded investigations
export const DEFAULT_INVESTIGATIONS: SavedInvestigation[] = [
  {
    id: 'inv-seed-01',
    name: 'Caesar Cipher · Decoding Session',
    folderId: 'folder-my-ciphers',
    challengeId: 'mission-01',
    missionNumber: 'Caesar Cipher',
    cipherType: 'caesar',
    originalCipher: 'KHOOR ZRUOG',
    decodedText: 'HELLO WORLD',
    keyUsed: 'Shift +3',
    date: '2026-09-22 14:15',
    difficulty: 'Easy',
    score: 100,
    timeTakenSeconds: 38,
    hasReport: true,
    reportId: 'rep-seed-01',
  },
  {
    id: 'inv-seed-02',
    name: 'Caesar Cipher · Rotational Displacement',
    folderId: 'folder-practice',
    challengeId: 'mission-07',
    missionNumber: 'Caesar Cipher',
    cipherType: 'caesar',
    originalCipher: 'SUHVWLJH OHDUQLQJ SODWIRUP',
    decodedText: 'PRESTIGE LEARNING PLATFORM',
    keyUsed: 'Shift +3',
    date: '2026-09-23 09:30',
    difficulty: 'Intermediate',
    score: 250,
    timeTakenSeconds: 74,
    hasReport: true,
    reportId: 'rep-seed-02',
  },
];

class StorageService {
  private isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window;
    } catch {
      return false;
    }
  }

  getUserProfile(): UserProfile {
    if (!this.isAvailable()) return DEFAULT_USER_PROFILE;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!data) return DEFAULT_USER_PROFILE;
      const profile: UserProfile = JSON.parse(data);
      if (profile.username === 'Agent Cipher' || profile.username === 'Agent') {
        profile.username = DEFAULT_USER_PROFILE.username;
        this.saveUserProfile(profile);
      }
      if (profile.callsign === 'SPECTRE-09' || profile.callsign?.includes('SPECTRE')) {
        profile.callsign = DEFAULT_USER_PROFILE.callsign;
        this.saveUserProfile(profile);
      }
      // Single-Admin Security Rule: only itzpardhiv@gmail.com can possess ADMIN privileges
      if (profile.role === 'ADMIN' && profile.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
        profile.role = 'USER';
        this.saveUserProfile(profile);
      }
      return profile;
    } catch (e) {
      console.error('Error loading user profile:', e);
      return DEFAULT_USER_PROFILE;
    }
  }

  saveUserProfile(profile: UserProfile): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  }

  getFolders(): Folder[] {
    if (!this.isAvailable()) return DEFAULT_FOLDERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (!data) return DEFAULT_FOLDERS;
      const folders: Folder[] = JSON.parse(data);
      const cleaned = folders.filter(
        (f) => !f.name.toLowerCase().includes('ghost') && !f.name.toLowerCase().includes('operation')
      );
      if (cleaned.length !== folders.length) {
        this.saveFolders(cleaned.length > 0 ? cleaned : DEFAULT_FOLDERS);
      }
      return cleaned.length > 0 ? cleaned : DEFAULT_FOLDERS;
    } catch (e) {
      console.error('Error loading folders:', e);
      return DEFAULT_FOLDERS;
    }
  }

  saveFolders(folders: Folder[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.error('Error saving folders:', e);
    }
  }

  getInvestigations(): SavedInvestigation[] {
    if (!this.isAvailable()) return DEFAULT_INVESTIGATIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_INVESTIGATIONS);
      if (!data) return DEFAULT_INVESTIGATIONS;
      const invs: SavedInvestigation[] = JSON.parse(data);
      let updated = false;

      const cleanedInvs = invs.map((inv) => {
        const isSeed = inv.id.startsWith('inv-seed-');
        if (!isSeed) {
          return inv;
        }

        let name = inv.name || '';
        let missionNumber = inv.missionNumber || '';
        let originalCipher = inv.originalCipher || '';
        let decodedText = inv.decodedText || '';

        const cipherLabel = inv.cipherType ? (inv.cipherType.charAt(0).toUpperCase() + inv.cipherType.slice(1) + ' Cipher') : 'Caesar Cipher';

        const isSpyThemed = /ghost\s*protocol|infiltration|operative|agent|spy|classified|top\s*secret|threat|recon|tactical|black\s*ops|clearance|intelligence|mission/i.test(
          `${name} ${missionNumber} ${decodedText}`
        );

        if (isSpyThemed) {
          updated = true;
          name = `${cipherLabel} · Decoding Session`;
          missionNumber = cipherLabel;
          if (decodedText.includes('INTELLIGENCE') || originalCipher.includes('LQWHOOLJHQFH')) {
            originalCipher = 'SUHVWLJH OHDUQLQJ SODWIRUP';
            decodedText = 'PRESTIGE LEARNING PLATFORM';
          }
        }

        // Clean any residual MISSION XX or SESSION XX labels
        if (/^(MISSION|DECODING SESSION)\s*\d*\s*[:·-]?\s*/i.test(missionNumber)) {
          updated = true;
          missionNumber = cipherLabel;
        }

        return {
          ...inv,
          name,
          missionNumber,
          originalCipher,
          decodedText,
        };
      });

      if (updated) {
        this.saveInvestigations(cleanedInvs);
      }
      return cleanedInvs;
    } catch (e) {
      console.error('Error loading investigations:', e);
      return DEFAULT_INVESTIGATIONS;
    }
  }

  saveInvestigations(investigations: SavedInvestigation[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_INVESTIGATIONS, JSON.stringify(investigations));
    } catch (e) {
      console.error('Error saving investigations:', e);
    }
  }

  getReports(): Record<string, InvestigationReport> {
    if (!this.isAvailable()) return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (!data) return {};
      const reports: Record<string, InvestigationReport> = JSON.parse(data);
      let updated = false;

      const cleanedReports: Record<string, InvestigationReport> = {};

      for (const [id, rep] of Object.entries(reports)) {
        const isSeed = id.startsWith('rep-seed-');
        if (!isSeed) {
          cleanedReports[id] = rep;
          continue;
        }

        let title = rep.title || '';
        let missionNumber = rep.missionNumber || '';
        let originalCipher = rep.originalCipher || '';
        let decodedMessage = rep.decodedMessage || '';
        const cipherLabel = rep.cipherName || 'Caesar Cipher';

        const isSpyThemed = /ghost\s*protocol|infiltration|operative|agent|spy|classified|top\s*secret|threat|recon|tactical|black\s*ops|clearance|intelligence|mission/i.test(
          `${title} ${missionNumber} ${decodedMessage}`
        );

        if (isSpyThemed) {
          updated = true;
          title = `${cipherLabel} · Decoding Session`;
          missionNumber = `${cipherLabel} Session`;
          if (decodedMessage.includes('INTELLIGENCE') || originalCipher.includes('LQWHOOLJHQFH')) {
            originalCipher = 'SUHVWLJH OHDUQLQJ SODWIRUP';
            decodedMessage = 'PRESTIGE LEARNING PLATFORM';
          }
        }

        // Clean any residual MISSION XX or SESSION XX labels
        if (/^(MISSION|DECODING SESSION)\s*\d*\s*[:·-]?\s*/i.test(missionNumber)) {
          updated = true;
          missionNumber = `${cipherLabel} Session`;
        }

        cleanedReports[id] = {
          ...rep,
          title,
          missionNumber,
          originalCipher,
          decodedMessage,
        };
      }

      if (updated) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(cleanedReports));
      }
      return cleanedReports;
    } catch (e) {
      console.error('Error loading reports:', e);
      return {};
    }
  }

  saveReport(report: InvestigationReport): void {
    if (!this.isAvailable()) return;
    try {
      const reports = this.getReports();
      reports[report.id] = report;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.error('Error saving report:', e);
    }
  }

  deleteReport(id: string): void {
    if (!this.isAvailable()) return;
    try {
      const reports = this.getReports();
      if (reports[id]) {
        delete reports[id];
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      }
    } catch (e) {
      console.error('Error deleting report:', e);
    }
  }

  getReportById(id: string): InvestigationReport | null {
    const reports = this.getReports();
    return reports[id] || null;
  }
}

export const storageService = new StorageService();
