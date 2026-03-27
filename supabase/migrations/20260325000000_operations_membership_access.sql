-- ============================================
-- Migration 20260325000000: Operations backoffice + membership-derived access
-- ============================================

ALTER TABLE public.event_entitlements
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE public.event_entitlements
    DROP CONSTRAINT IF EXISTS event_entitlements_source_type_check;

ALTER TABLE public.event_entitlements
    ADD CONSTRAINT event_entitlements_source_type_check
    CHECK (
        source_type IN (
            'registration',
            'purchase',
            'membership',
            'manual',
            'support',
            'gift',
            'alliance',
            'migration'
        )
    );

CREATE INDEX IF NOT EXISTS idx_event_entitlements_source_reference
    ON public.event_entitlements (source_type, source_reference);

CREATE TABLE IF NOT EXISTS public.admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_email TEXT,
    reason TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_operation_logs IS 'Audit trail for manual operational actions performed by admins.';

ALTER TABLE public.admin_operation_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_target_user
    ON public.admin_operation_logs (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_target_email
    ON public.admin_operation_logs (LOWER(BTRIM(COALESCE(target_email, ''))), created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_operation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_email TEXT,
    note TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_operation_notes IS 'Internal notes used by support and admin teams for commerce/access cases.';

ALTER TABLE public.admin_operation_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_operation_notes_target_user
    ON public.admin_operation_notes (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_operation_notes_target_email
    ON public.admin_operation_notes (LOWER(BTRIM(COALESCE(target_email, ''))), created_at DESC);

CREATE TABLE IF NOT EXISTS public.membership_entitlement_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_level INTEGER NOT NULL CHECK (membership_level >= 1),
    specialization_code TEXT,
    scope_type TEXT NOT NULL
        CHECK (scope_type IN ('event_audience', 'event_category', 'event', 'discount')),
    benefit_type TEXT NOT NULL DEFAULT 'access'
        CHECK (benefit_type IN ('access', 'discount')),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    event_category TEXT,
    required_audience TEXT,
    discount_percent NUMERIC(5, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT membership_entitlement_rules_scope_required CHECK (
        (scope_type = 'event' AND event_id IS NOT NULL)
        OR (scope_type = 'event_category' AND event_category IS NOT NULL)
        OR (scope_type = 'event_audience' AND required_audience IS NOT NULL)
        OR (scope_type = 'discount' AND discount_percent IS NOT NULL)
    )
);

COMMENT ON TABLE public.membership_entitlement_rules IS 'Rules that derive access or future commercial benefits from an active membership plan.';

ALTER TABLE public.membership_entitlement_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_membership_entitlement_rules_membership
    ON public.membership_entitlement_rules (membership_level, is_active);

CREATE TABLE IF NOT EXISTS public.certificate_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_purchase BOOLEAN NOT NULL DEFAULT false,
    requires_attendance BOOLEAN NOT NULL DEFAULT false,
    min_attendance_percent NUMERIC(5, 2),
    requires_progress BOOLEAN NOT NULL DEFAULT false,
    min_progress_percent NUMERIC(5, 2),
    requires_evaluation BOOLEAN NOT NULL DEFAULT false,
    min_evaluation_score NUMERIC(6, 2),
    requires_active_membership BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT certificate_rules_event_unique UNIQUE (event_id)
);

COMMENT ON TABLE public.certificate_rules IS 'Certificate and eligibility requirements for events, courses and recordings.';

ALTER TABLE public.certificate_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.certificate_eligibility_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    identity_key TEXT GENERATED ALWAYS AS (LOWER(BTRIM(email))) STORED,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'eligible', 'ineligible', 'issued', 'revoked')),
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.certificate_eligibility_snapshots IS 'Stored eligibility results for future certificate issuance flows.';

ALTER TABLE public.certificate_eligibility_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_certificate_eligibility_user
    ON public.certificate_eligibility_snapshots (user_id, evaluated_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificate_eligibility_event
    ON public.certificate_eligibility_snapshots (event_id, evaluated_at DESC);

DROP TRIGGER IF EXISTS update_admin_operation_notes_updated_at ON public.admin_operation_notes;
CREATE TRIGGER update_admin_operation_notes_updated_at
    BEFORE UPDATE ON public.admin_operation_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_membership_entitlement_rules_updated_at ON public.membership_entitlement_rules;
CREATE TRIGGER update_membership_entitlement_rules_updated_at
    BEFORE UPDATE ON public.membership_entitlement_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificate_rules_updated_at ON public.certificate_rules;
CREATE TRIGGER update_certificate_rules_updated_at
    BEFORE UPDATE ON public.certificate_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_certificate_eligibility_snapshots_updated_at ON public.certificate_eligibility_snapshots;
CREATE TRIGGER update_certificate_eligibility_snapshots_updated_at
    BEFORE UPDATE ON public.certificate_eligibility_snapshots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins full access to admin operation logs" ON public.admin_operation_logs;
CREATE POLICY "Admins full access to admin operation logs"
    ON public.admin_operation_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to admin operation notes" ON public.admin_operation_notes;
CREATE POLICY "Admins full access to admin operation notes"
    ON public.admin_operation_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to membership entitlement rules" ON public.membership_entitlement_rules;
CREATE POLICY "Admins full access to membership entitlement rules"
    ON public.membership_entitlement_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to certificate rules" ON public.certificate_rules;
CREATE POLICY "Admins full access to certificate rules"
    ON public.certificate_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to certificate eligibility snapshots" ON public.certificate_eligibility_snapshots;
CREATE POLICY "Admins full access to certificate eligibility snapshots"
    ON public.certificate_eligibility_snapshots FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

INSERT INTO public.membership_entitlement_rules (
    membership_level,
    scope_type,
    benefit_type,
    required_audience,
    metadata
)
SELECT
    1,
    'event_audience',
    'access',
    'members',
    jsonb_build_object(
        'seed', '20260325000000_operations_membership_access',
        'note', 'Default rule: active memberships grant access to events tagged for members.'
    )
WHERE NOT EXISTS (
    SELECT 1
    FROM public.membership_entitlement_rules
    WHERE membership_level = 1
      AND scope_type = 'event_audience'
      AND benefit_type = 'access'
      AND required_audience = 'members'
);
