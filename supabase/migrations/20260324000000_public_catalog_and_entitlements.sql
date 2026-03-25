-- ============================================
-- Migration 20260324000000: Public catalog routes + event entitlements
-- ============================================

CREATE OR REPLACE FUNCTION public.slugify_catalog_text(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := LOWER(
        TRANSLATE(
            COALESCE(input, ''),
            'ÁÀÄÂáàäâÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔóòöôÚÙÜÛúùüûÑñÇç',
            'AAAAaaaaEEEEeeeeIIIIiiiiOOOOooooUUUUuuuuNnCc'
        )
    );

    normalized := REGEXP_REPLACE(normalized, '[^a-z0-9]+', '-', 'g');
    normalized := REGEXP_REPLACE(normalized, '(^-+|-+$)', '', 'g');

    RETURN NULLIF(normalized, '');
END;
$$;

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS hero_badge TEXT,
    ADD COLUMN IF NOT EXISTS public_cta_label TEXT;

WITH ranked AS (
    SELECT
        id,
        COALESCE(
            NULLIF(slug, ''),
            public.slugify_catalog_text(title),
            'evento-' || LEFT(id::TEXT, 8)
        ) AS base_slug,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
                NULLIF(slug, ''),
                public.slugify_catalog_text(title),
                'evento-' || LEFT(id::TEXT, 8)
            )
            ORDER BY created_at, id
        ) AS duplicate_rank
    FROM public.events
)
UPDATE public.events AS events
SET slug = CASE
    WHEN ranked.duplicate_rank = 1 THEN ranked.base_slug
    ELSE ranked.base_slug || '-' || ranked.duplicate_rank
END
FROM ranked
WHERE events.id = ranked.id
  AND (
    events.slug IS NULL
    OR events.slug = ''
    OR events.slug <> CASE
        WHEN ranked.duplicate_rank = 1 THEN ranked.base_slug
        ELSE ranked.base_slug || '-' || ranked.duplicate_rank
    END
  );

ALTER TABLE public.events
    ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug_unique
    ON public.events (slug);

CREATE INDEX IF NOT EXISTS idx_events_public_catalog
    ON public.events (event_type, status, start_time);

ALTER TABLE public.event_purchases
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS provider_session_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_event_purchases_user_id
    ON public.event_purchases (user_id)
    WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.event_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    identity_key TEXT GENERATED ALWAYS AS (LOWER(BTRIM(email))) STORED,
    access_kind TEXT NOT NULL
        CHECK (access_kind IN (
            'live_access',
            'replay_access',
            'course_access',
            'membership_benefit',
            'bundle_child_access',
            'certificate_eligibility',
            'manual_support_grant'
        )),
    source_type TEXT NOT NULL
        CHECK (source_type IN ('registration', 'purchase', 'membership', 'manual')),
    source_reference TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'revoked')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT event_entitlements_unique_grant UNIQUE (event_id, access_kind, identity_key, source_type)
);

COMMENT ON TABLE public.event_entitlements IS 'Event-level access grants for full accounts, light accounts, memberships and manual support actions.';

ALTER TABLE public.event_entitlements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_entitlements_user
    ON public.event_entitlements (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_entitlements_email
    ON public.event_entitlements (identity_key);

CREATE INDEX IF NOT EXISTS idx_event_entitlements_event_status
    ON public.event_entitlements (event_id, status, ends_at);

DROP POLICY IF EXISTS "Admins full access to event entitlements" ON public.event_entitlements;
CREATE POLICY "Admins full access to event entitlements"
    ON public.event_entitlements FOR ALL
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

DROP POLICY IF EXISTS "Users can view matching entitlements" ON public.event_entitlements;
CREATE POLICY "Users can view matching entitlements"
    ON public.event_entitlements FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND LOWER(BTRIM(COALESCE(email, ''))) = public.event_entitlements.identity_key
        )
    );

DROP POLICY IF EXISTS "Users can create own entitlements" ON public.event_entitlements;
CREATE POLICY "Users can create own entitlements"
    ON public.event_entitlements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can claim matching entitlements" ON public.event_entitlements;
CREATE POLICY "Users can claim matching entitlements"
    ON public.event_entitlements FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND LOWER(BTRIM(COALESCE(email, ''))) = public.event_entitlements.identity_key
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND LOWER(BTRIM(COALESCE(email, ''))) = public.event_entitlements.identity_key
        )
    );

DROP TRIGGER IF EXISTS update_event_entitlements_updated_at ON public.event_entitlements;
CREATE TRIGGER update_event_entitlements_updated_at
    BEFORE UPDATE ON public.event_entitlements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.event_entitlements (
    event_id,
    user_id,
    email,
    access_kind,
    source_type,
    source_reference,
    starts_at,
    ends_at,
    metadata
)
SELECT
    registrations.event_id,
    registrations.user_id,
    profiles.email,
    CASE
        WHEN events.event_type = 'course' THEN 'course_access'
        WHEN events.event_type = 'on_demand' THEN 'replay_access'
        ELSE 'live_access'
    END,
    'registration',
    registrations.id::TEXT,
    COALESCE(registrations.registered_at, NOW()),
    CASE
        WHEN events.event_type = 'on_demand' THEN events.recording_expires_at
        ELSE NULL
    END,
    JSONB_BUILD_OBJECT(
        'migration', '20260324000000_public_catalog_and_entitlements',
        'registration_data', COALESCE(registrations.registration_data, '{}'::jsonb)
    )
FROM public.event_registrations AS registrations
INNER JOIN public.events AS events
    ON events.id = registrations.event_id
INNER JOIN public.profiles AS profiles
    ON profiles.id = registrations.user_id
WHERE registrations.status = 'registered'
  AND profiles.email IS NOT NULL
ON CONFLICT (event_id, access_kind, identity_key, source_type) DO NOTHING;
