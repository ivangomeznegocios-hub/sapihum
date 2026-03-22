-- ============================================
-- COMUNIDAD DE PSICOLOGIA - DATABASE SCHEMA
-- Migration: 043_professional_invite_reward_types
-- Expand reward types for professional invite campaigns
-- ============================================

ALTER TABLE public.invite_reward_events
DROP CONSTRAINT IF EXISTS invite_reward_events_reward_type_check;

ALTER TABLE public.invite_reward_events
ADD CONSTRAINT invite_reward_events_reward_type_check
CHECK (
    reward_type IN (
        'credit',
        'discount',
        'unlock',
        'commission',
        'cash_bonus',
        'membership_benefit',
        'custom'
    )
);
