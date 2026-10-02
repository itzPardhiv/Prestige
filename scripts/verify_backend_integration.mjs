/**
 * PRESTIGE — Cipher Intelligence System
 * Automated Verification Script for Supabase Backend & Admin Operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedChecks++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('PRESTIGE — Supabase Backend & Admin System Verification');
console.log('================================================================\n');

// 1. Database Schema & Migration Verification
console.log('1. Verifying Database Migration & PostgreSQL Schema...');
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261002000000_prestige_backend.sql');
assert(fs.existsSync(migrationPath), 'Migration file exists at supabase/migrations/20261002000000_prestige_backend.sql');

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// Table checks
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Table public.profiles is defined');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.login_events'), 'Table public.login_events is defined');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.report_events'), 'Table public.report_events is defined');
assert(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.audit_logs'), 'Table public.audit_logs is defined');

// RLS enablement
assert(migrationSql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on public.profiles');
assert(migrationSql.includes('ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on public.login_events');
assert(migrationSql.includes('ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on public.report_events');
assert(migrationSql.includes('ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on public.audit_logs');

// Security definer function to avoid RLS loop
assert(migrationSql.includes('FUNCTION public.is_admin()'), 'SECURITY DEFINER public.is_admin() function exists');
assert(migrationSql.includes("role = 'ADMIN'"), 'Role checking against ADMIN role configured');
assert(migrationSql.includes("itzpardhiv@gmail.com"), 'Authoritative admin email itzpardhiv@gmail.com enforced in database');
assert(migrationSql.includes('check_single_admin_authoritative'), 'Database table constraint check_single_admin_authoritative is defined');
assert(migrationSql.includes('idx_single_admin_role_unique'), 'Database partial unique index idx_single_admin_role_unique enforces at most one admin');
assert(migrationSql.includes("UPDATE public.profiles") && migrationSql.includes("SET role = 'USER'"), 'Safe migration demotes unauthorized admins without deleting users');

// Triggers and Functions
assert(migrationSql.includes('FUNCTION public.handle_new_user()'), 'Automatic profile trigger handle_new_user exists');
assert(migrationSql.includes('FUNCTION public.handle_report_created()'), 'Report count increment trigger handle_report_created exists');
assert(migrationSql.includes('FUNCTION public.enforce_profile_field_integrity()'), 'Profile field protection trigger enforce_profile_field_integrity exists');
assert(migrationSql.includes('FUNCTION public.record_login_success'), 'Atomic RPC record_login_success defined');
assert(migrationSql.includes('FUNCTION public.record_login_failure'), 'Atomic RPC record_login_failure defined');
assert(migrationSql.includes('FUNCTION public.admin_toggle_user_status'), 'RPC admin_toggle_user_status defined');
assert(migrationSql.includes('FUNCTION public.get_admin_dashboard_stats'), 'RPC get_admin_dashboard_stats defined');

// RLS Hardening checks
assert(migrationSql.includes("action IN ('USER_LOGOUT')"), 'Audit log insert policy restricts normal users to USER_LOGOUT only');
assert(migrationSql.includes('login_count = (SELECT p.login_count'), 'Profile update policy prevents counter manipulation');
assert(migrationSql.includes('is_active = (SELECT p.is_active'), 'Profile update policy prevents activation status tampering');

// Indexes
assert(migrationSql.includes('idx_profiles_email'), 'Index on profiles.email exists');
assert(migrationSql.includes('idx_profiles_role'), 'Index on profiles.role exists');
assert(migrationSql.includes('idx_login_events_user_id'), 'Index on login_events.user_id exists');
assert(migrationSql.includes('idx_report_events_user_id'), 'Index on report_events.user_id exists');
assert(migrationSql.includes('idx_audit_logs_actor_user_id'), 'Index on audit_logs.actor_user_id exists');

// 2. Security & Credential Hygiene
console.log('\n2. Verifying Credential Hygiene & Frontend Security...');
const envExamplePath = path.join(rootDir, '.env.example');
assert(fs.existsSync(envExamplePath), '.env.example exists');
const envExample = fs.readFileSync(envExamplePath, 'utf8');
assert(!envExample.includes('eyJh') || envExample.includes('...'), '.env.example has only placeholder tokens');
assert(!envExample.includes('SERVICE_ROLE'), 'Service role key is not exposed in client .env.example');

// Scan src/ directory for any service role key or password leaks
function scanDir(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDir(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const srcFiles = scanDir(path.join(rootDir, 'src'));
let foundSecretLeak = false;
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    foundSecretLeak = true;
    console.error(`Leaked secret identifier in ${file}`);
  }
}
assert(!foundSecretLeak, 'No service role keys or server secrets referenced in src/ tree');

// 3. Local-First Report Integrity & Privacy
console.log('\n3. Verifying Local-First Privacy Protection...');
const reportServicePath = path.join(rootDir, 'src', 'services', 'supabaseReports.ts');
assert(fs.existsSync(reportServicePath), 'supabaseReports.ts service exists');
const reportServiceContent = fs.readFileSync(reportServicePath, 'utf8');
assert(!reportServiceContent.includes('plaintext:'), 'supabaseReports.ts does not send plaintext');
assert(!reportServiceContent.includes('ciphertext:'), 'supabaseReports.ts does not send full ciphertext');
assert(!reportServiceContent.includes('decodedResult:'), 'supabaseReports.ts does not send decoded result');
assert(reportServiceContent.includes('cipher_type'), 'supabaseReports.ts records cipher_type metadata');
assert(reportServiceContent.includes('character_count'), 'supabaseReports.ts records character_count metadata');
assert(reportServiceContent.includes('verified'), 'supabaseReports.ts records verification flag');

// 4. Admin Setup Script Verification
console.log('\n4. Verifying Secure Admin Setup Script...');
const adminScriptPath = path.join(rootDir, 'scripts', 'create_admin.ts');
assert(fs.existsSync(adminScriptPath), 'Admin creation script exists at scripts/create_admin.ts');
const adminScript = fs.readFileSync(adminScriptPath, 'utf8');
assert(adminScript.includes('itzpardhiv@gmail.com'), 'Admin script locks authorized admin email to itzpardhiv@gmail.com');
assert(adminScript.includes('Pardhiv'), 'Admin script attributes authorized administrator name to Pardhiv');
assert(adminScript.includes('process.env.ADMIN_PASSWORD'), 'Admin script reads password securely from env var');
assert(!adminScript.includes('admin@example.com'), 'Admin script contains no unauthorized email');
assert(!adminScript.includes('"password123"'), 'Admin script contains no hardcoded password');

// 5. Admin Dashboard & Route Protection
console.log('\n5. Verifying Admin Dashboard & Route Protection...');
const adminPagePath = path.join(rootDir, 'src', 'pages', 'AdminDashboardPage.tsx');
assert(fs.existsSync(adminPagePath), 'AdminDashboardPage.tsx exists');
const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
assert(adminPageContent.includes("user?.role === 'ADMIN'"), 'Admin dashboard enforces role === ADMIN check');
assert(adminPageContent.includes('Security Clearance Denied'), 'Non-admin receives Security Clearance Denied screen');
assert(adminPageContent.includes('toggleUserStatus'), 'Admin dashboard includes activate/deactivate capability');
assert(adminPageContent.includes('User Directory'), 'User directory section present');
assert(adminPageContent.includes('Login Activity'), 'Login activity section present');
assert(adminPageContent.includes('Report Activity'), 'Report activity section present');
assert(adminPageContent.includes('Audit Log'), 'Audit log section present');

console.log('\n================================================================');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${Math.round((passedChecks / totalChecks) * 100)}%)`);
console.log('================================================================\n');

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
