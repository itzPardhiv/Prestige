import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CurriculumMasteryItem } from '../types/user';
import { UserProgressRow, UserChallengeCompletionRow } from '../types/supabase';
import { CANONICAL_CURRICULUM, findCurriculumForChallenge, getDefaultCurriculumMastery } from '../utils/curriculum';

export const supabaseProgressService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Fetch a user's curriculum progress records from public.user_progress.
   * If no records exist, initializes all six canonical curriculum items at 0%.
   */
  async getUserProgress(userId: string): Promise<CurriculumMasteryItem[]> {
    if (!this.isConfigured() || !userId) {
      return getDefaultCurriculumMastery();
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('user_progress query notice:', error.message);
        return getDefaultCurriculumMastery();
      }

      if (!data || data.length === 0) {
        // No progress records found: initialize all 6 items at 0%
        return await this.initializeUserProgress(userId);
      }

      const rows = data as UserProgressRow[];
      const progressMap = new Map<string, number>();
      rows.forEach((r) => progressMap.set(r.curriculum_id, r.mastery_percent));

      // If fewer than 6 canonical records exist, asynchronously seed missing records
      if (rows.length < CANONICAL_CURRICULUM.length) {
        this.initializeUserProgress(userId).catch(() => {});
      }

      return CANONICAL_CURRICULUM.map((item) => ({
        id: item.id,
        name: item.name,
        percent: progressMap.has(item.id) ? progressMap.get(item.id)! : 0,
      }));
    } catch (err) {
      console.warn('Error fetching user progress:', err);
      return getDefaultCurriculumMastery();
    }
  },

  /**
   * Idempotently initialize the 6 canonical curriculum records at 0% mastery.
   * Invokes SECURITY DEFINER function public.initialize_user_progress(p_user_id)
   * with fallback to direct upsert. Existing records are NEVER overwritten.
   */
  async initializeUserProgress(userId: string): Promise<CurriculumMasteryItem[]> {
    const defaultItems = getDefaultCurriculumMastery();
    if (!this.isConfigured() || !userId) {
      return defaultItems;
    }

    try {
      // 1. Invoke SECURITY DEFINER RPC to initialize all 6 items at 0% idempotently
      const { error: rpcError } = await supabase.rpc('initialize_user_progress', {
        p_user_id: userId,
      });

      if (rpcError) {
        // Fallback: direct table upsert with ignoreDuplicates (ON CONFLICT DO NOTHING)
        const rowsToInsert = CANONICAL_CURRICULUM.map((item) => ({
          user_id: userId,
          curriculum_id: item.id,
          curriculum_name: item.name,
          mastery_percent: 0,
          challenges_completed: 0,
          challenges_total: item.totalChallenges,
        }));

        const { error } = await supabase
          .from('user_progress')
          .upsert(rowsToInsert, {
            onConflict: 'user_id,curriculum_id',
            ignoreDuplicates: true,
          });

        if (error) {
          console.warn('user_progress initialization warning:', error.message);
        }
      }

      return defaultItems;
    } catch (err) {
      console.warn('Failed to initialize user progress in Supabase:', err);
      return defaultItems;
    }
  },

  /**
   * Fetch all challenge IDs completed by the authenticated user.
   */
  async getCompletedChallenges(userId: string): Promise<string[]> {
    if (!this.isConfigured() || !userId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('user_challenge_completions')
        .select('challenge_id')
        .eq('user_id', userId);

      if (error || !data) {
        return [];
      }

      return (data as { challenge_id: string }[]).map((r) => r.challenge_id);
    } catch {
      return [];
    }
  },

  /**
   * Record a completed challenge for the authenticated user and update their curriculum mastery.
   * This is strictly user-scoped and protected by RLS.
   */
  async recordChallengeCompletion(
    userId: string,
    challengeId: string,
    score: number = 100
  ): Promise<{ success: boolean; updatedProgress?: CurriculumMasteryItem[] }> {
    if (!this.isConfigured() || !userId || !challengeId) {
      return { success: false };
    }

    try {
      // 1. Record the challenge completion idempotently
      await supabase
        .from('user_challenge_completions')
        .upsert(
          {
            user_id: userId,
            challenge_id: challengeId,
            score,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,challenge_id',
            ignoreDuplicates: false,
          }
        );

      // 2. Query all completed challenges for this user to recompute progress
      const completedChallengeIds = await this.getCompletedChallenges(userId);
      if (!completedChallengeIds.includes(challengeId)) {
        completedChallengeIds.push(challengeId);
      }

      // 3. Update the matching curriculum module
      const matchedModule = findCurriculumForChallenge(challengeId);
      if (matchedModule) {
        const completedCount = matchedModule.challengeIds.filter((cid) =>
          completedChallengeIds.includes(cid)
        ).length;
        const newPercent = Math.min(
          100,
          Math.round((completedCount / matchedModule.totalChallenges) * 100)
        );

        await supabase
          .from('user_progress')
          .upsert(
            {
              user_id: userId,
              curriculum_id: matchedModule.id,
              curriculum_name: matchedModule.name,
              mastery_percent: newPercent,
              challenges_completed: completedCount,
              challenges_total: matchedModule.totalChallenges,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,curriculum_id',
            }
          );
      }

      // 4. Return the refreshed full curriculum progress
      const updatedProgress = await this.getUserProgress(userId);
      return { success: true, updatedProgress };
    } catch (err) {
      console.warn('Error recording challenge completion:', err);
      return { success: false };
    }
  },
};
