-- ============================================
-- COMUNIDAD DE PSICOLOGIA - DATABASE SCHEMA
-- Migration: 042_referral_growth_domain_separation
-- Separate clinical patient referrals from professional invite economics
-- ============================================

-- ============================================
-- 1. CLINICAL REFERRALS: NO ECONOMIC STATUS
-- ============================================
ALTER TABLE public.referrals
    ADD COLUMN IF NOT EXISTS referral_domain TEXT NOT NULL DEFAULT 'clinical_referral',
    ADD COLUMN IF NOT EXISTS handoff_completed_at TIMESTAMPTZ;

UPDATE public.referrals
SET
    status = 'handoff_completed',
    handoff_completed_at = COALESCE(first_session_at, completed_at, updated_at, NOW())
WHERE status = 'first_session_done';

ALTER TABLE public.referrals
    DROP CONSTRAINT IF EXISTS referrals_status_check;

ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_status_check CHECK (status IN (
        'pending', 'assigned', 'accepted', 'rejected',
        'handoff_completed', 'completed', 'cancelled'
    ));

ALTER TABLE public.referrals
    DROP CONSTRAINT IF EXISTS referrals_referral_domain_check;

ALTER TABLE public.referrals
    ADD CONSTRAINT referrals_referral_domain_check CHECK (
        referral_domain IN ('clinical_referral')
    );

COMMENT ON COLUMN public.referrals.referral_domain IS
    'Separates patient care referrals from growth/invite programs';

COMMENT ON COLUMN public.referrals.handoff_completed_at IS
    'Timestamp when the clinical transfer of care was completed';

CREATE INDEX IF NOT EXISTS idx_referrals_domain ON public.referrals(referral_domain);
CREATE INDEX IF NOT EXISTS idx_referrals_handoff_completed_at ON public.referrals(handoff_completed_at);

-- ============================================
-- 2. INVITE ATTRIBUTIONS: EXPLICIT PROFESSIONAL PROGRAM
-- ============================================
ALTER TABLE public.invite_attributions
    ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'professional_invite';

UPDATE public.invite_attributions
SET program_type = 'professional_invite'
WHERE program_type IS NULL;

ALTER TABLE public.invite_attributions
    DROP CONSTRAINT IF EXISTS invite_attributions_program_type_check;

ALTER TABLE public.invite_attributions
    ADD CONSTRAINT invite_attributions_program_type_check CHECK (
        program_type IN ('professional_invite')
    );

COMMENT ON COLUMN public.invite_attributions.program_type IS
    'Program origin for invite attribution events';

CREATE INDEX IF NOT EXISTS idx_invite_attributions_program_type
    ON public.invite_attributions(program_type);

-- ============================================
-- 3. INVITE REWARD EVENTS: EXPLICIT PROFESSIONAL PROGRAM
-- ============================================
ALTER TABLE public.invite_reward_events
    ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'professional_invite';

UPDATE public.invite_reward_events
SET program_type = 'professional_invite'
WHERE program_type IS NULL;

ALTER TABLE public.invite_reward_events
    DROP CONSTRAINT IF EXISTS invite_reward_events_program_type_check;

ALTER TABLE public.invite_reward_events
    ADD CONSTRAINT invite_reward_events_program_type_check CHECK (
        program_type IN ('professional_invite')
    );

COMMENT ON COLUMN public.invite_reward_events.program_type IS
    'Program origin for reward events. Clinical patient referrals must never write here';

CREATE INDEX IF NOT EXISTS idx_invite_reward_events_program_type
    ON public.invite_reward_events(program_type);

-- ============================================
-- 4. GROWTH CAMPAIGNS: CLEAR ELIGIBILITY RULES
-- ============================================
ALTER TABLE public.growth_campaigns
    ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'professional_invite',
    ADD COLUMN IF NOT EXISTS eligible_referrer_roles TEXT[] NOT NULL DEFAULT '{psychologist,ponente}'::text[],
    ADD COLUMN IF NOT EXISTS eligible_referred_roles TEXT[] NOT NULL DEFAULT '{psychologist}'::text[],
    ADD COLUMN IF NOT EXISTS allowed_trigger_events TEXT[] NOT NULL DEFAULT '{signup,profile_completed,subscription,first_purchase}'::text[];

UPDATE public.growth_campaigns
SET program_type = 'professional_invite'
WHERE program_type IS NULL;

ALTER TABLE public.growth_campaigns
    DROP CONSTRAINT IF EXISTS growth_campaigns_program_type_check;

ALTER TABLE public.growth_campaigns
    ADD CONSTRAINT growth_campaigns_program_type_check CHECK (
        program_type IN ('professional_invite')
    );

COMMENT ON COLUMN public.growth_campaigns.program_type IS
    'Program domain targeted by the campaign';

COMMENT ON COLUMN public.growth_campaigns.eligible_referrer_roles IS
    'Roles that can generate rewards by inviting professionals';

COMMENT ON COLUMN public.growth_campaigns.eligible_referred_roles IS
    'Roles that qualify as invited professionals for this campaign';

COMMENT ON COLUMN public.growth_campaigns.allowed_trigger_events IS
    'Trigger events that can activate campaign rewards';

CREATE INDEX IF NOT EXISTS idx_growth_campaigns_program_type
    ON public.growth_campaigns(program_type);
