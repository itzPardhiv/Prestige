/**
 * PRESTIGE — Cipher Intelligence System
 * Supabase Backend Type Definitions
 */

export type UserRole = 'USER' | 'ADMIN';

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  first_login_at: string | null;
  last_login_at: string | null;
  login_count: number;
  report_count: number;
}

export interface LoginEventRow {
  id: string;
  user_id: string | null;
  email: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface ReportEventRow {
  id: string;
  user_id: string;
  report_id: string;
  cipher_type: string;
  character_count: number | null;
  verified: boolean | null;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminDashboardStats {
  registered_users: number;
  active_users: number;
  total_logins: number;
  successful_logins: number;
  failed_logins: number;
  total_reports: number;
  reports_today: number;
  reports_this_week: number;
  reports_this_month: number;
  new_users_today: number;
  last_activity_at: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetailData {
  profile: ProfileRow;
  recentLogins: LoginEventRow[];
  recentReports: ReportEventRow[];
  recentAuditLogs: AuditLogRow[];
}

export interface UserProgressRow {
  id: string;
  user_id: string;
  curriculum_id: string;
  curriculum_name: string;
  mastery_percent: number;
  challenges_completed: number;
  challenges_total: number;
  created_at: string;
  updated_at: string;
}

export interface UserChallengeCompletionRow {
  id: string;
  user_id: string;
  challenge_id: string;
  attempts: number;
  score: number;
  completed_at: string;
}

