-- =============================================================================
-- PRESTIGE — Authoritative Admin Direct Account Provisioning
-- Migration: 20261004000002_provision_admin_credentials.sql
-- =============================================================================
-- Bypasses SMTP email rate limits by directly inserting/updating auth.users
-- with pre-confirmed email status (email_confirmed_at = NOW())
-- and bcrypt hashed password for 'BabulakeBabu@001'.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Generate bcrypt hash for 'BabulakeBabu@001'
  v_encrypted_pw := extensions.crypt('BabulakeBabu@001', extensions.gen_salt('bf', 10));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = 'itzpardhiv@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Insert directly into auth.users with pre-confirmed email status
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'itzpardhiv@gmail.com',
      v_encrypted_pw,
      v_now,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "ItzPardhiv", "display_name": "ItzPardhiv"}'::jsonb,
      v_now,
      v_now,
      '',
      '',
      FALSE
    );

  ELSE
    -- If auth user exists, update password to 'BabulakeBabu@001' and confirm email
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, v_now),
      raw_user_meta_data = jsonb_build_object('name', 'ItzPardhiv', 'display_name', 'ItzPardhiv'),
      raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
      updated_at = v_now
    WHERE id = v_user_id;
  END IF;

  -- Ensure auth.identities has matching record if table exists
  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'itzpardhiv@gmail.com'),
      'email',
      'itzpardhiv@gmail.com',
      v_now,
      v_now,
      v_now
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
      last_sign_in_at = v_now,
      updated_at = v_now;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback for different primary key definition on auth.identities
    BEGIN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', 'itzpardhiv@gmail.com'),
        'email',
        v_now,
        v_now,
        v_now
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;

  -- Ensure public.profiles has the authoritative ADMIN role and display name
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
    v_user_id,
    'itzpardhiv@gmail.com',
    'ItzPardhiv',
    'ADMIN',
    TRUE,
    v_now,
    v_now,
    1,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = 'itzpardhiv@gmail.com',
    display_name = 'ItzPardhiv',
    is_active = TRUE,
    updated_at = v_now;

  -- Log audit record
  INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
  VALUES (
    v_user_id,
    'ADMIN_PROVISIONED',
    v_user_id,
    jsonb_build_object('email', 'itzpardhiv@gmail.com', 'role', 'ADMIN', 'username', 'ItzPardhiv'),
    v_now
  );

END;
$$;
