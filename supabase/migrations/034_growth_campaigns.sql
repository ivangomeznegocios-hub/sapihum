-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 034_growth_campaigns
-- Admin-managed growth campaigns & promotions
-- ============================================

-- ============================================
-- 1. GROWTH CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.growth_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN (
        'referral_boost',   -- "Trae 3 amigos y gana X"
        'milestone',        -- "Alcanza 10 referidos"
        'promo',            -- Descuento temporal
        'challenge',        -- Reto comunitario
        'custom'            -- Cualquier otro
    )),
    reward_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Examples:
    -- { "reward_type": "credit", "amount": 50, "currency": "MXN", "trigger_count": 3 }
    -- { "reward_type": "discount", "percentage": 20, "applies_to": "subscription" }
    -- { "reward_type": "unlock", "resource_id": "xxx" }
    target_roles TEXT[] NOT NULL DEFAULT '{psychologist,ponente}'::text[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.growth_campaigns IS 'Admin-managed growth campaigns, promotions and challenges for the Growth Hub';

ALTER TABLE public.growth_campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Admins have full access
CREATE POLICY "Admins full access to growth campaigns"
ON public.growth_campaigns FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- All authenticated users can view active campaigns targeting their role
CREATE POLICY "Users can view active campaigns for their role"
ON public.growth_campaigns FOR SELECT
USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at > NOW())
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX idx_growth_campaigns_active ON public.growth_campaigns(is_active) WHERE is_active = true;
CREATE INDEX idx_growth_campaigns_dates ON public.growth_campaigns(starts_at, ends_at);
CREATE INDEX idx_growth_campaigns_sort ON public.growth_campaigns(sort_order);

-- ============================================
-- 4. AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_growth_campaign_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_growth_campaign_updated
    BEFORE UPDATE ON public.growth_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_growth_campaign_timestamp();
