-- ============================================
-- Migration: Real support for formations
-- Adds explicit member pricing mode, total hours,
-- and persisted formation certificates.
-- ============================================

ALTER TABLE public.formations
    ADD COLUMN IF NOT EXISTS bundle_member_access_type TEXT NOT NULL DEFAULT 'full_price'
        CHECK (bundle_member_access_type IN ('free', 'discounted', 'full_price')),
    ADD COLUMN IF NOT EXISTS total_hours DECIMAL(6,2) NOT NULL DEFAULT 0;

UPDATE public.formations
SET bundle_member_access_type = 'discounted'
WHERE bundle_member_access_type = 'full_price'
  AND COALESCE(bundle_member_price, 0) > 0
  AND COALESCE(bundle_member_price, 0) < COALESCE(bundle_price, 0);

CREATE TABLE IF NOT EXISTS public.formation_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    identity_key TEXT NOT NULL,
    scope_type TEXT NOT NULL
        CHECK (scope_type IN ('individual_course', 'full_program')),
    scope_reference TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    certificate_type TEXT NOT NULL
        CHECK (certificate_type IN ('participation', 'completion', 'specialized')),
    label TEXT NOT NULL,
    issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (formation_id, scope_type, scope_reference, identity_key)
);

COMMENT ON TABLE public.formation_certificates IS 'Persisted certificates issued for formation bundles and their individual courses';

ALTER TABLE public.formation_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own formation certificates" ON public.formation_certificates;
CREATE POLICY "Users can see own formation certificates"
    ON public.formation_certificates FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to formation certificates" ON public.formation_certificates;
CREATE POLICY "Admins full access to formation certificates"
    ON public.formation_certificates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE INDEX IF NOT EXISTS idx_formations_member_access_type
    ON public.formations(bundle_member_access_type);

CREATE INDEX IF NOT EXISTS idx_formations_total_hours
    ON public.formations(total_hours);

CREATE INDEX IF NOT EXISTS idx_formation_certificates_formation
    ON public.formation_certificates(formation_id);

CREATE INDEX IF NOT EXISTS idx_formation_certificates_identity
    ON public.formation_certificates(identity_key);

CREATE INDEX IF NOT EXISTS idx_formation_certificates_scope
    ON public.formation_certificates(scope_type, scope_reference);

NOTIFY pgrst, 'reload schema';
