/**
 * PRESTIGE — Verification Test Suite
 * Test: New-User Progress Initialization & User Isolation
 */

import { CANONICAL_CURRICULUM, computeCurriculumMastery, getDefaultCurriculumMastery } from '../src/utils/curriculum.ts';
import { createNewUserProfile } from '../src/services/storage.ts';
import { USE_LOCAL_DEV_AUTH } from '../src/config/authMode.ts';
import { INITIAL_CHALLENGES } from '../src/data/mockChallenges.ts';
import fs from 'fs';
import path from 'path';

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

console.log('\n==================================================');
console.log('PRESTIGE — NEW-USER PROGRESS TEST SUITE');
console.log('==================================================\n');

// 1. Verify 6 Canonical Curriculum Definitions
console.log('TEST 1: Canonical Curriculum Definitions');
assert(CANONICAL_CURRICULUM.length === 6, 'Exactly 6 canonical curriculum items exist');
const expectedTitles = [
  'Caesar & Rotational Ciphers',
  'Atbash Inverted Alphabet',
  'Vigenère Polyalphabetic Key Schedules',
  'International Morse Code Encoding',
  'Monoalphabetic Substitution & Letter Frequency',
  'Base64 & 8-Bit Binary Encodings',
];
expectedTitles.forEach((title) => {
  const item = CANONICAL_CURRICULUM.find((c) => c.name === title);
  assert(item !== undefined, `Found canonical curriculum item: "${title}"`);
});

// 2. New User Progress Starts at 0%
console.log('\nTEST 2: New User Initial Progress');
const newUserId = 'test-new-user-uuid-1';
const newUser = createNewUserProfile(newUserId, 'brand_new_agent@test.com', 'Agent BrandNew');

assert(newUser.completedChallengeIds.length === 0, 'New user has 0 completed challenges');
assert(newUser.stats.codesDecoded === 0, 'New user has 0 codes decoded');
assert(newUser.stats.accuracy === 0, 'New user has 0% accuracy');
assert(newUser.stats.reportsGenerated === 0, 'New user has 0 reports generated');
assert(newUser.stats.savedInvestigationsCount === 0, 'New user has 0 saved investigations');

const initialMastery = computeCurriculumMastery(newUser);
assert(initialMastery.length === 6, 'Initial mastery contains 6 records');
initialMastery.forEach((item) => {
  assert(item.percent === 0, `New user mastery for "${item.name}" is strictly 0% (actual: ${item.percent}%)`);
});

// 3. Challenge Content Availability
console.log('\nTEST 3: Challenges Availability');
assert(INITIAL_CHALLENGES.length >= 6, `Challenges are available (total: ${INITIAL_CHALLENGES.length})`);
INITIAL_CHALLENGES.forEach((ch) => {
  assert(ch.id && ch.title && ch.interceptedMessage, `Challenge "${ch.title}" is fully structured and available`);
});

// 4. Progress Is User-Scoped & User Isolation
console.log('\nTEST 4: User Progress Isolation');
const userA = createNewUserProfile('user-a-uuid', 'agent_a@test.com', 'Agent Alpha');
const userB = createNewUserProfile('user-b-uuid', 'agent_b@test.com', 'Agent Bravo');

// User A completes mission-01 (Caesar)
userA.completedChallengeIds.push('mission-01');
userA.stats.codesDecoded = 1;

const masteryUserA = computeCurriculumMastery(userA);
const masteryUserB = computeCurriculumMastery(userB);

const caesarUserA = masteryUserA.find((c) => c.name === 'Caesar & Rotational Ciphers');
const caesarUserB = masteryUserB.find((c) => c.name === 'Caesar & Rotational Ciphers');

assert(caesarUserA.percent === 50, `User A Caesar mastery updated to 50% after completing 1 of 2 challenges (actual: ${caesarUserA.percent}%)`);
assert(caesarUserB.percent === 0, `User B Caesar mastery remains strictly 0% (actual: ${caesarUserB.percent}%)`);

// User A completes mission-07 (second Caesar challenge)
userA.completedChallengeIds.push('mission-07');
const masteryUserAFull = computeCurriculumMastery(userA);
const caesarUserAFull = masteryUserAFull.find((c) => c.name === 'Caesar & Rotational Ciphers');
assert(caesarUserAFull.percent === 100, `User A Caesar mastery updated to 100% after completing both challenges`);
assert(computeCurriculumMastery(userB).find((c) => c.name === 'Caesar & Rotational Ciphers').percent === 0, `User B remains untouched at 0%`);

// 5. Existing User Progress Preservation
console.log('\nTEST 5: Existing User Progress Preserved');
const existingUser = {
  id: 'existing-veteran-01',
  email: 'veteran@prestige.com',
  completedChallengeIds: ['mission-01', 'mission-02', 'mission-04'],
  stats: {
    codesDecoded: 3,
    accuracy: 92,
    currentStreak: 2,
    bestStreak: 5,
    xp: 450,
    rank: 'DECODER',
    fastestSolveSeconds: 42,
    highestDifficultySolved: 'Intermediate',
    reportsGenerated: 2,
    savedInvestigationsCount: 1,
  },
};
const veteranMastery = computeCurriculumMastery(existingUser);
const veteranAtbash = veteranMastery.find((c) => c.name === 'Atbash Inverted Alphabet');
const veteranMorse = veteranMastery.find((c) => c.name === 'International Morse Code Encoding');
const veteranVigenere = veteranMastery.find((c) => c.name === 'Vigenère Polyalphabetic Key Schedules');

assert(veteranAtbash.percent === 100, `Existing user Atbash mastery preserved at 100%`);
assert(veteranMorse.percent === 100, `Existing user Morse mastery preserved at 100%`);
assert(veteranVigenere.percent === 0, `Existing user uncompleted Vigenère mastery remains at 0%`);

// 6. RLS & SQL Schema Validation
console.log('\nTEST 6: Database Migration & RLS Security Verification');
const migrationPath = path.resolve('supabase/migrations/20261004000000_user_progress.sql');
assert(fs.existsSync(migrationPath), `Migration file exists at ${migrationPath}`);

const sqlContent = fs.readFileSync(migrationPath, 'utf8');

assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.user_progress'), 'Table public.user_progress created with IF NOT EXISTS');
assert(sqlContent.includes('UNIQUE (user_id, curriculum_id)'), 'Unique constraint on (user_id, curriculum_id) enforced');
assert(sqlContent.includes('ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY'), 'RLS enabled on public.user_progress');
assert(sqlContent.includes('ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY'), 'RLS enabled on public.user_challenge_completions');
assert(!sqlContent.includes('USING (true)'), 'No broad USING (true) policies exist on private progress data');
assert(sqlContent.includes('auth.uid() = user_id'), 'Strict RLS user isolation via auth.uid() = user_id enforced');
assert(sqlContent.includes('ON CONFLICT (user_id, curriculum_id) DO NOTHING'), 'Idempotent initialization prevents duplicate records');
assert(sqlContent.includes('CREATE TRIGGER tr_init_user_progress'), 'Automatic trigger configured for new auth.users');

// 7. Production Auth Mode Invariant
console.log('\nTEST 7: Production Supabase Auth Mode Invariant');
assert(USE_LOCAL_DEV_AUTH === false, 'USE_LOCAL_DEV_AUTH is false (Live Supabase Auth enabled for production)');

// 8. Auth Confirmation & Reset Password Redirect Validation
console.log('\nTEST 8: Email Confirmation & URL Configuration Verification');
const authServicePath = path.resolve('src/services/supabaseAuth.ts');
const authContent = fs.readFileSync(authServicePath, 'utf8');

assert(authContent.includes('emailRedirectTo'), 'supabase.auth.signUp specifies emailRedirectTo in options');
assert(authContent.includes("https://theprestige.vercel.app"), 'Default fallback domain is https://theprestige.vercel.app');
assert(authContent.includes('window.location.origin'), 'Redirects dynamically adapt to current browser origin');
assert(authContent.includes('/reset-password'), 'Password reset redirectTo route /reset-password preserved');

const configTomlPath = path.resolve('supabase/config.toml');
const tomlContent = fs.readFileSync(configTomlPath, 'utf8');

assert(tomlContent.includes('site_url = "https://theprestige.vercel.app"'), 'Site URL in config.toml is set to production https://theprestige.vercel.app');
assert(tomlContent.includes('https://theprestige.vercel.app'), 'Production origin allowed in redirect URLs');
assert(tomlContent.includes('https://theprestige.vercel.app/'), 'Production root trailing slash allowed in redirect URLs');
assert(tomlContent.includes('https://theprestige.vercel.app/reset-password'), 'Production password reset route allowed');
assert(tomlContent.includes('http://localhost:3000'), 'Localhost origin allowed for local development');
assert(tomlContent.includes('http://localhost:3000/'), 'Localhost root trailing slash allowed for local development');
assert(tomlContent.includes('http://localhost:3000/reset-password'), 'Localhost password reset route allowed for local development');

console.log('\n==================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================\n');

if (failed > 0) {
  process.exit(1);
}
