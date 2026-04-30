-- ============================================
-- COMUNIDAD DE PSICOLOGIA - DATABASE SCHEMA
-- Migration: 20260429000000_growth_reward_grants
-- Live state for automatic professional invite rewards
-- ============================================

CREATE TABLE IF NOT EXISTS public.growth_reward_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.growth_campaigns(id) ON DELETE CASCADE,
    program_type TEXT NOT NULL DEFAULT 'professional_invite'
        CHECK (program_type IN ('professional_invite')),
    qualifying_attribution_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    status TEXT NOT NULL DEFAULT 'qualified_not_applied'
        CHECK (status IN ('applied', 'qualified_not_applied', 'revoked', 'sync_error')),
    qualified_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    resolved_benefit JSONB NOT NULL DEFAULT '{}'::jsonb,
    stripe_subscription_id TEXT,
    stripe_coupon_id TEXT,
    stripe_discount_id TEXT,
    original_subscription_item_id TEXT,
    original_price_id TEXT,
    original_membership_level INTEGER,
    original_specialization_code TEXT,
    auto_upgraded BOOLEAN NOT NULL DEFAULT false,
    last_evaluated_at TIMESTAMPTZ,
    last_stripe_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (beneficiary_id, campaign_id)
);

COMMENT ON TABLE public.growth_reward_grants IS
    'Live grant state for automatic professional invite reward programs. invite_reward_events remains the audit/history log.';

CREATE INDEX IF NOT EXISTS idx_growth_reward_grants_beneficiary
    ON public.growth_reward_grants(beneficiary_id);

CREATE INDEX IF NOT EXISTS idx_growth_reward_grants_campaign
    ON public.growth_reward_grants(campaign_id);

CREATE INDEX IF NOT EXISTS idx_growth_reward_grants_status
    ON public.growth_reward_grants(status);

CREATE INDEX IF NOT EXISTS idx_growth_reward_grants_program_type
    ON public.growth_reward_grants(program_type);

ALTER TABLE public.growth_reward_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own growth reward grants"
ON public.growth_reward_grants FOR SELECT
USING (beneficiary_id = auth.uid());

CREATE POLICY "Admins full access to growth reward grants"
ON public.growth_reward_grants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.update_growth_reward_grants_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_growth_reward_grants_updated ON public.growth_reward_grants;
CREATE TRIGGER trg_growth_reward_grants_updated
    BEFORE UPDATE ON public.growth_reward_grants
    FOR EACH ROW EXECUTE FUNCTION public.update_growth_reward_grants_timestamp();
