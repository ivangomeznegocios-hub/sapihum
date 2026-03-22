-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 016_membership_levels
-- Adds numeric membership_level to profiles
-- ============================================

-- ============================================
-- 1. ADD membership_level COLUMN TO profiles
-- ============================================
-- Pure integer: 0 = free/registered, 1+  = paid tiers
-- Name mapping lives ONLY in application code (membership.ts)
ALTER TABLE public.profiles
    ADD COLUMN membership_level INTEGER NOT NULL DEFAULT 0;

-- Ensure non-negative values
ALTER TABLE public.profiles
    ADD CONSTRAINT membership_level_non_negative CHECK (membership_level >= 0);

-- ============================================
-- 2. MIGRATE EXISTING DATA
-- ============================================
-- Users with active subscription get level 1
UPDATE public.profiles
SET membership_level = 1
WHERE subscription_status IN ('active', 'trial')
  AND role = 'psychologist';

-- ============================================
-- 3. HELPER FUNCTION: Check minimum level (for RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_minimum_membership_level(
    check_user_id UUID,
    required_level INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND membership_level >= required_level
    );
END;
$$;

COMMENT ON FUNCTION public.has_minimum_membership_level IS
    'Check if a user has at least the required membership level. Use in RLS policies.';

-- ============================================
-- 4. INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_membership_level ON public.profiles(membership_level);
