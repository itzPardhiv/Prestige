/**
 * PRESTIGE — Cipher Intelligence System
 * Supabase Report Event Tracking Service
 * 
 * Non-blocking operational tracking: records only metadata (report ID, cipher type,
 * character count, verification status, timestamp) to Supabase.
 * User plaintext, ciphertext, and full report contents REMAIN strictly local in localStorage.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ReportEventRow } from '../types/supabase';

export interface TrackReportParams {
  userId?: string;
  reportId: string;
  cipherType: string;
  characterCount?: number;
  verified?: boolean;
}

// In-memory set to prevent duplicate tracking caused by React re-renders or rapid dispatch
const trackedReportIds = new Set<string>();

export const supabaseReportService = {
  /**
   * Non-blocking report event recording.
   * Ensures that any network, RLS, or Supabase failure NEVER disrupts the local report flow.
   */
  async trackReportGeneration(params: TrackReportParams): Promise<ReportEventRow | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    if (!params.reportId) {
      return null;
    }

    // Deduplication check
    if (trackedReportIds.has(params.reportId)) {
      return null;
    }
    trackedReportIds.add(params.reportId);

    try {
      let activeUserId = params.userId;

      if (!activeUserId) {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          activeUserId = data.user.id;
        }
      }

      if (!activeUserId) {
        // Not authenticated in Supabase, report stays local only
        return null;
      }

      const { data, error } = await supabase
        .from('report_events')
        .insert({
          user_id: activeUserId,
          report_id: params.reportId,
          cipher_type: params.cipherType || 'UNKNOWN',
          character_count: params.characterCount ?? null,
          verified: params.verified ?? null,
        })
        .select()
        .single();

      if (error) {
        console.warn('[Supabase Report Tracking] Non-blocking tracking notice:', error.message);
        return null;
      }

      return data as ReportEventRow;
    } catch (err) {
      console.warn('[Supabase Report Tracking] Non-blocking exception caught:', err);
      return null;
    }
  },

  /**
   * Query the authenticated user's own report events (enforced by RLS)
   */
  async getUserReportEvents(userId: string, limit: number = 20): Promise<ReportEventRow[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('report_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Failed to fetch user report events:', error.message);
        return [];
      }

      return (data || []) as ReportEventRow[];
    } catch {
      return [];
    }
  },
};
