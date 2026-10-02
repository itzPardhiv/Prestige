/**
 * PRESTIGE — Cipher Intelligence System
 * Supabase Admin Service
 * 
 * Provides administrative queries and mutation methods protected by Supabase RLS.
 * Non-admins calling these methods are rejected at the database RLS layer.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ProfileRow,
  LoginEventRow,
  ReportEventRow,
  AuditLogRow,
  AdminDashboardStats,
  PaginatedResult,
  UserDetailData,
} from '../types/supabase';

export const supabaseAdminService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Fetch aggregate administrative statistics from Supabase
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    if (!this.isConfigured()) {
      return {
        registered_users: 0,
        active_users: 0,
        total_logins: 0,
        successful_logins: 0,
        failed_logins: 0,
        total_reports: 0,
        reports_today: 0,
        reports_this_week: 0,
        reports_this_month: 0,
        new_users_today: 0,
        last_activity_at: null,
      };
    }

    try {
      // 1. Try PostgreSQL RPC function
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (!error && data) {
        return data as AdminDashboardStats;
      }

      // 2. Fallback: Aggregate queries using Supabase table queries
      const [
        { count: registeredUsers },
        { count: activeUsers },
        { count: totalLogins },
        { count: successfulLogins },
        { count: failedLogins },
        { count: totalReports },
        { count: reportsToday },
        { count: reportsThisWeek },
        { count: reportsThisMonth },
        { count: newUsersToday },
        { data: lastAudit },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('login_events').select('*', { count: 'exact', head: true }),
        supabase.from('login_events').select('*', { count: 'exact', head: true }).eq('success', true),
        supabase.from('login_events').select('*', { count: 'exact', head: true }).eq('success', false),
        supabase.from('report_events').select('*', { count: 'exact', head: true }),
        supabase.from('report_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('report_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('report_events').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('audit_logs').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      return {
        registered_users: registeredUsers || 0,
        active_users: activeUsers || 0,
        total_logins: totalLogins || 0,
        successful_logins: successfulLogins || 0,
        failed_logins: failedLogins || 0,
        total_reports: totalReports || 0,
        reports_today: reportsToday || 0,
        reports_this_week: reportsThisWeek || 0,
        reports_this_month: reportsThisMonth || 0,
        new_users_today: newUsersToday || 0,
        last_activity_at: lastAudit?.created_at || null,
      };
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      throw err;
    }
  },

  /**
   * Paginated user directory with search and active/inactive filter
   */
  async getUsers(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL'
  ): Promise<PaginatedResult<ProfileRow>> {
    if (!this.isConfigured()) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`email.ilike.${term},display_name.ilike.${term}`);
    }

    if (statusFilter === 'ACTIVE') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'INACTIVE') {
      query = query.eq('is_active', false);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }

    const total = count || 0;
    return {
      data: (data || []) as ProfileRow[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Toggle user activation state (ACTIVE / INACTIVE)
   */
  async toggleUserStatus(userId: string, newActiveStatus: boolean): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      // 1. Try RPC
      const { error: rpcError } = await supabase.rpc('admin_toggle_user_status', {
        p_target_user_id: userId,
        p_is_active: newActiveStatus,
      });

      if (!rpcError) return true;

      // 2. Fallback direct update (guarded by RLS public.is_admin())
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_active: newActiveStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Log in audit log
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_user_id: currentUser?.user?.id || null,
        action: newActiveStatus ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
        target_user_id: userId,
        metadata: {
          timestamp: new Date().toISOString(),
          toggled_by: currentUser?.user?.email,
        },
      });

      return true;
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      throw err;
    }
  },

  /**
   * Inspect a specific user and fetch their recent operational activities
   */
  async getUserDetail(userId: string): Promise<UserDetailData | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return null;
      }

      const [loginsRes, reportsRes, auditRes] = await Promise.all([
        supabase
          .from('login_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('report_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('audit_logs')
          .select('*')
          .or(`actor_user_id.eq.${userId},target_user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      return {
        profile: profile as ProfileRow,
        recentLogins: (loginsRes.data || []) as LoginEventRow[],
        recentReports: (reportsRes.data || []) as ReportEventRow[],
        recentAuditLogs: (auditRes.data || []) as AuditLogRow[],
      };
    } catch (err) {
      console.error('Failed to get user detail:', err);
      throw err;
    }
  },

  /**
   * Paginated login events
   */
  async getLoginEvents(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    filter: 'ALL' | 'SUCCESS' | 'FAILED' = 'ALL'
  ): Promise<PaginatedResult<LoginEventRow>> {
    if (!this.isConfigured()) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('login_events').select('*', { count: 'exact' });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`email.ilike.${term},failure_reason.ilike.${term}`);
    }

    if (filter === 'SUCCESS') {
      query = query.eq('success', true);
    } else if (filter === 'FAILED') {
      query = query.eq('success', false);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to fetch login events:', error);
      throw error;
    }

    const total = count || 0;
    return {
      data: (data || []) as LoginEventRow[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Paginated report events
   */
  async getReportEvents(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    cipherFilter: string = 'ALL'
  ): Promise<PaginatedResult<ReportEventRow>> {
    if (!this.isConfigured()) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('report_events').select('*', { count: 'exact' });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`report_id.ilike.${term},cipher_type.ilike.${term}`);
    }

    if (cipherFilter !== 'ALL') {
      query = query.eq('cipher_type', cipherFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to fetch report events:', error);
      throw error;
    }

    const total = count || 0;
    return {
      data: (data || []) as ReportEventRow[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Paginated audit logs (Admin only)
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 15,
    search: string = '',
    actionFilter: string = 'ALL'
  ): Promise<PaginatedResult<AuditLogRow>> {
    if (!this.isConfigured()) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('audit_logs').select('*', { count: 'exact' });

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`action.ilike.${term}`);
    }

    if (actionFilter !== 'ALL') {
      query = query.eq('action', actionFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }

    const total = count || 0;
    return {
      data: (data || []) as AuditLogRow[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
};
