-- =============================================================================
-- PRESTIGE — Authoritative Administrator Account Restoration
-- Migration: 20261004000001_restore_admin.sql
-- =============================================================================

-- 1. DIRECT RESTORATION
-- If auth.users already contains an account for itzpardhiv@gmail.com,
-- guarantee that its public.profiles row exists with role = 'ADMIN', display_name = 'Pardhiv', and is_active = TRUE.
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE LOWER(email) = 'itzpardhiv@gmail.com'
  LIMIT 1;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      role,
      is_active,
      created_at,
      updated_at,
      login_count,
      report_count
    ) VALUES (
      v_admin_id,
      'itzpardhiv@gmail.com',
      'Pardhiv',
      'ADMIN',
      TRUE,
      NOW(),
      NOW(),
      1,
      0
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'ADMIN',
      email = 'itzpardhiv@gmail.com',
      display_name = COALESCE(public.profiles.display_name, 'Pardhiv'),
      is_active = TRUE,
      updated_at = NOW();

    INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
    VALUES (
      v_admin_id,
      'ADMIN_PROFILE_RESTORED',
      v_admin_id,
      jsonb_build_object('email', 'itzpardhiv@gmail.com', 'reason', 'Direct migration restoration of authoritative admin profile'),
      NOW()
    );
  END IF;
END;
$$;

-- 2. UPDATE TRIGGER FUNCTION: handle_new_user()
-- Automatically grants role = 'ADMIN' to itzpardhiv@gmail.com when created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_role TEXT := 'USER';
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- Authoritative single-admin policy: assign ADMIN role to itzpardhiv@gmail.com
  IF LOWER(NEW.email) = 'itzpardhiv@gmail.com' THEN
    v_role := 'ADMIN';
    v_display_name := COALESCE(v_display_name, 'Pardhiv');
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at,
    login_count,
    report_count
  ) VALUES (
    NEW.id,
    NEW.email,
    v_display_name,
    v_role,
    TRUE,
    NOW(),
    NOW(),
    0,
    0
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN LOWER(EXCLUDED.email) = 'itzpardhiv@gmail.com' THEN 'ADMIN' ELSE public.profiles.role END,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  -- Log registration in audit_logs
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    target_user_id,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    CASE WHEN v_role = 'ADMIN' THEN 'ADMIN_REGISTERED' ELSE 'USER_REGISTERED' END,
    NEW.id,
    jsonb_build_object('email', NEW.email, 'name', v_display_name, 'role', v_role),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- 3. UPDATE RPC: record_login_success()
-- Self-heals the admin role for itzpardhiv@gmail.com upon successful login
CREATE OR REPLACE FUNCTION public.record_login_success(
  p_user_id UUID,
  p_email TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_is_active BOOLEAN;
  v_first_login TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_expected_role TEXT := 'USER';
BEGIN
  IF LOWER(p_email) = 'itzpardhiv@gmail.com' THEN
    v_expected_role := 'ADMIN';
  END IF;

  -- Verify user exists and check active status
  SELECT role, is_active, first_login_at
  INTO v_role, v_is_active, v_first_login
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Auto-create profile if missing, assigning ADMIN role to authoritative admin email
    INSERT INTO public.profiles (id, email, display_name, role, is_active, created_at, updated_at, login_count, report_count)
    VALUES (
      p_user_id,
      p_email,
      CASE WHEN LOWER(p_email) = 'itzpardhiv@gmail.com' THEN 'Pardhiv' ELSE split_part(p_email, '@', 1) END,
      v_expected_role,
      TRUE,
      v_now,
      v_now,
      0,
      0
    )
    RETURNING role, is_active, first_login_at INTO v_role, v_is_active, v_first_login;
  ELSIF LOWER(p_email) = 'itzpardhiv@gmail.com' AND v_role != 'ADMIN' THEN
    -- Self-heal authoritative admin profile role if it was mistakenly set to USER
    UPDATE public.profiles
    SET role = 'ADMIN', updated_at = v_now
    WHERE id = p_user_id;
    v_role := 'ADMIN';
  END IF;

  IF v_is_active = FALSE THEN
    -- Record login attempt as inactive failure
    INSERT INTO public.login_events (user_id, email, success, failure_reason, user_agent, ip_address, created_at)
    VALUES (p_user_id, p_email, FALSE, 'Account deactivated by administrator', p_user_agent, p_ip_address, v_now);

    INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
    VALUES (p_user_id, 'LOGIN_FAILED', p_user_id, jsonb_build_object('reason', 'Account deactivated'), v_now);

    RETURN jsonb_build_object('success', false, 'error', 'Account is currently deactivated. Please contact an administrator.');
  END IF;

  -- Update profiles login statistics
  UPDATE public.profiles
  SET
    last_login_at = v_now,
    login_count = login_count + 1,
    first_login_at = COALESCE(first_login_at, v_now),
    updated_at = v_now
  WHERE id = p_user_id;

  -- Record login event
  INSERT INTO public.login_events (user_id, email, success, user_agent, ip_address, created_at)
  VALUES (p_user_id, p_email, TRUE, p_user_agent, p_ip_address, v_now);

  -- Log USER_LOGIN or ADMIN_LOGIN in audit_logs
  INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
  VALUES (
    p_user_id,
    CASE WHEN v_role = 'ADMIN' THEN 'ADMIN_LOGIN' ELSE 'USER_LOGIN' END,
    p_user_id,
    jsonb_build_object('email', p_email, 'role', v_role),
    v_now
  );

  RETURN jsonb_build_object('success', true, 'role', v_role);
END;
$$;

-- 4. RPC: restore_admin_profile(p_user_id UUID)
-- Self-healing RPC for authenticated client sessions to restore missing admin profile
CREATE OR REPLACE FUNCTION public.restore_admin_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_existing_profile public.profiles%ROWTYPE;
BEGIN
  -- Check email from auth.users or profiles
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    SELECT email INTO v_user_email
    FROM public.profiles
    WHERE id = p_user_id;
  END IF;

  IF v_user_email IS NULL OR LOWER(v_user_email) != 'itzpardhiv@gmail.com' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Clearance denied: caller is not authoritative administrator');
  END IF;

  -- Upsert authoritative admin profile
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at,
    login_count,
    report_count
  ) VALUES (
    p_user_id,
    'itzpardhiv@gmail.com',
    'Pardhiv',
    'ADMIN',
    TRUE,
    NOW(),
    NOW(),
    1,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = 'itzpardhiv@gmail.com',
    display_name = COALESCE(public.profiles.display_name, 'Pardhiv'),
    is_active = TRUE,
    updated_at = NOW()
  RETURNING * INTO v_existing_profile;

  -- Record audit log for restoration
  INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
  VALUES (
    p_user_id,
    'ADMIN_RESTORED',
    p_user_id,
    jsonb_build_object('email', 'itzpardhiv@gmail.com', 'role', 'ADMIN'),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', v_existing_profile.id,
    'email', v_existing_profile.email,
    'role', v_existing_profile.role,
    'display_name', v_existing_profile.display_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_admin_profile(UUID) TO anon, authenticated, service_role;

-- 5. RPC: check_admin_account_status()
-- Verification helper to inspect admin auth and profile status
CREATE OR REPLACE FUNCTION public.check_admin_account_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_profile_exists BOOLEAN := FALSE;
  v_profile_role TEXT := NULL;
  v_profile_active BOOLEAN := NULL;
BEGIN
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE LOWER(email) = 'itzpardhiv@gmail.com'
  LIMIT 1;

  IF v_auth_user_id IS NOT NULL THEN
    SELECT role, is_active INTO v_profile_role, v_profile_active
    FROM public.profiles
    WHERE id = v_auth_user_id;

    v_profile_exists := (v_profile_role IS NOT NULL);
  END IF;

  RETURN jsonb_build_object(
    'auth_user_exists', (v_auth_user_id IS NOT NULL),
    'auth_user_id', v_auth_user_id,
    'profile_exists', v_profile_exists,
    'profile_role', v_profile_role,
    'is_active', v_profile_active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_account_status() TO anon, authenticated, service_role;
