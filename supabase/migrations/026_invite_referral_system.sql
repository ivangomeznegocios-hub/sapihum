-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 026_invite_referral_system
-- Invite/Growth referral system (separate from clinical referrals)
-- ============================================

-- ============================================
-- 1. HELPER: Generate short invite codes
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_invite_code(length INT DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I/O/0/1 to avoid confusion
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.generate_invite_code IS
    'Generate a short alphanumeric invite code (avoids ambiguous chars like I/O/0/1)';

-- ============================================
-- 2. INVITE CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE DEFAULT public.generate_invite_code(8),
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER, -- NULL = unlimited
    use_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb, -- campaign, channel, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- NULL = never expires
);

COMMENT ON TABLE public.invite_codes IS 'Unique invite/referral codes for each user (growth system)';

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. INVITE ATTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invite_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    -- Each user can only be referred once
    UNIQUE(referred_id)
);

COMMENT ON TABLE public.invite_attributions IS 'Tracks who invited whom via invite codes';

ALTER TABLE public.invite_attributions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. INVITE REWARD EVENTS TABLE (reward-agnostic)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invite_reward_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribution_id UUID NOT NULL REFERENCES public.invite_attributions(id) ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('credit', 'discount', 'unlock', 'commission', 'custom')),
    reward_value JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "amount": 100, "currency": "MXN" } or { "course_id": "xxx" }
    trigger_event TEXT NOT NULL, -- 'signup', 'first_purchase', 'subscription', 'event_purchase', etc.
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.invite_reward_events IS 'Reward-agnostic log for invite referral rewards';

ALTER TABLE public.invite_reward_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. AUTO-INCREMENT use_count ON ATTRIBUTION
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_invite_use_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.invite_codes
    SET use_count = use_count + 1
    WHERE id = NEW.invite_code_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_invite_use_count
    AFTER INSERT ON public.invite_attributions
    FOR EACH ROW EXECUTE FUNCTION public.increment_invite_use_count();

-- ============================================
-- 6. RLS POLICIES — INVITE CODES
-- ============================================

-- Users can view their own invite codes
CREATE POLICY "Users can view own invite codes"
ON public.invite_codes FOR SELECT
USING (owner_id = auth.uid());

-- Users can create their own invite codes
CREATE POLICY "Users can create own invite codes"
ON public.invite_codes FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Users can update their own invite codes (toggle is_active, etc.)
CREATE POLICY "Users can update own invite codes"
ON public.invite_codes FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to invite codes"
ON public.invite_codes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Anyone can look up a code (needed for registration validation)
CREATE POLICY "Anyone can look up invite codes by code"
ON public.invite_codes FOR SELECT
USING (true);

-- ============================================
-- 7. RLS POLICIES — INVITE ATTRIBUTIONS
-- ============================================

-- Users can view attributions where they are the referrer
CREATE POLICY "Referrers can view their attributions"
ON public.invite_attributions FOR SELECT
USING (referrer_id = auth.uid());

-- Users can view their own attribution (as referred)
CREATE POLICY "Referred users can view own attribution"
ON public.invite_attributions FOR SELECT
USING (referred_id = auth.uid());

-- Service role / admin inserts (attributions are created server-side)
CREATE POLICY "Admins full access to invite attributions"
ON public.invite_attributions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 8. RLS POLICIES — INVITE REWARD EVENTS
-- ============================================

-- Users can view their own reward events
CREATE POLICY "Users can view own reward events"
ON public.invite_reward_events FOR SELECT
USING (beneficiary_id = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to invite reward events"
ON public.invite_reward_events FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_invite_codes_owner ON public.invite_codes(owner_id);
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_active ON public.invite_codes(is_active) WHERE is_active = true;

CREATE INDEX idx_invite_attributions_referrer ON public.invite_attributions(referrer_id);
CREATE INDEX idx_invite_attributions_referred ON public.invite_attributions(referred_id);
CREATE INDEX idx_invite_attributions_code ON public.invite_attributions(invite_code_id);
CREATE INDEX idx_invite_attributions_status ON public.invite_attributions(status);

CREATE INDEX idx_invite_reward_events_attribution ON public.invite_reward_events(attribution_id);
CREATE INDEX idx_invite_reward_events_beneficiary ON public.invite_reward_events(beneficiary_id);
CREATE INDEX idx_invite_reward_events_processed ON public.invite_reward_events(processed) WHERE processed = false;

-- ============================================
-- 10. HELPER: Validate an invite code
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code TEXT)
RETURNS TABLE (
    code_id UUID,
    code_owner_id UUID,
    is_valid BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_code RECORD;
BEGIN
    SELECT * INTO v_code
    FROM public.invite_codes ic
    WHERE ic.code = UPPER(p_code)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Código no encontrado'::TEXT;
        RETURN;
    END IF;

    IF NOT v_code.is_active THEN
        RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código desactivado'::TEXT;
        RETURN;
    END IF;

    IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN
        RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código expirado'::TEXT;
        RETURN;
    END IF;

    IF v_code.max_uses IS NOT NULL AND v_code.use_count >= v_code.max_uses THEN
        RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código agotado'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT v_code.id, v_code.owner_id, true, 'Código válido'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.validate_invite_code IS
    'Validate an invite code and return its status with the owner ID';
