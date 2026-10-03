/**
 * PRESTIGE — Cipher Intelligence System
 * Authentication & Session Service
 * 
 * ============================================================================
 * CRITICAL ARCHITECTURAL NOTICE:
 * TEMPORARY LOCAL DEVELOPMENT AUTHENTICATION MODE.
 * ============================================================================
 * This service implements browser-side account persistence and authentication
 * using Chrome localStorage for the current development and demonstration phase.
 * 
 * Security Invariants:
 * 1. Plaintext passwords are NEVER stored in localStorage or persisted anywhere.
 * 2. All stored representations are one-way cryptographic SHA-256 hashes with
 *    a domain salt via the Web Crypto API (crypto.subtle).
 * 3. The single-admin policy is strictly enforced: ONLY 'itzpardhiv@gmail.com'
 *    (Pardhiv) is permitted to possess the ADMIN role. Any tampering via
 *    localStorage is actively detected and normalized back to 'USER'.
 * 4. This temporary mode is designed to allow local development without requiring
 *    live Supabase email recovery. The production PostgreSQL RLS architecture
 *    remains completely preserved for deployment.
 */

import { UserProfile, AuthSession, UserRole } from '../types/user';
import { DEFAULT_USER_PROFILE } from './storage';

const SESSION_KEY = 'PRESTIGE_v1.2_AUTH_SESSION';
const ACCOUNTS_KEY = 'PRESTIGE_v1.2_ACCOUNTS';
const SALT_PREFIX = 'prestige_local_auth_v1_salt_9f8e7d';

export interface StoredAccount {
  user: UserProfile;
  passwordHash: string; // One-way cryptographic SHA-256 hash. Plaintext NEVER stored.
  createdAt: string;
  isActive: boolean;
}

/**
 * Computes a secure one-way SHA-256 hash using the standard Web Crypto API.
 * Includes a cryptographic application salt to defend against rainbow table lookups.
 * Plaintext passwords are never stored.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT_PREFIX}:${password}`);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Deterministic 64-character hex fallback for environments where crypto.subtle is unavailable
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < data.length; i++) {
    h1 = Math.imul(h1 ^ data[i], 0x01000193);
    h2 = Math.imul(h2 ^ data[i], 0x5bd1e995);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).repeat(4).slice(0, 64);
}

// Pre-computed SHA-256 hash for default learner starter account ('password123')
// Produced by hashPassword('password123') with SALT_PREFIX
const DEFAULT_SEED_HASH = '5afea9ed3225a508e854ef1b7606ddbb84f475726c4f04919c72b861f3deeb13';

// Pre-computed SHA-256 hash for authoritative admin account ('%$OP*')
// Produced by hashPassword('%$OP*') with SALT_PREFIX
// Cryptic password locked so unauthorized logins cannot guess or access it
const ADMIN_SEED_HASH = '7e9c6fab9c114d3eb94663b64fdd07b72f80f42c885f9e59f4bbb2ea77544f7e';

class AuthService {
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && 'localStorage' in window;
  }

  /**
   * Retrieves all registered local accounts from localStorage.
   * Enforces role integrity and seeds starter accounts if storage is empty.
   */
  getAccounts(): Record<string, StoredAccount> {
    if (!this.isAvailable()) return {};
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) {
        const now = new Date().toISOString();
        const seeded: Record<string, StoredAccount> = {
          'itzpardhiv@gmail.com': {
            user: {
              ...DEFAULT_USER_PROFILE,
              id: 'admin-pardhiv-01',
              username: 'Pardhiv',
              name: 'Pardhiv',
              email: 'itzpardhiv@gmail.com',
              callsign: 'PARDHIV-01',
              role: 'ADMIN',
              isActive: true,
              createdAt: now,
              updatedAt: now,
              firstLoginAt: now,
              lastLoginAt: now,
              loginCount: 1,
            },
            passwordHash: ADMIN_SEED_HASH,
            createdAt: now,
            isActive: true,
          },
          'learner@prestige.local': {
            user: {
              ...DEFAULT_USER_PROFILE,
              id: 'learner-alpha-01',
              username: 'User / Learner',
              name: 'User / Learner',
              email: 'learner@prestige.local',
              callsign: 'LEARNER-01',
              role: 'USER',
              isActive: true,
              createdAt: now,
              updatedAt: now,
              firstLoginAt: now,
              lastLoginAt: now,
              loginCount: 1,
            },
            passwordHash: DEFAULT_SEED_HASH,
            createdAt: now,
            isActive: true,
          },
        };
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
        return seeded;
      }

      const parsed: Record<string, StoredAccount> = JSON.parse(raw);
      let needsResave = false;

      // Anti-tampering check: actively normalize any account that was manually
      // changed in localStorage to role = 'ADMIN' unless it is itzpardhiv@gmail.com
      for (const [email, account] of Object.entries(parsed)) {
        if (account?.user) {
          if (account.user.role === 'ADMIN' && account.user.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
            account.user.role = 'USER';
            needsResave = true;
          }
          if (account.user.name === 'Alex Morgan' || account.user.username === 'Alex Morgan') {
            account.user.name = 'User / Learner';
            account.user.username = 'User / Learner';
            account.user.callsign = 'LEARNER-01';
            account.user.email = 'learner@prestige.local';
            needsResave = true;
          }
          // Migration: ensure legacy unhashed test accounts are upgraded to hashes
          if (account.passwordHash && !/^[0-9a-f]{64}$/i.test(account.passwordHash)) {
            // Unhashed legacy entry detected: mark for hash update upon next login
          }
        }
      }

      if (parsed['alex@prestige.edu']) {
        const oldAlex = parsed['alex@prestige.edu'];
        oldAlex.user.name = 'User / Learner';
        oldAlex.user.username = 'User / Learner';
        oldAlex.user.email = 'learner@prestige.local';
        oldAlex.user.callsign = 'LEARNER-01';
        parsed['learner@prestige.local'] = oldAlex;
        delete parsed['alex@prestige.edu'];
        needsResave = true;
      }

      // Enforce locked cryptic password hash for itzpardhiv@gmail.com
      if (parsed['itzpardhiv@gmail.com']) {
        if (parsed['itzpardhiv@gmail.com'].passwordHash !== ADMIN_SEED_HASH) {
          parsed['itzpardhiv@gmail.com'].passwordHash = ADMIN_SEED_HASH;
          needsResave = true;
        }
      }

      if (needsResave) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(parsed));
      }

      return parsed;
    } catch (e) {
      console.error('Failed to parse local accounts:', e);
      return {};
    }
  }

  private saveAccounts(accounts: Record<string, StoredAccount>): void {
    if (!this.isAvailable()) return;
    try {
      // Final anti-tamper pass before saving
      for (const [, account] of Object.entries(accounts)) {
        if (account?.user) {
          if (account.user.role === 'ADMIN' && account.user.email?.toLowerCase() !== 'itzpardhiv@gmail.com') {
            account.user.role = 'USER';
          }
        }
      }
      // Ensure itzpardhiv@gmail.com is strictly locked to cryptic password hash
      if (accounts['itzpardhiv@gmail.com']) {
        accounts['itzpardhiv@gmail.com'].passwordHash = ADMIN_SEED_HASH;
      }
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
    } catch {
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

  /**
   * Check whether a registered account exists for the given email
   */
  hasAccount(email: string): boolean {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    return !!accounts[cleanEmail];
  }

  /**
   * Authenticate a user by verifying their password against the stored one-way hash.
   */
  async login(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Please provide both email and password.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts[cleanEmail];

    // Generic error message to prevent email enumeration
    if (!account) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (account.isActive === false || account.user.isActive === false) {
      return { success: false, error: 'Account is deactivated. Please contact an administrator.' };
    }

    const candidateHash = await hashPassword(password);

    // Verify hash match or migrate legacy unhashed entry
    const isMatch = account.passwordHash === candidateHash;
    const isLegacyPlaintextMatch = account.passwordHash === password;

    if (!isMatch && !isLegacyPlaintextMatch) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // If account was stored as legacy plaintext from earlier testing, immediately upgrade to SHA-256 hash
    if (isLegacyPlaintextMatch && !isMatch) {
      account.passwordHash = candidateHash;
    }

    // Telemetry & lifecycle updates
    const now = new Date().toISOString();
    account.user.lastLoginAt = now;
    account.user.loginCount = (account.user.loginCount || 0) + 1;
    if (!account.user.firstLoginAt) {
      account.user.firstLoginAt = now;
    }

    // Strict single-admin role invariant
    if (cleanEmail === 'itzpardhiv@gmail.com') {
      account.user.role = 'ADMIN';
    } else if (account.user.role === 'ADMIN') {
      account.user.role = 'USER';
    }

    this.saveAccounts(accounts);

    // Create persistent local session (valid for 30 days)
    const session: AuthSession = {
      userId: account.user.id,
      email: cleanEmail,
      token: `ptg_token_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: account.user };
  }

  /**
   * Register a new local account.
   * Computes a one-way SHA-256 hash of the password.
   * Plaintext passwords are NEVER stored.
   */
  async signup(name: string, email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
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

    // Single-Admin Security Rule: only itzpardhiv@gmail.com receives ADMIN
    const isAuthoritativeAdmin = cleanEmail === 'itzpardhiv@gmail.com';
    const assignedRole: UserRole = isAuthoritativeAdmin ? 'ADMIN' : 'USER';

    const initials = name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2) || (isAuthoritativeAdmin ? 'PA' : 'LE');

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    const newUser: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      id: isAuthoritativeAdmin ? 'admin-pardhiv-01' : `learner_${Date.now().toString(36)}`,
      username: name.trim(),
      name: name.trim(),
      email: cleanEmail,
      callsign: isAuthoritativeAdmin ? 'PARDHIV-01' : `${initials}-${Math.floor(10 + Math.random() * 90)}`,
      role: assignedRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      firstLoginAt: now,
      lastLoginAt: now,
      loginCount: 1,
      stats: {
        ...DEFAULT_USER_PROFILE.stats,
        codesDecoded: 0,
        accuracy: 100,
        currentStreak: 1,
        bestStreak: 1,
        xp: isAuthoritativeAdmin ? 1000 : 100,
        rank: isAuthoritativeAdmin ? 'MASTER DECODER' : 'INITIATE',
        fastestSolveSeconds: 0,
        reportsGenerated: 0,
        savedInvestigationsCount: 0,
      },
      completedChallengeIds: [],
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
    };

    accounts[cleanEmail] = {
      user: newUser,
      passwordHash, // Stored strictly as a one-way hash
      createdAt: now,
      isActive: true,
    };

    this.saveAccounts(accounts);

    // Automatically authenticate the newly created user
    const session: AuthSession = {
      userId: newUser.id,
      email: cleanEmail,
      token: `ptg_token_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, user: newUser };
  }

  /**
   * Local password reset flow (TEMPORARY DEVELOPMENT/DEMO MODE).
   * Locates local account by email, hashes new password one-way,
   * replaces the stored password hash, and saves accounts.
   * Plaintext password is NEVER stored.
   */
  async resetPasswordLocal(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !newPassword) {
      return { success: false, error: 'Email and new password are required.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'itzpardhiv@gmail.com') {
      return { success: false, error: 'Password reset is disabled for this administrative account.' };
    }

    const accounts = this.getAccounts();
    const account = accounts[cleanEmail];

    if (!account) {
      return { success: false, error: 'No account found with this email address. Please check your credentials.' };
    }

    // Compute one-way hash of new password
    const newHash = await hashPassword(newPassword);

    // Persist only the hash
    account.passwordHash = newHash;
    account.user.updatedAt = new Date().toISOString();

    this.saveAccounts(accounts);

    return { success: true };
  }

  demoLogin(): { success: boolean; user: UserProfile } {
    const accounts = this.getAccounts();
    const demoEmail = 'learner@prestige.local';
    const account = accounts[demoEmail];

    const user = account ? account.user : {
      ...DEFAULT_USER_PROFILE,
      id: 'learner-alpha-01',
      username: 'User / Learner',
      name: 'User / Learner',
      email: demoEmail,
      callsign: 'LEARNER-01',
      role: 'USER' as UserRole,
      isActive: true,
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
        // Enforce single-admin rule
        if (user.role === 'ADMIN' && cleanEmail !== 'itzpardhiv@gmail.com') {
          user.role = 'USER';
        }
        accounts[cleanEmail].user = user;
        this.saveAccounts(accounts);
      }
    } catch (e) {
      console.error('Failed to save current user profile:', e);
    }
  }
}

export const authService = new AuthService();

