-- ============================================
-- MIGRATION: 20260416221000_fix_payment_webhook_locked_at_nullable
-- Description: Allows webhook locks to be cleared after processing/failure.
-- ============================================

ALTER TABLE IF EXISTS public.payment_webhook_events
    ALTER COLUMN locked_at DROP NOT NULL;
