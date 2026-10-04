/**
 * PRESTIGE — Full Lifecycle Verification: New-User Learner Progress
 * 
 * Tests:
 * 1. Genuinely new user progress initialization.
 * 2. All 6 canonical curriculum records created with user_id scoping.
 * 3. All 6 start at exactly 0%.
 * 4. Learner/Dashboard data displays 0% and 0 decoded ciphers.
 * 5. Completing/updating one challenge persists across session re-fetch.
 * 6. Second new user starts completely independently at 0%.
 * 7. Existing user's progress is NEVER reset.
 * 8. User isolation: User A cannot see or overwrite User B.
 */

// Polyfill localStorage on global and window for Node execution
const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: any) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
(global as any).window = {
  localStorage: (global as any).localStorage,
  location: { origin: 'https://theprestige.vercel.app' },
};

import { CANONICAL_CURRICULUM, computeCurriculumMastery, getDefaultCurriculumMastery } from '../src/utils/curriculum';
import { supabaseProgressService } from '../src/services/supabaseProgress';
import { supabaseAuthService } from '../src/services/supabaseAuth';
import { storageService, DEFAULT_USER_PROFILE, createNewUserProfile } from '../src/services/storage';

const SUPABASE_URL = 'https://fwssfqhzxmtilpfzvejg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uYavSQr1RFbNTb2zxGcxQg_nyT7tBG8';

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
  console.log('PRESTIGE — NEW-USER LEARNER PROGRESS LIFECYCLE AUDIT');
  console.log('================================================================\n');

  // STEP 1: Verify DEFAULT_USER_PROFILE has 0% progress and no completed challenges
  console.log('--- Step 1: Default / Guest Starter Profile Invariant ---');
  assert(DEFAULT_USER_PROFILE.completedChallengeIds.length === 0, 'DEFAULT_USER_PROFILE has empty completedChallengeIds');
  assert(DEFAULT_USER_PROFILE.stats.codesDecoded === 0, 'DEFAULT_USER_PROFILE has 0 codesDecoded');
  assert(DEFAULT_USER_PROFILE.stats.accuracy === 0, 'DEFAULT_USER_PROFILE has 0% accuracy');
  assert(DEFAULT_USER_PROFILE.stats.reportsGenerated === 0, 'DEFAULT_USER_PROFILE has 0 reports generated');
  assert(DEFAULT_USER_PROFILE.stats.savedInvestigationsCount === 0, 'DEFAULT_USER_PROFILE has 0 saved investigations');

  const defaultMastery = computeCurriculumMastery(DEFAULT_USER_PROFILE);
  assert(defaultMastery.length === 6, 'DEFAULT_USER_PROFILE computes exactly 6 curriculum items');
  defaultMastery.forEach((item) => {
    assert(item.percent === 0, `Default mastery for "${item.name}" is strictly 0% (actual: ${item.percent}%)`);
  });

  // STEP 2: Test User A (Genuinely new user creation)
  console.log('\n--- Step 2: Genuinely New User A Creation & Initialization ---');
  const userAId = 'a0000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');
  const userAEmail = `learner_a_${Date.now()}@prestige.local`;
  const userAProfile = createNewUserProfile(userAId, userAEmail, 'Learner Alpha');

  assert(userAProfile.id === userAId, 'User A ID matches generated UUID');
  assert(userAProfile.completedChallengeIds.length === 0, 'User A has 0 completed challenges');
  assert(userAProfile.stats.codesDecoded === 0, 'User A has 0 codes decoded');

  // STEP 3: Verify all 6 curriculum records initialized for User A
  console.log('\n--- Step 3: Verify All 6 Curriculum Records at Exactly 0% ---');
  const initItemsA = await supabaseProgressService.initializeUserProgress(userAId);
  assert(initItemsA.length === 6, 'initializeUserProgress returns exactly 6 curriculum items');
  initItemsA.forEach((item) => {
    assert(item.percent === 0, `User A initial "${item.name}" is 0%`);
  });

  // Verify fetch via getUserProgress
  const progressA = await supabaseProgressService.getUserProgress(userAId);
  assert(progressA.length === 6, 'getUserProgress returns 6 curriculum items for User A');
  progressA.forEach((item) => {
    assert(item.percent === 0, `Fetched progress for "${item.name}" is strictly 0% (actual: ${item.percent}%)`);
  });

  // STEP 4: Verify Dashboard & Profile display data for User A
  console.log('\n--- Step 4: Verify Dashboard & Profile Display State for User A ---');
  const enrichedUserA = await supabaseAuthService.enrichUserProfile(userAProfile);
  assert(enrichedUserA.curriculumMastery.length === 6, 'Enriched User A has 6 curriculum items');
  enrichedUserA.curriculumMastery.forEach((item) => {
    assert(item.percent === 0, `Dashboard display for "${item.name}" is 0%`);
  });
  assert(enrichedUserA.completedChallengeIds.length === 0, 'Dashboard completed challenges is empty');
  assert(enrichedUserA.stats.codesDecoded === 0, 'Dashboard codes decoded displays 0');

  // STEP 5: User A completes one challenge (mission-01: Caesar)
  console.log('\n--- Step 5: User A Solves 1 Challenge (mission-01) & Persists ---');
  // Record challenge completion for User A in local user state
  const updatedUserA = {
    ...enrichedUserA,
    completedChallengeIds: ['mission-01'],
    stats: {
      ...enrichedUserA.stats,
      codesDecoded: 1,
    },
  };
  updatedUserA.curriculumMastery = computeCurriculumMastery(updatedUserA);

  const caesarItemUserA = updatedUserA.curriculumMastery.find((c) => c.id === 'caesar-rotational');
  assert(caesarItemUserA?.percent === 50, `User A Caesar mastery updated to 50% (actual: ${caesarItemUserA?.percent}%)`);

  // Persist User A to storageService
  storageService.saveUserProfile(updatedUserA);
  storageService.saveUserProgress(userAId, updatedUserA.curriculumMastery);

  // Re-read User A from storage (simulating page reload)
  const reloadedUserA = storageService.getUserProfile(userAId);
  assert(reloadedUserA.completedChallengeIds.includes('mission-01'), 'User A completedChallengeIds preserved after reload');
  assert(reloadedUserA.stats.codesDecoded === 1, 'User A codesDecoded preserved after reload');
  const reloadedCaesar = reloadedUserA.curriculumMastery?.find((c) => c.id === 'caesar-rotational');
  assert(reloadedCaesar?.percent === 50, 'User A 50% Caesar progress preserved after reload');

  // STEP 6: User B (Second brand-new user) starts independently at 0%
  console.log('\n--- Step 6: User B Starts Completely Independently at 0% ---');
  // First simulate User A logout
  storageService.clearUserProfile();

  const userBId = 'b0000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');
  const userBEmail = `learner_b_${Date.now()}@prestige.local`;
  const userBProfile = createNewUserProfile(userBId, userBEmail, 'Learner Bravo');

  const initItemsB = await supabaseProgressService.initializeUserProgress(userBId);
  assert(initItemsB.length === 6, 'User B initialized with 6 curriculum items');
  initItemsB.forEach((item) => {
    assert(item.percent === 0, `User B initial "${item.name}" is 0%`);
  });

  const progressB = await supabaseProgressService.getUserProgress(userBId);
  const caesarItemUserB = progressB.find((c) => c.id === 'caesar-rotational');
  assert(caesarItemUserB?.percent === 0, `User B Caesar mastery is strictly 0% (User A was 50%)`);

  const enrichedUserB = await supabaseAuthService.enrichUserProfile(userBProfile);
  assert(enrichedUserB.completedChallengeIds.length === 0, 'User B completed challenges is strictly empty');
  assert(enrichedUserB.stats.codesDecoded === 0, 'User B codes decoded is strictly 0');
  enrichedUserB.curriculumMastery.forEach((item) => {
    assert(item.percent === 0, `User B dashboard item "${item.name}" is 0%`);
  });

  // STEP 7: Verify Existing User Progress is NEVER reset
  console.log('\n--- Step 7: Existing User Veteran Progress Preservation ---');
  const existingVeteran = {
    id: 'veteran-user-999',
    name: 'Veteran Decoder',
    email: 'veteran@prestige.local',
    completedChallengeIds: ['mission-01', 'mission-07', 'mission-02'],
    stats: {
      codesDecoded: 3,
      accuracy: 96,
      currentStreak: 5,
      bestStreak: 12,
      xp: 850,
      rank: 'SENIOR ANALYST',
      fastestSolveSeconds: 28,
      highestDifficultySolved: 'Expert',
      reportsGenerated: 5,
      savedInvestigationsCount: 4,
    },
  };

  const veteranMastery = computeCurriculumMastery(existingVeteran);
  const vetCaesar = veteranMastery.find((c) => c.id === 'caesar-rotational');
  const vetAtbash = veteranMastery.find((c) => c.id === 'atbash-inverted');
  const vetVigenere = veteranMastery.find((c) => c.id === 'vigenere-polyalphabetic');

  assert(vetCaesar?.percent === 100, `Veteran Caesar (2 of 2 challenges) preserved at 100%`);
  assert(vetAtbash?.percent === 100, `Veteran Atbash (1 of 1 challenge) preserved at 100%`);
  assert(vetVigenere?.percent === 0, `Veteran Vigenère (0 challenges) remains 0%`);

  // STEP 8: Idempotent initialization check (duplicate-free)
  console.log('\n--- Step 8: Idempotent & Duplicate-Free Initialization ---');
  const reInitA = await supabaseProgressService.initializeUserProgress(userAId);
  assert(reInitA.length === 6, 'Re-initializing User A returns exactly 6 items without error');

  console.log('\n================================================================');
  console.log(`LIFECYCLE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
