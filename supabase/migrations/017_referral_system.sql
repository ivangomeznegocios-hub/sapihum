-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 017_referral_system
-- Extended profiles + Referral & Commission system
-- ============================================

-- ============================================
-- 1. EXTEND PROFILES WITH PROFESSIONAL FIELDS
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cedula_profesional TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS populations_served TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS therapeutic_approaches TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['Español'];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepts_referral_terms BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_terms_accepted_at TIMESTAMPTZ;

-- ============================================
-- 2. PLATFORM SETTINGS TABLE (admin toggles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'false'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default: referrals are admin-only (not public)
INSERT INTO public.platform_settings (key, value, description)
VALUES (
    'allow_public_referrals',
    'false'::jsonb,
    'When true, psychologists can refer directly to colleagues. When false, admin assigns all referrals.'
)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read platform settings"
ON public.platform_settings FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings"
ON public.platform_settings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can insert platform settings"
ON public.platform_settings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 3. REFERRALS TABLE
-- ============================================
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Who refers
    referring_psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Who receives (NULL until admin assigns or psychologist picks directly)
    receiving_psychologist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Patient info (not linked to profiles since patient may not be registered yet)
    patient_name TEXT NOT NULL,
    patient_age INTEGER,
    patient_contact TEXT,
    -- Clinical details
    reason TEXT NOT NULL,
    specialty_needed TEXT,
    population_type TEXT,
    urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'alta', 'urgente')),
    notes TEXT,
    -- Status workflow: pending → assigned → accepted → first_session_done → completed | cancelled
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'accepted', 'rejected',
        'first_session_done', 'completed', 'cancelled'
    )),
    -- Admin fields
    admin_notes TEXT,
    assigned_by UUID REFERENCES public.profiles(id),
    -- Timestamps
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    first_session_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.referrals IS 'Patient referrals between psychologists with admin oversight';

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. REFERRAL COMMISSIONS TABLE
-- ============================================
CREATE TABLE public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    -- Psychologist who REFERRED and receives the commission
    beneficiary_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Money
    session_price NUMERIC NOT NULL CHECK (session_price > 0),
    commission_rate NUMERIC NOT NULL DEFAULT 1.0 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    commission_amount NUMERIC GENERATED ALWAYS AS (session_price * commission_rate) STORED,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- One commission per referral
    UNIQUE(referral_id)
);

COMMENT ON TABLE public.referral_commissions IS '100% first-session commission for referring psychologist';

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR REFERRALS
-- ============================================

-- Psychologists can view referrals they sent
CREATE POLICY "Psychologists can view own sent referrals"
ON public.referrals FOR SELECT
USING (referring_psychologist_id = auth.uid());

-- Psychologists can view referrals assigned to them
CREATE POLICY "Psychologists can view received referrals"
ON public.referrals FOR SELECT
USING (receiving_psychologist_id = auth.uid());

-- Psychologists can create referrals (if they accepted terms)
CREATE POLICY "Psychologists can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (
    referring_psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'psychologist'
        AND accepts_referral_terms = true
    )
);

-- Psychologists can update referrals assigned to them (accept/reject)
CREATE POLICY "Receiving psychologist can update referral"
ON public.referrals FOR UPDATE
USING (receiving_psychologist_id = auth.uid())
WITH CHECK (receiving_psychologist_id = auth.uid());

-- Admins can do everything with referrals
CREATE POLICY "Admins full access to referrals"
ON public.referrals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 6. RLS POLICIES FOR COMMISSIONS
-- ============================================

-- Psychologists can view their own commissions
CREATE POLICY "Psychologists can view own commissions"
ON public.referral_commissions FOR SELECT
USING (beneficiary_id = auth.uid());

-- Admins can do everything with commissions
CREATE POLICY "Admins full access to commissions"
ON public.referral_commissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 7. AUTO-UPDATE updated_at TRIGGERS
-- ============================================
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_referrals_referring ON public.referrals(referring_psychologist_id);
CREATE INDEX idx_referrals_receiving ON public.referrals(receiving_psychologist_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_commissions_beneficiary ON public.referral_commissions(beneficiary_id);
CREATE INDEX idx_commissions_status ON public.referral_commissions(status);
CREATE INDEX idx_profiles_referral_terms ON public.profiles(accepts_referral_terms) WHERE accepts_referral_terms = true;

-- ============================================
-- 9. HELPER: Check if public referrals are enabled
-- ============================================
CREATE OR REPLACE FUNCTION public.are_public_referrals_enabled()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT value::text::boolean FROM public.platform_settings WHERE key = 'allow_public_referrals'),
        false
    );
END;
$$;

COMMENT ON FUNCTION public.are_public_referrals_enabled IS
    'Check if psychologists can directly refer to colleagues (admin toggle)';
