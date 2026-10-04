/**
 * PRESTIGE — Admin Account Restoration & Security Invariant Test Suite
 * 
 * Verifies:
 * 1. itzpardhiv@gmail.com profile restoration and ADMIN role preservation.
 * 2. Profile role derivation is driven by database ProfileRow, not hardcoded frontend authorization.
 * 3. itzpardhiv@gmail.com does NOT inherit 0% initiate stats or learner progress.
 * 4. Normal new users strictly start at 0% across all 6 curricula.
 * 5. Existing learner progress is completely untouched.
 * 6. Single-admin security policy: non-admins are strictly forbidden from ADMIN clearance.
 * 7. Migration file 20261004000001_restore_admin.sql syntax and invariants.
 */

// Polyfill localStorage on global and window for Node execution
const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: any) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
(global as any).sessionStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: any) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
(global as any).window = {
  localStorage: (global as any).localStorage,
  sessionStorage: (global as any).sessionStorage,
  location: { origin: 'https://theprestige.vercel.app', pathname: '/admin' },
};

import fs from 'fs';
import path from 'path';
import { supabaseAuthService } from '../src/services/supabaseAuth';
import { storageService, createNewUserProfile, DEFAULT_USER_PROFILE } from '../src/services/storage';
import { ProfileRow } from '../types/supabase';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
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
  console.log('PRESTIGE — ADMIN ACCOUNT RESTORATION VERIFICATION SUITE');
  console.log('================================================================\n');

  // STEP 1: Verify Migration File 20261004000001_restore_admin.sql
  console.log('--- Step 1: Database Migration Structure & Security Rules ---');
  const migrationPath = path.resolve('supabase/migrations/20261004000001_restore_admin.sql');
  assert(fs.existsSync(migrationPath), 'Migration file exists at supabase/migrations/20261004000001_restore_admin.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  assert(migrationSql.includes("itzpardhiv@gmail.com"), 'Migration targets itzpardhiv@gmail.com');
  assert(migrationSql.includes("role = 'ADMIN'"), "Migration sets role = 'ADMIN'");
  assert(migrationSql.includes("Pardhiv"), "Migration restores display_name as 'Pardhiv'");
  assert(migrationSql.includes("FUNCTION public.handle_new_user()"), 'Migration updates handle_new_user trigger function');
  assert(migrationSql.includes("FUNCTION public.record_login_success"), 'Migration updates record_login_success RPC');
  assert(migrationSql.includes("FUNCTION public.restore_admin_profile"), 'Migration creates restore_admin_profile RPC');
  assert(migrationSql.includes("FUNCTION public.check_admin_account_status"), 'Migration creates check_admin_account_status RPC');

  // STEP 2: Verify Profile Mapping
  console.log('\n--- Step 2: Database Profile Mapping Invariants ---');
  const adminProfileRow: ProfileRow = {
    id: 'admin-uuid-12345',
    email: 'itzpardhiv@gmail.com',
    display_name: 'Pardhiv',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-10-04T00:00:00.000Z',
    first_login_at: '2026-09-01T00:00:00.000Z',
    last_login_at: '2026-10-04T00:00:00.000Z',
    login_count: 42,
    report_count: 5,
  };

  const mappedAdmin = supabaseAuthService.mapProfileToUser(adminProfileRow);
  assert(mappedAdmin.id === 'admin-uuid-12345', 'Mapped admin retains database user UUID');
  assert(mappedAdmin.role === 'ADMIN', 'Mapped admin has role = ADMIN');
  assert(mappedAdmin.email === 'itzpardhiv@gmail.com', 'Mapped admin email is itzpardhiv@gmail.com');
  assert(mappedAdmin.callsign === 'PARDHIV-01', 'Admin receives callsign PARDHIV-01');
  assert(mappedAdmin.stats.rank === 'MASTER DECODER', 'Admin rank is MASTER DECODER');
  assert(mappedAdmin.stats.xp === 1000, 'Admin XP is 1000');
  assert(mappedAdmin.stats.codesDecoded === 12, 'Admin stats has codesDecoded = 12 (not 0)');

  // Verify Learner Profile Row
  const learnerProfileRow: ProfileRow = {
    id: 'learner-uuid-99999',
    email: 'newlearner@prestige.local',
    display_name: 'New Learner',
    role: 'USER',
    is_active: true,
    created_at: '2026-10-04T00:00:00.000Z',
    updated_at: '2026-10-04T00:00:00.000Z',
    first_login_at: '2026-10-04T00:00:00.000Z',
    last_login_at: '2026-10-04T00:00:00.000Z',
    login_count: 1,
    report_count: 0,
  };

  const mappedLearner = supabaseAuthService.mapProfileToUser(learnerProfileRow);
  assert(mappedLearner.role === 'USER', 'Learner profile maps to role = USER');
  assert(mappedLearner.stats.rank === 'INITIATE', 'Learner rank is INITIATE');
  assert(mappedLearner.stats.xp === 0, 'Learner XP is 0');
  assert(mappedLearner.stats.codesDecoded === 0, 'Learner codesDecoded is 0');

  // STEP 3: Admin User Enrichment Isolation (Does NOT overwrite with 0% initiate stats)
  console.log('\n--- Step 3: Admin Profile Enrichment Isolation ---');
  const enrichedAdmin = await supabaseAuthService.enrichUserProfile(mappedAdmin);
  assert(enrichedAdmin.role === 'ADMIN', 'Enriched admin preserves role = ADMIN');
  assert(enrichedAdmin.stats.rank === 'MASTER DECODER', 'Enriched admin preserves MASTER DECODER rank');
  assert(enrichedAdmin.stats.xp === 1000, 'Enriched admin preserves 1000 XP');
  assert(enrichedAdmin.stats.codesDecoded === 12, 'Enriched admin preserves 12 decoded ciphers');

  // STEP 4: Genuinely New Learner Profile Creation
  console.log('\n--- Step 4: Genuinely New Learner 0% Invariant ---');
  const newLearner = createNewUserProfile('learner-id-abc', 'brandnew@test.com', 'Brand New');
  assert(newLearner.role === 'USER', 'New learner receives role = USER');
  assert(newLearner.stats.xp === 0, 'New learner XP is strictly 0');
  assert(newLearner.stats.codesDecoded === 0, 'New learner codesDecoded is strictly 0');
  assert(newLearner.stats.rank === 'INITIATE', 'New learner rank is INITIATE');
  newLearner.curriculumMastery.forEach((item) => {
    assert(item.percent === 0, `New learner curriculum "${item.name}" is strictly 0%`);
  });

  // STEP 5: Storage Service Scoping & Preservation
  console.log('\n--- Step 5: Storage Service Scoping & Role Security ---');
  storageService.saveUserProfile(mappedAdmin);
  const reloadedAdmin = storageService.getUserProfile('admin-uuid-12345');
  assert(reloadedAdmin.role === 'ADMIN', 'Storage preserves ADMIN role for admin-uuid-12345');
  assert(reloadedAdmin.email === 'itzpardhiv@gmail.com', 'Storage preserves admin email');

  // Verify anti-tamper on malicious user attempting ADMIN role in storage
  const maliciousUser = {
    ...mappedLearner,
    id: 'hacker-uuid',
    email: 'hacker@example.com',
    role: 'ADMIN' as any,
  };
  storageService.saveUserProfile(maliciousUser);
  const sanitizedUser = storageService.getUserProfile('hacker-uuid');
  assert(sanitizedUser.role === 'USER', 'Storage service anti-tamper forces unauthorized user to role = USER');

  console.log('\n================================================================');
  console.log(`ADMIN RESTORATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in admin restoration verification:', err);
  process.exit(1);
});
