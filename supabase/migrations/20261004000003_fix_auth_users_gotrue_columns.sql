-- =============================================================================
-- PRESTIGE — Fix GoTrue NULL String Columns in auth.users
-- Migration: 20261004000003_fix_auth_users_gotrue_columns.sql
-- =============================================================================
-- Supabase GoTrue throws "Database error querying schema" (sql: converting NULL to string is unsupported)
-- if string token columns in auth.users are NULL instead of empty strings ('').

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  is_sso_user = COALESCE(is_sso_user, FALSE),
  is_anonymous = COALESCE(is_anonymous, FALSE)
WHERE LOWER(email) = 'itzpardhiv@gmail.com';

CREATE OR REPLACE FUNCTION public.repair_auth_user_columns()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    is_sso_user = COALESCE(is_sso_user, FALSE),
    is_anonymous = COALESCE(is_anonymous, FALSE)
  WHERE LOWER(email) = 'itzpardhiv@gmail.com';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'rows_updated', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.repair_auth_user_columns() TO anon, authenticated, service_role;
