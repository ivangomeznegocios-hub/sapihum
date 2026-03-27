-- ============================================
-- Migration 20260325001000: Harden event entitlement user policies
-- ============================================

DROP POLICY IF EXISTS "Users can create own entitlements" ON public.event_entitlements;
DROP POLICY IF EXISTS "Users can claim matching entitlements" ON public.event_entitlements;

-- Entitlements are now granted/claimed via trusted server flows only.
-- Authenticated users keep read access to their matching rows.
