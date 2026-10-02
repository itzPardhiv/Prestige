/**
 * PRESTIGE — Cipher Intelligence System
 * Secure Administrator Initialization Script
 * 
 * Usage:
 *   SUPABASE_URL="https://your-project.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
 *   ADMIN_EMAIL="itzpardhiv@gmail.com" \
 *   ADMIN_PASSWORD="your-strong-password" \
 *   npx tsx scripts/create_admin.ts
 *
 * CRITICAL ARCHITECTURAL CONSTRAINT:
 * SERVER / LOCAL CLI ADMINISTRATION ONLY.
 * This script uses SUPABASE_SERVICE_ROLE_KEY and must NEVER be imported or bundled into the frontend.
 *
 * Security:
 * - Credentials are read strictly from process environment variables.
 * - Passwords are never logged or stored in application tables.
 * - The admin account is authenticated through standard Supabase Auth.
 */

import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Single-Admin Security Policy: Only itzpardhiv@gmail.com is authorized to receive ADMIN clearance
  const AUTHORIZED_ADMIN_EMAIL = 'itzpardhiv@gmail.com';
  const AUTHORIZED_ADMIN_NAME = 'Pardhiv';

  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (envEmail && envEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    console.error(`ERROR: Security Violation: Single-admin policy permits ONLY '${AUTHORIZED_ADMIN_EMAIL}' to receive administrator privileges.`);
    console.error(`Supplied email '${envEmail}' is rejected.`);
    process.exit(1);
  }

  const adminEmail = AUTHORIZED_ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || AUTHORIZED_ADMIN_NAME;

  if (!url || !serviceKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided via environment variables.');
    process.exit(1);
  }

  if (!adminPassword) {
    console.error('ERROR: ADMIN_PASSWORD must be provided via environment variable.');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters long for security.');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${url}`);
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log(`Setting up authoritative administrator account for: ${adminEmail} (${adminName})`);

  // 1. Check if user already exists in Auth
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to query users:', listError.message);
    process.exit(1);
  }

  let adminUser = usersData.users.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

  if (!adminUser) {
    console.log('User does not exist in Auth. Creating account...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: adminName, display_name: adminName }
    });

    if (createError || !newUser.user) {
      console.error('Failed to create admin user:', createError?.message);
      process.exit(1);
    }
    adminUser = newUser.user;
    console.log('Auth user created successfully.');
  } else {
    console.log('Existing auth user found. Updating password...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: adminPassword,
      email_confirm: true
    });
    if (updateError) {
      console.error('Failed to update password:', updateError.message);
      process.exit(1);
    }
  }

  // 2. Ensure profile exists and grant ADMIN role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminUser.id,
      email: adminEmail,
      display_name: adminName,
      role: 'ADMIN',
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Failed to update profile role:', profileError.message);
    process.exit(1);
  }

  // 3. Log audit event
  await supabase
    .from('audit_logs')
    .insert({
      actor_user_id: adminUser.id,
      action: 'ADMIN_SETUP',
      target_user_id: adminUser.id,
      metadata: { email: adminEmail, method: 'cli_setup_script' }
    });

  console.log('✓ Administrator privileges successfully assigned.');
  console.log(`✓ Admin user [${adminEmail}] is active and ready to log in.`);
}

main().catch(err => {
  console.error('Script error:', err.message);
  process.exit(1);
});
