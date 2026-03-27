-- ============================================
-- Migration: Add Manual Earnings Support for Speakers
-- ============================================

-- 1. Add 'manual_bonus' to earning_type enum
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in some Postgres versions.
-- Supabase migrations usually run in transactions, so we might need a workaround or just hope it works.
-- Alternatively, we can check if it exists first.
DO $$ BEGIN
    ALTER TYPE earning_type ADD VALUE 'manual_bonus';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Relax constraints on speaker_earnings
ALTER TABLE public.speaker_earnings ALTER COLUMN event_id DROP NOT NULL;
ALTER TABLE public.speaker_earnings ALTER COLUMN student_id DROP NOT NULL;

-- 3. Add description column for notes on manual earnings
ALTER TABLE public.speaker_earnings ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.speaker_earnings.description IS 'Notes or reason for the earning, especially for manual bonuses';
