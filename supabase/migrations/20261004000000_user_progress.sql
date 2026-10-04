-- =============================================================================
-- PRESTIGE — User Progress & Curriculum Mastery System
-- Migration: 20261004000000_user_progress.sql
-- =============================================================================

-- 1. USER CURRICULUM PROGRESS TABLE
-- Stores user-specific progress across canonical curriculum modules
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum_id TEXT NOT NULL,
  curriculum_name TEXT NOT NULL,
  mastery_percent INTEGER NOT NULL DEFAULT 0 CHECK (mastery_percent >= 0 AND mastery_percent <= 100),
  challenges_completed INTEGER NOT NULL DEFAULT 0 CHECK (challenges_completed >= 0),
  challenges_total INTEGER NOT NULL DEFAULT 1 CHECK (challenges_total >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_progress_user_curriculum_unique UNIQUE (user_id, curriculum_id)
);

-- 2. USER CHALLENGE COMPLETIONS TABLE
-- Tracks individual challenge completions per user
CREATE TABLE IF NOT EXISTS public.user_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_challenge_unique UNIQUE (user_id, challenge_id)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_curriculum_id ON public.user_progress(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_completions_user_id ON public.user_challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_completions_challenge_id ON public.user_challenge_completions(challenge_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;

-- DROP EXISTING POLICIES TO PREVENT DUPLICATES
DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;

DROP POLICY IF EXISTS "Users can read own challenge completions" ON public.user_challenge_completions;
DROP POLICY IF EXISTS "Users can insert own challenge completions" ON public.user_challenge_completions;
DROP POLICY IF EXISTS "Users can update own challenge completions" ON public.user_challenge_completions;
DROP POLICY IF EXISTS "Users can delete own challenge completions" ON public.user_challenge_completions;

-- RLS POLICIES FOR USER_PROGRESS
-- Strict user isolation: User A cannot read or write User B's progress
CREATE POLICY "Users can read own progress"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS POLICIES FOR USER_CHALLENGE_COMPLETIONS
CREATE POLICY "Users can read own challenge completions"
  ON public.user_challenge_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge completions"
  ON public.user_challenge_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge completions"
  ON public.user_challenge_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenge completions"
  ON public.user_challenge_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- FUNCTION: initialize_user_progress
-- Idempotent: inserts the 6 canonical curriculum items at 0% mastery
CREATE OR REPLACE FUNCTION public.initialize_user_progress(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, curriculum_id, curriculum_name, mastery_percent, challenges_completed, challenges_total)
  VALUES
    (p_user_id, 'caesar-rotational', 'Caesar & Rotational Ciphers', 0, 0, 2),
    (p_user_id, 'atbash-inverted', 'Atbash Inverted Alphabet', 0, 0, 1),
    (p_user_id, 'vigenere-polyalphabetic', 'Vigenère Polyalphabetic Key Schedules', 0, 0, 1),
    (p_user_id, 'morse-code', 'International Morse Code Encoding', 0, 0, 1),
    (p_user_id, 'substitution-frequency', 'Monoalphabetic Substitution & Letter Frequency', 0, 0, 1),
    (p_user_id, 'base64-binary', 'Base64 & 8-Bit Binary Encodings', 0, 0, 2)
  ON CONFLICT (user_id, curriculum_id) DO NOTHING;
END;
$$;

-- TRIGGER FUNCTION: handle_new_user_progress
CREATE OR REPLACE FUNCTION public.handle_new_user_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_user_progress(NEW.id);
  RETURN NEW;
END;
$$;

-- TRIGGER ON auth.users
DROP TRIGGER IF EXISTS tr_init_user_progress ON auth.users;
CREATE TRIGGER tr_init_user_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_progress();
