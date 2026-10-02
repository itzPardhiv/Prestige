-- =============================================================================
-- PRESTIGE — Cipher Intelligence System
-- Production Supabase Database Migration
-- Version: 1.0.0
-- =============================================================================

-- 1. PROFILES TABLE
-- Extends Supabase auth.users with operational & cryptanalysis metrics
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT check_single_admin_authoritative CHECK (
    role = 'USER' OR (role = 'ADMIN' AND LOWER(email) = 'itzpardhiv@gmail.com')
  )
);

-- 2. LOGIN EVENTS TABLE
-- Tracks successful and failed authentication attempts with client metadata
CREATE TABLE IF NOT EXISTS public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- 3. REPORT EVENTS TABLE
-- Tracks cryptanalysis report-generation activity (metadata only; NO plaintext/ciphertext)
CREATE TABLE IF NOT EXISTS public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id TEXT NOT NULL,
  cipher_type TEXT NOT NULL,
  character_count INTEGER,
  verified BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUDIT LOGS TABLE
-- Immutable administrative record of security & account actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- Optimized for admin activity tracking, user directory search, and reporting
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at DESC);

-- Enforce exactly at most ONE account can ever have role = 'ADMIN'
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin_role_unique
  ON public.profiles(role)
  WHERE role = 'ADMIN';

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_success ON public.login_events(success);

CREATE INDEX IF NOT EXISTS idx_report_events_user_id ON public.report_events(user_id);
CREATE INDEX IF NOT EXISTS idx_report_events_created_at ON public.report_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_events_cipher_type ON public.report_events(cipher_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Ensure table constraint is applied if table pre-existed
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_single_admin_authoritative;
ALTER TABLE public.profiles
  ADD CONSTRAINT check_single_admin_authoritative
  CHECK (role = 'USER' OR (role = 'ADMIN' AND LOWER(email) = 'itzpardhiv@gmail.com'));

-- =============================================================================
-- HELPER FUNCTIONS & RLS SECURITY DEFINER
-- =============================================================================

-- Secure helper to verify ADMIN role without recursive RLS loop
-- Single Authoritative Administrator: ONLY itzpardhiv@gmail.com is permitted
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
      AND LOWER(email) = 'itzpardhiv@gmail.com'
      AND is_active = TRUE
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
-- Users can view their own profile; Admins can view all profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own profile; Admins can insert any profile
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can update only allowed self-service fields of their own profile; Admins can update any profile.
-- Normal users cannot elevate their role, alter their activation status, or manipulate login/report counters.
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id 
     AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
     AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
     AND login_count = (SELECT p.login_count FROM public.profiles p WHERE p.id = auth.uid())
     AND report_count = (SELECT p.report_count FROM public.profiles p WHERE p.id = auth.uid())
    )
    OR public.is_admin()
  );

-- 2. Login Events Policies
-- Anyone can insert login events (to record login attempts including anonymous failed ones)
CREATE POLICY "login_events_insert_policy"
  ON public.login_events FOR INSERT
  WITH CHECK (TRUE);

-- Users can only read their own login events; Admins can view all login events
CREATE POLICY "login_events_select_policy"
  ON public.login_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 3. Report Events Policies
-- Authenticated users can insert their own report events
CREATE POLICY "report_events_insert_policy"
  ON public.report_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own report events; Admins can view all report events
CREATE POLICY "report_events_select_policy"
  ON public.report_events FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 4. Audit Logs Policies
-- Admins can insert any audit log. Authenticated users can ONLY insert USER_LOGOUT.
-- System triggers and SECURITY DEFINER RPCs bypass RLS to log system events.
-- Normal users cannot manufacture fake ADMIN_LOGIN, USER_DEACTIVATED, or privileged audit events.
CREATE POLICY "audit_logs_insert_policy"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = actor_user_id 
      AND action IN ('USER_LOGOUT')
    )
  );

-- ONLY Admins can view audit logs; Normal users have zero read access
CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- =============================================================================
-- DATABASE TRIGGERS
-- =============================================================================

-- Trigger: Automatically update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_updated_at();

-- Trigger: Enforce immutable and database-managed profile columns against normal user tampering
CREATE OR REPLACE FUNCTION public.enforce_profile_field_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If not an admin, forbid modifying protected columns
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.is_active := OLD.is_active;
    NEW.login_count := OLD.login_count;
    NEW.report_count := OLD.report_count;
    NEW.first_login_at := OLD.first_login_at;
    NEW.last_login_at := OLD.last_login_at;
    NEW.created_at := OLD.created_at;
  END IF;

  -- Absolute lock: even if caller is an admin, no account other than itzpardhiv@gmail.com can ever receive role = 'ADMIN'
  IF NEW.role = 'ADMIN' AND LOWER(NEW.email) != 'itzpardhiv@gmail.com' THEN
    RAISE EXCEPTION 'Security Policy Violation: Only itzpardhiv@gmail.com is authorized for administrative clearance.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_profile_field_integrity ON public.profiles;
CREATE TRIGGER tr_enforce_profile_field_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_field_integrity();

-- Trigger: Automatically sync new auth.users signup to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

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
    'USER',
    TRUE,
    NOW(),
    NOW(),
    0,
    0
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  -- Log USER_REGISTERED event in audit_logs
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    target_user_id,
    metadata,
    created_at
  ) VALUES (
    NEW.id,
    'USER_REGISTERED',
    NEW.id,
    jsonb_build_object('email', NEW.email, 'name', v_display_name),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Automatically increment profiles.report_count on report_events insert
CREATE OR REPLACE FUNCTION public.handle_report_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET report_count = report_count + 1
  WHERE id = NEW.user_id;

  -- Log REPORT_GENERATED in audit_logs
  INSERT INTO public.audit_logs (
    actor_user_id,
    action,
    target_user_id,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    'REPORT_GENERATED',
    NEW.user_id,
    jsonb_build_object(
      'report_id', NEW.report_id,
      'cipher_type', NEW.cipher_type,
      'character_count', NEW.character_count,
      'verified', NEW.verified
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_report_events_created ON public.report_events;
CREATE TRIGGER tr_report_events_created
  AFTER INSERT ON public.report_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_report_created();

-- =============================================================================
-- STORED PROCEDURES / RPCs
-- =============================================================================

-- RPC: Record login success, update profile counters, and log audit event atomically
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
BEGIN
  -- Verify user exists and check active status
  SELECT role, is_active, first_login_at
  INTO v_role, v_is_active, v_first_login
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Fallback: auto-create profile if missing
    INSERT INTO public.profiles (id, email, role, is_active, created_at, updated_at, login_count, report_count)
    VALUES (p_user_id, p_email, 'USER', TRUE, v_now, v_now, 0, 0)
    RETURNING role, is_active, first_login_at INTO v_role, v_is_active, v_first_login;
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

-- RPC: Record failed login attempt
CREATE OR REPLACE FUNCTION public.record_login_failure(
  p_email TEXT,
  p_failure_reason TEXT DEFAULT 'Invalid credentials',
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := NULL;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Look up user ID if email matches an existing user
  SELECT id INTO v_user_id FROM public.profiles WHERE LOWER(email) = LOWER(p_email) LIMIT 1;

  INSERT INTO public.login_events (user_id, email, success, failure_reason, user_agent, ip_address, created_at)
  VALUES (v_user_id, p_email, FALSE, p_failure_reason, p_user_agent, p_ip_address, v_now);

  INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
  VALUES (
    v_user_id,
    'LOGIN_FAILED',
    v_user_id,
    jsonb_build_object('email', p_email, 'reason', p_failure_reason),
    v_now
  );
END;
$$;

-- RPC: Toggle user account activation status (Admin only)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
  p_target_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_target_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: caller does not possess administrative clearance.';
  END IF;

  SELECT email INTO v_target_email FROM public.profiles WHERE id = p_target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;

  -- Protect authoritative admin account from accidental deactivation
  IF LOWER(v_target_email) = 'itzpardhiv@gmail.com' AND NOT p_is_active THEN
    RAISE EXCEPTION 'Safety Violation: The authoritative administrator account (itzpardhiv@gmail.com) cannot be deactivated.';
  END IF;

  UPDATE public.profiles
  SET is_active = p_is_active, updated_at = NOW()
  WHERE id = p_target_user_id;

  v_action := CASE WHEN p_is_active THEN 'USER_REACTIVATED' ELSE 'USER_DEACTIVATED' END;

  INSERT INTO public.audit_logs (actor_user_id, action, target_user_id, metadata, created_at)
  VALUES (
    auth.uid(),
    v_action,
    p_target_user_id,
    jsonb_build_object('target_email', v_target_email, 'new_status', CASE WHEN p_is_active THEN 'ACTIVE' ELSE 'INACTIVE' END),
    NOW()
  );

  RETURN jsonb_build_object('success', true, 'is_active', p_is_active);
END;
$$;

-- RPC: Get authoritative administrative dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_registered_users INTEGER := 0;
  v_active_users INTEGER := 0;
  v_total_logins INTEGER := 0;
  v_successful_logins INTEGER := 0;
  v_failed_logins INTEGER := 0;
  v_total_reports INTEGER := 0;
  v_reports_today INTEGER := 0;
  v_reports_this_week INTEGER := 0;
  v_reports_this_month INTEGER := 0;
  v_new_users_today INTEGER := 0;
  v_last_activity_at TIMESTAMPTZ := NULL;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: caller does not possess administrative clearance.';
  END IF;

  -- 1. User stats
  SELECT COUNT(*) INTO v_registered_users FROM public.profiles;

  -- Active users: authenticated users with a successful login in the last 30 days
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
  FROM public.login_events
  WHERE success = TRUE
    AND created_at >= (NOW() - INTERVAL '30 days');

  SELECT COUNT(*) INTO v_new_users_today
  FROM public.profiles
  WHERE created_at >= date_trunc('day', NOW());

  -- 2. Login stats
  SELECT COUNT(*) INTO v_total_logins FROM public.login_events;
  SELECT COUNT(*) INTO v_successful_logins FROM public.login_events WHERE success = TRUE;
  SELECT COUNT(*) INTO v_failed_logins FROM public.login_events WHERE success = FALSE;

  -- 3. Report stats
  SELECT COUNT(*) INTO v_total_reports FROM public.report_events;
  SELECT COUNT(*) INTO v_reports_today FROM public.report_events WHERE created_at >= date_trunc('day', NOW());
  SELECT COUNT(*) INTO v_reports_this_week FROM public.report_events WHERE created_at >= date_trunc('week', NOW());
  SELECT COUNT(*) INTO v_reports_this_month FROM public.report_events WHERE created_at >= date_trunc('month', NOW());

  -- 4. Last activity
  SELECT created_at INTO v_last_activity_at
  FROM public.audit_logs
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'registered_users', v_registered_users,
    'active_users', v_active_users,
    'total_logins', v_total_logins,
    'successful_logins', v_successful_logins,
    'failed_logins', v_failed_logins,
    'total_reports', v_total_reports,
    'reports_today', v_reports_today,
    'reports_this_week', v_reports_this_week,
    'reports_this_month', v_reports_this_month,
    'new_users_today', v_new_users_today,
    'last_activity_at', v_last_activity_at
  );
END;
$$;

-- =============================================================================
-- SAFE DATA MIGRATION & SINGLE ADMIN ENFORCEMENT
-- =============================================================================
-- Revoke administrative privileges from any unauthorized accounts safely.
-- Demotes non-authoritative accounts to 'USER' without deleting user accounts or profiles.
-- Preserves all legitimate user data, folders, investigations, and reports.
UPDATE public.profiles
SET role = 'USER', updated_at = NOW()
WHERE role = 'ADMIN' AND LOWER(email) != 'itzpardhiv@gmail.com';

