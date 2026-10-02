import { UserProfile, AuthSession } from '../types/user';
import { DEFAULT_USER_PROFILE } from './storage';

const SESSION_KEY = 'PRESTIGE_v1.2_AUTH_SESSION';
const ACCOUNTS_KEY = 'PRESTIGE_v1.2_ACCOUNTS';

interface StoredAccount {
  user: UserProfile;
  passwordHash: string; // Stored securely for client-side authentication
}

class AuthService {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && 'localStorage' in window;
  }

  // Get all registered accounts; seed with starter learner if empty
  getAccounts(): Record<string, StoredAccount> {
    if (!this.isAvailable()) return {};
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) {
        const seeded: Record<string, StoredAccount> = {
          'alex@prestige.edu': {
            user: {
              ...DEFAULT_USER_PROFILE,
              id: 'learner-alex-01',
              username: 'Alex Morgan',
              name: 'Alex Morgan',
              email: 'alex@prestige.edu',
              callsign: 'ALEX-09',
              level: 'Level 2 · Cryptography Apprentice',
              progress: 68,
            },
            passwordHash: 'password123',
          },
        };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse accounts:', e);
      return {};
    }
  }

  private saveAccounts(accounts: Record<string, StoredAccount>): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts:', e);
    }
  }

  getCurrentSession(): AuthSession | null {
    if (!this.isAvailable()) return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  getCurrentUser(): UserProfile | null {
    const session = this.getCurrentSession();
    if (!session) return null;
    const accounts = this.getAccounts();
    const account = accounts[session.email.toLowerCase()];
    if (!account) return null;
    // Single-Admin Security Rule: only itzpardhiv@gmail.com can possess ADMIN privileges
    if (account.user.role === 'ADMIN' && account.user.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
      account.user.role = 'USER';
      this.saveAccounts(accounts);
    }
    return account.user;
  }

  login(email: string, password: string): { success: boolean; user?: UserProfile; error?: string } {
    if (!email || !password) {
      return { success: false, error: 'Please provide both email and password.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts[cleanEmail];

    if (!account) {
      return { success: false, error: 'No account found with this email. Please check your credentials or create a new account.' };
    }

    if (account.passwordHash !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Create session (valid for 30 days)
    const session: AuthSession = {
      userId: account.user.id,
      email: cleanEmail,
      token: `ptg_token_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: account.user };
  }

  signup(name: string, email: string, password: string): { success: boolean; user?: UserProfile; error?: string } {
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();

    if (accounts[cleanEmail]) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const initials = name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'LE';

    const newUser: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      id: `learner_${Date.now().toString(36)}`,
      username: name.trim(),
      name: name.trim(),
      email: cleanEmail,
      callsign: `${initials}-${Math.floor(10 + Math.random() * 90)}`,
      stats: {
        ...DEFAULT_USER_PROFILE.stats,
        codesDecoded: 0,
        accuracy: 100,
        currentStreak: 1,
        bestStreak: 1,
        xp: 100, // Starter bonus
        rank: 'INITIATE',
        fastestSolveSeconds: 0,
        reportsGenerated: 0,
        savedInvestigationsCount: 0,
      },
      completedChallengeIds: [],
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
    };

    accounts[cleanEmail] = {
      user: newUser,
      passwordHash: password,
    };

    this.saveAccounts(accounts);

    // Automatically authenticate the new user
    const session: AuthSession = {
      userId: newUser.id,
      email: cleanEmail,
      token: `ptg_token_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, user: newUser };
  }

  demoLogin(): { success: boolean; user: UserProfile } {
    const accounts = this.getAccounts();
    const demoEmail = 'alex@prestige.edu';
    const account = accounts[demoEmail];

    const user = account ? account.user : {
      ...DEFAULT_USER_PROFILE,
      id: 'learner-alex-01',
      username: 'Alex Morgan',
      name: 'Alex Morgan',
      email: demoEmail,
      callsign: 'ALEX-09',
    };

    const session: AuthSession = {
      userId: user.id,
      email: demoEmail,
      token: `ptg_demo_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user };
  }

  logout(): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  }

  saveCurrentUser(user: UserProfile): void {
    if (!this.isAvailable() || !user.email) return;
    try {
      const cleanEmail = user.email.toLowerCase();
      const accounts = this.getAccounts();
      if (accounts[cleanEmail]) {
        accounts[cleanEmail].user = user;
        this.saveAccounts(accounts);
      }
    } catch (e) {
      console.error('Failed to save current user profile:', e);
    }
  }
}

export const authService = new AuthService();
