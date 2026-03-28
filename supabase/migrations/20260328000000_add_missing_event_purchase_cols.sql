-- ============================================
-- Add missing columns to event_purchases
-- ============================================

ALTER TABLE public.event_purchases
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
