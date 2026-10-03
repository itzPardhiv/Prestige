import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  LogIn,
  FileText,
  Activity,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Eye,
  X,
  AlertTriangle,
  Lock,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { UserProfile } from '../types/user';
import {
  ProfileRow,
  LoginEventRow,
  ReportEventRow,
  AuditLogRow,
  AdminDashboardStats,
  UserDetailData,
} from '../types/supabase';
import { supabaseAdminService } from '../services/supabaseAdmin';
import { soundService } from '../services/sound';

interface AdminDashboardPageProps {
  user: UserProfile;
  darkMode?: boolean;
  onNavigateHome: () => void;
  onSignOut?: () => void;
}

type AdminTab = 'users' | 'logins' | 'reports' | 'audit';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  darkMode = true,
  onNavigateHome,
  onSignOut,
}) => {
  const isAdmin = user?.role === 'ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Stats state
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Users Directory state
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [userPage, setUserPage] = useState<number>(1);
  const [userLimit] = useState<number>(10);
  const [userTotal, setUserTotal] = useState<number>(0);
  const [userTotalPages, setUserTotalPages] = useState<number>(1);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);

  // User Detail Drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Login Activity state
  const [loginEvents, setLoginEvents] = useState<LoginEventRow[]>([]);
  const [loginPage, setLoginPage] = useState<number>(1);
  const [loginLimit] = useState<number>(15);
  const [loginTotal, setLoginTotal] = useState<number>(0);
  const [loginTotalPages, setLoginTotalPages] = useState<number>(1);
  const [loginSearch, setLoginSearch] = useState<string>('');
  const [loginFilter, setLoginFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [isLoginsLoading, setIsLoginsLoading] = useState<boolean>(false);

  // Report Activity state
  const [reportEvents, setReportEvents] = useState<ReportEventRow[]>([]);
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportLimit] = useState<number>(15);
  const [reportTotal, setReportTotal] = useState<number>(0);
  const [reportTotalPages, setReportTotalPages] = useState<number>(1);
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportCipherFilter, setReportCipherFilter] = useState<string>('ALL');
  const [isReportsLoading, setIsReportsLoading] = useState<boolean>(false);

  // Audit Log state
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditLimit] = useState<number>(15);
  const [auditTotal, setAuditTotal] = useState<number>(0);
  const [auditTotalPages, setAuditTotalPages] = useState<number>(1);
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);

  // Status message / toast
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Fetch Summary Stats
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    setIsStatsLoading(true);
    try {
      const data = await supabaseAdminService.getDashboardStats();
      setStats(data);
      setLastRefreshedAt(new Date());
    } catch (err: unknown) {
      console.error('Failed to load stats:', err);
      showStatus('Failed to load operational statistics from Supabase.', 'error');
    } finally {
      setIsStatsLoading(false);
    }
  }, [isAdmin]);

  // 2. Fetch Users
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsUsersLoading(true);
    try {
      const res = await supabaseAdminService.getUsers(userPage, userLimit, userSearch, userStatusFilter);
      setUsers(res.data);
      setUserTotal(res.total);
      setUserTotalPages(res.totalPages);
    } catch (err: unknown) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [isAdmin, userPage, userLimit, userSearch, userStatusFilter]);

  // 3. Fetch Logins
  const fetchLogins = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoginsLoading(true);
    try {
      const res = await supabaseAdminService.getLoginEvents(loginPage, loginLimit, loginSearch, loginFilter);
      setLoginEvents(res.data);
      setLoginTotal(res.total);
      setLoginTotalPages(res.totalPages);
    } catch (err: unknown) {
      console.error('Failed to fetch login events:', err);
    } finally {
      setIsLoginsLoading(false);
    }
  }, [isAdmin, loginPage, loginLimit, loginSearch, loginFilter]);

  // 4. Fetch Reports
  const fetchReports = useCallback(async () => {
    if (!isAdmin) return;
    setIsReportsLoading(true);
    try {
      const res = await supabaseAdminService.getReportEvents(reportPage, reportLimit, reportSearch, reportCipherFilter);
      setReportEvents(res.data);
      setReportTotal(res.total);
      setReportTotalPages(res.totalPages);
    } catch (err: unknown) {
      console.error('Failed to fetch report events:', err);
    } finally {
      setIsReportsLoading(false);
    }
  }, [isAdmin, reportPage, reportLimit, reportSearch, reportCipherFilter]);

  // 5. Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    if (!isAdmin) return;
    setIsAuditLoading(true);
    try {
      const res = await supabaseAdminService.getAuditLogs(auditPage, auditLimit, auditSearch, auditActionFilter);
      setAuditLogs(res.data);
      setAuditTotal(res.total);
      setAuditTotalPages(res.totalPages);
    } catch (err: unknown) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsAuditLoading(false);
    }
  }, [isAdmin, auditPage, auditLimit, auditSearch, auditActionFilter]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, fetchStats]);

  // Tab data fetching
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'logins') fetchLogins();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'audit') fetchAuditLogs();
  }, [isAdmin, activeTab, fetchUsers, fetchLogins, fetchReports, fetchAuditLogs]);

  // User detail drawer handler
  const handleOpenUserDetail = async (userId: string) => {
    soundService.playKeyClick();
    setSelectedUserId(userId);
    setIsUserDetailLoading(true);
    try {
      const details = await supabaseAdminService.getUserDetail(userId);
      setUserDetail(details);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      showStatus('Unable to load user details.', 'error');
    } finally {
      setIsUserDetailLoading(false);
    }
  };

  // Toggle user activation handler
  const handleToggleUserStatus = async (targetUser: ProfileRow) => {
    soundService.playKeyClick();
    const newStatus = !targetUser.is_active;
    setActionInProgressId(targetUser.id);
    try {
      await supabaseAdminService.toggleUserStatus(targetUser.id, newStatus);
      showStatus(
        `User ${targetUser.email} has been successfully ${newStatus ? 'reactivated' : 'deactivated'}.`,
        'success'
      );
      // Refresh current table and details if open
      fetchUsers();
      fetchStats();
      if (selectedUserId === targetUser.id) {
        const details = await supabaseAdminService.getUserDetail(targetUser.id);
        setUserDetail(details);
      }
    } catch (err: unknown) {
      console.error('Failed to toggle status:', err);
      showStatus('Operation failed. Check administrative permissions.', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Formatting helpers
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatActionName = (action: string) => {
    switch (action) {
      case 'USER_REGISTERED':
        return 'User Registered';
      case 'USER_LOGIN':
        return 'User Login';
      case 'ADMIN_LOGIN':
        return 'Admin Login';
      case 'LOGIN_FAILED':
        return 'Failed Login';
      case 'USER_LOGOUT':
        return 'User Logout';
      case 'REPORT_GENERATED':
        return 'Report Generated';
      case 'USER_DEACTIVATED':
        return 'User Deactivated';
      case 'USER_REACTIVATED':
        return 'User Reactivated';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  // Non-Admin unauthorized screen
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="surface-card p-8 rounded-xl border border-red-500/20 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="label-eyebrow text-red-500">Security Clearance Denied</span>
            <h2 className="text-xl font-semibold text-content-primary">Administrative Access Required</h2>
            <p className="text-xs text-content-secondary max-w-md mx-auto">
              The /admin operational console and database records are protected by Supabase Row Level Security (RLS).
              Your current account does not have administrator clearance.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-surface-secondary hover:bg-surface-elevated text-content-primary text-xs font-medium rounded-lg border border-border transition-colors"
            >
              Return to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-18 right-6 z-50 px-4 py-2.5 rounded-lg border text-xs shadow-lg flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 backdrop-blur-md'
                : 'bg-red-500/10 border-red-500/30 text-red-400 backdrop-blur-md'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="label-eyebrow text-brand-600 dark:text-brand-400">
              Clearance: Omni-Admin
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase RLS Active
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-content-primary">
            Administrative Operations Console
          </h1>
          <p className="text-xs text-content-secondary">
            Authoritative database telemetry, user directory enforcement, login attempts, and report generation metadata.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-content-tertiary hidden lg:inline">
            Updated {lastRefreshedAt.toLocaleTimeString()}
          </span>
          <button
            onClick={() => {
              soundService.playKeyClick();
              fetchStats();
              if (activeTab === 'users') fetchUsers();
              else if (activeTab === 'logins') fetchLogins();
              else if (activeTab === 'reports') fetchReports();
              else if (activeTab === 'audit') fetchAuditLogs();
            }}
            disabled={isStatsLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-secondary hover:bg-surface-elevated text-content-primary text-xs font-medium border border-border transition-colors disabled:opacity-60"
            title="Refresh database operational metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStatsLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={onNavigateHome}
            className="px-2.5 py-1.5 rounded-md bg-surface-secondary hover:bg-surface-elevated text-content-secondary hover:text-content-primary text-xs font-medium border border-border transition-colors"
            title="Return to Public Workspace"
          >
            Workspace
          </button>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-500/20 transition-colors"
              title="Sign Out of Administrator Session"
            >
              Exit Admin
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Strip (11 Authoritative Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Registered Users */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Registered Users</span>
            <Users className="w-3.5 h-3.5 text-content-tertiary" />
          </div>
          <div className="text-xl font-semibold font-mono text-content-primary">
            {isStatsLoading ? '...' : stats?.registered_users ?? 0}
          </div>
          <div className="text-[10px] text-content-secondary">Total profiles in database</div>
        </div>

        {/* Metric 2: Active Users (last 30d login) */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Active Users</span>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400">
            {isStatsLoading ? '...' : stats?.active_users ?? 0}
          </div>
          <div className="text-[10px] text-content-secondary">Logged in within 30 days</div>
        </div>

        {/* Metric 3: Total Logins */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Total Logins</span>
            <LogIn className="w-3.5 h-3.5 text-content-tertiary" />
          </div>
          <div className="text-xl font-semibold font-mono text-content-primary">
            {isStatsLoading ? '...' : stats?.total_logins ?? 0}
          </div>
          <div className="text-[10px] text-content-secondary">
            {stats ? `${stats.successful_logins} OK / ${stats.failed_logins} failed` : 'All sessions'}
          </div>
        </div>

        {/* Metric 4: Reports Generated */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Reports Generated</span>
            <FileText className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <div className="text-xl font-semibold font-mono text-brand-600 dark:text-brand-400">
            {isStatsLoading ? '...' : stats?.total_reports ?? 0}
          </div>
          <div className="text-[10px] text-content-secondary">All-time tracked events</div>
        </div>

        {/* Metric 5: Reports Today & This Week */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Reports (UTC)</span>
            <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
          </div>
          <div className="text-xl font-semibold font-mono text-content-primary">
            {isStatsLoading ? '...' : `${stats?.reports_today ?? 0} / ${stats?.reports_this_week ?? 0}`}
          </div>
          <div className="text-[10px] text-content-secondary">Today / This week (UTC)</div>
        </div>

        {/* Metric 6: Reports This Month & New Users */}
        <div className="surface-card p-3.5 rounded-lg border border-border space-y-1">
          <div className="text-[11px] font-medium text-content-tertiary flex items-center justify-between">
            <span>Month & Signups</span>
            <Layers className="w-3.5 h-3.5 text-content-tertiary" />
          </div>
          <div className="text-xl font-semibold font-mono text-content-primary">
            {isStatsLoading ? '...' : `${stats?.reports_this_month ?? 0}`}
          </div>
          <div className="text-[10px] text-content-secondary">
            {stats ? `+${stats.new_users_today} new users today (UTC)` : 'Calendar month (UTC)'}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            soundService.playKeyClick();
            setActiveTab('users');
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-brand-500 text-content-primary font-semibold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory ({userTotal})</span>
        </button>

        <button
          onClick={() => {
            soundService.playKeyClick();
            setActiveTab('logins');
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'logins'
              ? 'border-brand-500 text-content-primary font-semibold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Login Activity ({loginTotal})</span>
        </button>

        <button
          onClick={() => {
            soundService.playKeyClick();
            setActiveTab('reports');
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-brand-500 text-content-primary font-semibold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report Activity ({reportTotal})</span>
        </button>

        <button
          onClick={() => {
            soundService.playKeyClick();
            setActiveTab('audit');
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand-500 text-content-primary font-semibold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Log ({auditTotal})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. USERS DIRECTORY TAB */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search by email or name..."
                className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                  setUserPage(1);
                }}
                className="bg-surface-secondary border border-border rounded-md px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Accounts Only</option>
                <option value="INACTIVE">Deactivated Accounts Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="surface-card rounded-lg border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4">Last Login</th>
                    <th className="py-2.5 px-4 text-center">Logins</th>
                    <th className="py-2.5 px-4 text-center">Reports</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-content-tertiary">
                        Loading user records from Supabase...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-content-tertiary">
                        No user profiles match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-content-primary">
                          {u.display_name || 'Anonymous User'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-content-secondary truncate max-w-[180px]">
                          {u.email}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                : 'bg-zinc-500/10 text-content-secondary border border-border'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-content-secondary whitespace-nowrap">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="py-2.5 px-4 text-content-secondary whitespace-nowrap">
                          {formatDate(u.last_login_at)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-content-primary">
                          {u.login_count}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-content-primary">
                          {u.report_count}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                              u.is_active
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleOpenUserDetail(u.id)}
                            className="p-1 hover:bg-surface-secondary rounded text-content-secondary hover:text-content-primary transition-colors"
                            title="Inspect user details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={actionInProgressId === u.id}
                              className={`p-1 rounded transition-colors ${
                                u.is_active
                                  ? 'hover:bg-red-500/10 text-red-500 hover:text-red-600'
                                  : 'hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-600'
                              }`}
                              title={u.is_active ? 'Deactivate account' : 'Reactivate account'}
                            >
                              {u.is_active ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="py-2.5 px-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between text-xs text-content-secondary">
              <div>
                Showing {users.length > 0 ? (userPage - 1) * userLimit + 1 : 0} to{' '}
                {Math.min(userPage * userLimit, userTotal)} of {userTotal} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage <= 1}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-content-primary">
                  Page {userPage} of {userTotalPages || 1}
                </span>
                <button
                  onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                  disabled={userPage >= userTotalPages}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LOGIN ACTIVITY TAB */}
      {/* ============================================================== */}
      {activeTab === 'logins' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={loginSearch}
                onChange={(e) => {
                  setLoginSearch(e.target.value);
                  setLoginPage(1);
                }}
                placeholder="Search email or reason..."
                className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={loginFilter}
                onChange={(e) => {
                  setLoginFilter(e.target.value as 'ALL' | 'SUCCESS' | 'FAILED');
                  setLoginPage(1);
                }}
                className="bg-surface-secondary border border-border rounded-md px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="ALL">All Login Events</option>
                <option value="SUCCESS">Successful Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>

          <div className="surface-card rounded-lg border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Email / User</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Failure Reason</th>
                    <th className="py-2.5 px-4">User Agent / Platform</th>
                    <th className="py-2.5 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoginsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-content-tertiary">
                        Loading login telemetry...
                      </td>
                    </tr>
                  ) : loginEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-content-tertiary">
                        No login events recorded.
                      </td>
                    </tr>
                  ) : (
                    loginEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="py-2.5 px-4 text-content-secondary whitespace-nowrap">
                          {formatDate(evt.created_at)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-content-primary truncate max-w-[200px]">
                          {evt.email || (evt.user_id ? evt.user_id.slice(0, 8) + '...' : 'Anonymous')}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              evt.success
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {evt.success ? 'SUCCESS' : 'FAILED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-content-secondary truncate max-w-[220px]">
                          {evt.failure_reason || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-content-tertiary font-mono text-[11px] truncate max-w-[240px]" title={evt.user_agent || ''}>
                          {evt.user_agent ? evt.user_agent.split('(')[0] : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-content-tertiary font-mono text-[11px]">
                          {evt.ip_address || 'Privacy mode'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 px-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between text-xs text-content-secondary">
              <div>
                Showing {loginEvents.length > 0 ? (loginPage - 1) * loginLimit + 1 : 0} to{' '}
                {Math.min(loginPage * loginLimit, loginTotal)} of {loginTotal} events
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLoginPage((p) => Math.max(1, p - 1))}
                  disabled={loginPage <= 1}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-content-primary">
                  Page {loginPage} of {loginTotalPages || 1}
                </span>
                <button
                  onClick={() => setLoginPage((p) => Math.min(loginTotalPages, p + 1))}
                  disabled={loginPage >= loginTotalPages}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. REPORT ACTIVITY TAB */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Privacy Note Banner */}
          <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-lg flex items-start gap-2.5 text-xs">
            <Lock className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-content-primary">Local-First Storage Guarantee</span>
              <p className="text-content-secondary leading-snug">
                Supabase records only report-generation metadata (Report ID, cipher type, character count, verification flag, timestamp).
                Plaintext, full ciphertext, and technical analysis dossiers remain strictly stored on the user's browser client.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setReportPage(1);
                }}
                placeholder="Search report ID or cipher..."
                className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={reportCipherFilter}
                onChange={(e) => {
                  setReportCipherFilter(e.target.value);
                  setReportPage(1);
                }}
                className="bg-surface-secondary border border-border rounded-md px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="ALL">All Cipher Engines</option>
                <option value="Caesar">Caesar Cipher</option>
                <option value="Vigenere">Vigenère Cipher</option>
                <option value="Atbash">Atbash Cipher</option>
                <option value="Rot13">Rot13</option>
                <option value="RailFence">Rail Fence</option>
                <option value="Substitution">Substitution</option>
                <option value="Playfair">Playfair</option>
                <option value="Affine">Affine</option>
              </select>
            </div>
          </div>

          <div className="surface-card rounded-lg border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">Generated At</th>
                    <th className="py-2.5 px-4">User ID</th>
                    <th className="py-2.5 px-4">Report ID</th>
                    <th className="py-2.5 px-4">Cipher Type</th>
                    <th className="py-2.5 px-4 text-center">Characters</th>
                    <th className="py-2.5 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isReportsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-content-tertiary">
                        Loading report event records...
                      </td>
                    </tr>
                  ) : reportEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-content-tertiary">
                        No report generation events logged yet.
                      </td>
                    </tr>
                  ) : (
                    reportEvents.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="py-2.5 px-4 text-content-secondary whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-content-tertiary">
                          {r.user_id.slice(0, 8)}...
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-content-primary">
                          {r.report_id}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                            {r.cipher_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-content-secondary">
                          {r.character_count ?? '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              r.verified
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-zinc-500/10 text-content-tertiary'
                            }`}
                          >
                            {r.verified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 px-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between text-xs text-content-secondary">
              <div>
                Showing {reportEvents.length > 0 ? (reportPage - 1) * reportLimit + 1 : 0} to{' '}
                {Math.min(reportPage * reportLimit, reportTotal)} of {reportTotal} reports
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  disabled={reportPage <= 1}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-content-primary">
                  Page {reportPage} of {reportTotalPages || 1}
                </span>
                <button
                  onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
                  disabled={reportPage >= reportTotalPages}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. AUDIT LOG TAB */}
      {/* ============================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => {
                  setAuditSearch(e.target.value);
                  setAuditPage(1);
                }}
                placeholder="Search action name..."
                className="w-full bg-surface-secondary border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="bg-surface-secondary border border-border rounded-md px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="ALL">All Actions</option>
                <option value="USER_REGISTERED">User Registered</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="ADMIN_LOGIN">Admin Login</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="USER_LOGOUT">User Logout</option>
                <option value="REPORT_GENERATED">Report Generated</option>
                <option value="USER_DEACTIVATED">User Deactivated</option>
                <option value="USER_REACTIVATED">User Reactivated</option>
              </select>
            </div>
          </div>

          <div className="surface-card rounded-lg border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-border text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Target User</th>
                    <th className="py-2.5 px-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isAuditLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-content-tertiary">
                        Loading audit logs from Supabase...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-content-tertiary">
                        No audit events logged.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="py-2.5 px-4 text-content-secondary whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              log.action.includes('DEACTIVATED') || log.action.includes('FAILED')
                                ? 'bg-red-500/10 text-red-500'
                                : log.action.includes('REGISTERED') || log.action.includes('REACTIVATED')
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-brand-500/10 text-brand-500'
                            }`}
                          >
                            {formatActionName(log.action)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-content-secondary">
                          {log.actor_user_id ? log.actor_user_id.slice(0, 8) + '...' : 'System'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-content-tertiary">
                          {log.target_user_id ? log.target_user_id.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-content-secondary truncate max-w-[280px]">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-2.5 px-4 bg-surface-secondary/40 border-t border-border flex items-center justify-between text-xs text-content-secondary">
              <div>
                Showing {auditLogs.length > 0 ? (auditPage - 1) * auditLimit + 1 : 0} to{' '}
                {Math.min(auditPage * auditLimit, auditTotal)} of {auditTotal} audit events
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage <= 1}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-content-primary">
                  Page {auditPage} of {auditTotalPages || 1}
                </span>
                <button
                  onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                  disabled={auditPage >= auditTotalPages}
                  className="p-1 rounded hover:bg-surface-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* USER DETAIL SLIDE-OVER DRAWER */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedUserId && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserId(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-xl bg-surface-canvas border-l border-border shadow-2xl h-full flex flex-col overflow-y-auto z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface-canvas/90 backdrop-blur-md z-10">
                <div className="space-y-0.5">
                  <span className="label-eyebrow text-brand-500">User Telemetry Inspection</span>
                  <h3 className="text-base font-semibold text-content-primary">
                    {userDetail?.profile?.display_name || userDetail?.profile?.email || 'User Dossier'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-1 text-content-secondary hover:text-content-primary rounded-md hover:bg-surface-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-6 flex-1">
                {isUserDetailLoading ? (
                  <div className="py-16 text-center text-xs text-content-tertiary">
                    Loading user operational profile...
                  </div>
                ) : userDetail?.profile ? (
                  <>
                    {/* Identity & Status Card */}
                    <div className="surface-card p-4 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-content-primary">
                            {userDetail.profile.display_name || 'No Display Name'}
                          </div>
                          <div className="text-xs font-mono text-content-secondary">
                            {userDetail.profile.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              userDetail.profile.is_active
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}
                          >
                            {userDetail.profile.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {userDetail.profile.role}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            User ID
                          </span>
                          <span className="font-mono text-content-secondary text-[11px] truncate block">
                            {userDetail.profile.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            Created At
                          </span>
                          <span className="text-content-secondary text-[11px]">
                            {formatDate(userDetail.profile.created_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            First Login
                          </span>
                          <span className="text-content-secondary text-[11px]">
                            {formatDate(userDetail.profile.first_login_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            Last Login
                          </span>
                          <span className="text-content-secondary text-[11px]">
                            {formatDate(userDetail.profile.last_login_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            Login Count
                          </span>
                          <span className="font-mono text-content-primary">
                            {userDetail.profile.login_count} sessions
                          </span>
                        </div>
                        <div>
                          <span className="text-content-tertiary block text-[10px] uppercase font-mono">
                            Reports Tracked
                          </span>
                          <span className="font-mono text-brand-500">
                            {userDetail.profile.report_count} reports
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Button */}
                      {userDetail.profile.id !== user.id && (
                        <div className="pt-2 border-t border-border">
                          <button
                            onClick={() => handleToggleUserStatus(userDetail.profile)}
                            disabled={actionInProgressId === userDetail.profile.id}
                            className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${
                              userDetail.profile.is_active
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {userDetail.profile.is_active ? 'Deactivate This Account' : 'Reactivate This Account'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recent Logins */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-content-primary uppercase tracking-wider font-mono">
                        Recent Login History (Last 10)
                      </h4>
                      <div className="surface-card rounded-lg border border-border divide-y divide-border overflow-hidden">
                        {userDetail.recentLogins.length === 0 ? (
                          <div className="p-3 text-xs text-content-tertiary text-center">
                            No login events recorded for this user.
                          </div>
                        ) : (
                          userDetail.recentLogins.map((lg) => (
                            <div key={lg.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono text-content-secondary block text-[11px]">
                                  {formatDate(lg.created_at)}
                                </span>
                                <span className="text-[10px] text-content-tertiary">
                                  {lg.user_agent ? lg.user_agent.split('(')[0] : 'Unknown client'}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  lg.success
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-500'
                                }`}
                              >
                                {lg.success ? 'SUCCESS' : lg.failure_reason || 'FAILED'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Recent Reports */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-content-primary uppercase tracking-wider font-mono">
                        Recent Reports Generated (Last 10)
                      </h4>
                      <div className="surface-card rounded-lg border border-border divide-y divide-border overflow-hidden">
                        {userDetail.recentReports.length === 0 ? (
                          <div className="p-3 text-xs text-content-tertiary text-center">
                            No reports generated yet by this user.
                          </div>
                        ) : (
                          userDetail.recentReports.map((rp) => (
                            <div key={rp.id} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono font-medium text-content-primary block">
                                  {rp.report_id}
                                </span>
                                <span className="text-[10px] text-content-tertiary">
                                  {formatDate(rp.created_at)} · {rp.character_count ?? 0} chars
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brand-500/10 text-brand-500">
                                {rp.cipher_type}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-xs text-content-tertiary">
                    User record not found or inaccessible.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
