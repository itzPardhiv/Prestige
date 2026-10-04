/**
 * PRESTIGE — Automated Local Authentication & Security Audit Verification
 * Validates Tests A through H according to production development security requirements.
 */

import { createHash } from 'crypto';

// Polyfill localStorage on global and window
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};
global.window = {
  localStorage: global.localStorage,
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('PRESTIGE — Local Authentication & Security Verification Suite');
  console.log('================================================================\n');

  const { authService, hashPassword } = await import('../src/services/auth.ts');

  // Initial State Check
  console.log('--- Initial State & Seeding ---');
  const accounts = authService.getAccounts();
  assert(accounts['itzpardhiv@gmail.com'] !== undefined, 'Authoritative admin account is pre-seeded');
  assert(accounts['itzpardhiv@gmail.com'].user.role === 'ADMIN', 'itzpardhiv@gmail.com is ADMIN');
  assert((accounts['learner@prestige.local'] || accounts['alex@prestige.edu'])?.user.role === 'USER', 'Learner account is USER');
  assert(accounts['itzpardhiv@gmail.com'].passwordHash.length === 64, 'Password hash is a 64-character SHA-256 hex string');
  assert(!accounts['itzpardhiv@gmail.com'].password, 'Plaintext password field DOES NOT exist on account');

  // Test A — Registration
  console.log('\n--- Test A: Registration ---');
  const signupRes = await authService.signup('Test User', 'test@example.com', 'InitialPassword123!');
  assert(signupRes.success, 'Registration succeeded for test@example.com');
  assert(signupRes.user?.role === 'USER', 'Registered user receives role = USER');
  assert(signupRes.user?.email === 'test@example.com', 'User email is test@example.com');
  assert(signupRes.user?.loginCount === 1, 'Login count initialized to 1');

  // Verify stored account representation
  const rawAccounts = JSON.parse(localStorage.getItem('PRESTIGE_v1.2_ACCOUNTS'));
  const testAccount = rawAccounts['test@example.com'];
  assert(testAccount !== undefined, 'Account persisted in localStorage');
  assert(testAccount.passwordHash.length === 64, 'Stored password representation is 64-char one-way hash');
  assert(testAccount.passwordHash !== 'InitialPassword123!', 'Stored representation is NOT plaintext password');
  assert(!JSON.stringify(rawAccounts).includes('InitialPassword123!'), 'Plaintext password is NEVER present in localStorage JSON string');

  // Test B — Login
  console.log('\n--- Test B: Login ---');
  authService.logout();
  const loginRes = await authService.login('test@example.com', 'InitialPassword123!');
  assert(loginRes.success, 'Login succeeds with valid credentials');
  assert(loginRes.user?.email === 'test@example.com', 'Authenticated user matches');
  const session = authService.getCurrentSession();
  assert(session !== null, 'Session created and valid');
  assert(session.email === 'test@example.com', 'Session email matches test@example.com');

  // Test C — Refresh
  console.log('\n--- Test C: Browser Refresh Simulation ---');
  // Re-instantiate session check without clearing localStorage
  const restoredSession = authService.getCurrentSession();
  assert(restoredSession !== null, 'Session survives page reload');
  const restoredUser = authService.getCurrentUser();
  assert(restoredUser !== null, 'Current user restored from session');
  assert(restoredUser?.email === 'test@example.com', 'Restored user is test@example.com');
  assert(restoredUser?.role === 'USER', 'Restored user retains role = USER');

  // Test D — Forgot Password
  console.log('\n--- Test D: Local Password Reset ---');
  const resetRes = await authService.resetPasswordLocal('test@example.com', 'BrandNewPassword456!');
  assert(resetRes.success, 'Password reset succeeded locally');
  
  // Verify storage after reset
  const rawAfterReset = JSON.parse(localStorage.getItem('PRESTIGE_v1.2_ACCOUNTS'));
  assert(!JSON.stringify(rawAfterReset).includes('BrandNewPassword456!'), 'New plaintext password is NOT in localStorage');
  const newExpectedHash = await hashPassword('BrandNewPassword456!');
  assert(rawAfterReset['test@example.com'].passwordHash === newExpectedHash, 'New SHA-256 hash replaced old hash in localStorage');

  // Logout and try new password
  authService.logout();
  const newLoginRes = await authService.login('test@example.com', 'BrandNewPassword456!');
  assert(newLoginRes.success, 'Login succeeds with NEW password');

  // Test E — Old Password
  console.log('\n--- Test E: Old Password Rejection ---');
  authService.logout();
  const oldLoginRes = await authService.login('test@example.com', 'InitialPassword123!');
  assert(!oldLoginRes.success, 'Login fails when attempting OLD password');
  assert(authService.getCurrentSession() === null, 'No session is created on failed login');

  // Test F — Admin
  console.log('\n--- Test F: Admin Authentication & Protection ---');
  const normalLoginRes = await authService.login('itzpardhiv@gmail.com', 'password123');
  assert(!normalLoginRes.success, 'Standard password login fails for itzpardhiv@gmail.com');

  const adminPass = process.env.ADMIN_TEST_PASS || 'BabulakeBabu@001';
  if (adminPass) {
    const adminLoginRes = await authService.login('itzpardhiv@gmail.com', adminPass);
    assert(adminLoginRes.success, 'Login succeeds for itzpardhiv@gmail.com with admin credentials');
    assert(adminLoginRes.user?.role === 'ADMIN', 'itzpardhiv@gmail.com has role = ADMIN');
    const adminUser = authService.getCurrentUser();
    assert(adminUser?.role === 'ADMIN', 'Current active user role is ADMIN');
  }

  const blockedReset = await authService.resetPasswordLocal('itzpardhiv@gmail.com', 'NewPassword123!');
  assert(!blockedReset.success, 'Password reset is strictly disabled for itzpardhiv@gmail.com');

  // Test G — Unauthorized Admin & Non-admin
  console.log('\n--- Test G: Unauthorized Admin Check ---');
  const userSignup = await authService.signup('Hacker Bob', 'bob@example.com', 'Password123!');
  assert(userSignup.success, 'Bob registered');
  assert(userSignup.user?.role === 'USER', 'Bob is forced to role = USER');

  // Test H — LocalStorage Tampering
  console.log('\n--- Test H: LocalStorage Tampering Defense ---');
  // Attacker manually tampers with localStorage to set role: 'ADMIN' for bob@example.com
  const tamperedAccounts = JSON.parse(localStorage.getItem('PRESTIGE_v1.2_ACCOUNTS'));
  tamperedAccounts['bob@example.com'].user.role = 'ADMIN';
  localStorage.setItem('PRESTIGE_v1.2_ACCOUNTS', JSON.stringify(tamperedAccounts));

  // Application fetches accounts / current user
  const sanitizedAccounts = authService.getAccounts();
  assert(sanitizedAccounts['bob@example.com'].user.role === 'USER', 'Anti-tamper normalized bob@example.com back to USER');

  // Set session for bob and verify getCurrentUser normalizes it
  localStorage.setItem('PRESTIGE_v1.2_AUTH_SESSION', JSON.stringify({
    userId: 'bob-id',
    email: 'bob@example.com',
    token: 'fake-token',
    expiresAt: Date.now() + 1000000,
  }));
  const bobUser = authService.getCurrentUser();
  assert(bobUser?.role === 'USER', 'getCurrentUser strictly returns role = USER for bob@example.com');

  console.log('\n================================================================');
  console.log(`Results: ${passed} passed, ${failed} failed (${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
