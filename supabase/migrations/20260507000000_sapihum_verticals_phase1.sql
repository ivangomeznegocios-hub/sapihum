-- SAPIHUM multi-vertical phase 1.
-- Creates the core vertical model and assigns the existing product surface to Psicologia.

CREATE TABLE IF NOT EXISTS public.verticals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT verticals_code_allowed CHECK (code IN ('psicologia', 'ciencias_forenses')),
    CONSTRAINT verticals_status_allowed CHECK (status IN ('active', 'hidden', 'archived'))
);

INSERT INTO public.verticals (code, slug, name, status)
VALUES
    ('psicologia', 'psicologia', 'Psicologia', 'active'),
    ('ciencias_forenses', 'ciencias-forenses', 'Ciencias Forenses', 'active')
ON CONFLICT (code) DO UPDATE
SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.user_vertical_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
    vertical_role TEXT NOT NULL DEFAULT 'member',
    access_status TEXT NOT NULL DEFAULT 'interested',
    membership_level INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_vertical_access_role_allowed CHECK (vertical_role IN ('member', 'instructor', 'admin', 'support')),
    CONSTRAINT user_vertical_access_status_allowed CHECK (access_status IN ('interested', 'active', 'inactive', 'suspended')),
    CONSTRAINT user_vertical_access_membership_level_allowed CHECK (membership_level BETWEEN 0 AND 3),
    CONSTRAINT user_vertical_access_user_vertical_unique UNIQUE (user_id, vertical_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_vertical_access_one_default
    ON public.user_vertical_access (user_id)
    WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_user_vertical_access_user
    ON public.user_vertical_access (user_id);

CREATE INDEX IF NOT EXISTS idx_user_vertical_access_vertical
    ON public.user_vertical_access (vertical_id);

CREATE INDEX IF NOT EXISTS idx_user_vertical_access_status
    ON public.user_vertical_access (access_status);

DROP TRIGGER IF EXISTS update_verticals_updated_at ON public.verticals;
CREATE TRIGGER update_verticals_updated_at
    BEFORE UPDATE ON public.verticals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_vertical_access_updated_at ON public.user_vertical_access;
CREATE TRIGGER update_user_vertical_access_updated_at
    BEFORE UPDATE ON public.user_vertical_access
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vertical_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'verticals'
          AND policyname = 'Anyone can read active verticals'
    ) THEN
        CREATE POLICY "Anyone can read active verticals"
            ON public.verticals
            FOR SELECT
            USING (status = 'active');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'verticals'
          AND policyname = 'Admins full access to verticals'
    ) THEN
        CREATE POLICY "Admins full access to verticals"
            ON public.verticals
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_vertical_access'
          AND policyname = 'Users can read own vertical access'
    ) THEN
        CREATE POLICY "Users can read own vertical access"
            ON public.user_vertical_access
            FOR SELECT
            USING (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'user_vertical_access'
          AND policyname = 'Admins full access to user vertical access'
    ) THEN
        CREATE POLICY "Admins full access to user vertical access"
            ON public.user_vertical_access
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

INSERT INTO public.user_vertical_access (
    user_id,
    vertical_id,
    vertical_role,
    access_status,
    membership_level,
    is_default
)
SELECT
    profiles.id,
    verticals.id,
    CASE
        WHEN profiles.role = 'admin' THEN 'admin'
        WHEN profiles.role = 'support' THEN 'support'
        WHEN profiles.role = 'ponente' THEN 'instructor'
        ELSE 'member'
    END,
    CASE
        WHEN profiles.subscription_status IN ('trial', 'active', 'past_due') OR profiles.membership_level > 0 THEN 'active'
        ELSE 'inactive'
    END,
    LEAST(GREATEST(COALESCE(profiles.membership_level, 0), 0), 3),
    true
FROM public.profiles
CROSS JOIN public.verticals
WHERE verticals.code = 'psicologia'
ON CONFLICT (user_id, vertical_id) DO UPDATE
SET
    vertical_role = EXCLUDED.vertical_role,
    access_status = EXCLUDED.access_status,
    membership_level = EXCLUDED.membership_level,
    is_default = COALESCE(public.user_vertical_access.is_default, EXCLUDED.is_default),
    updated_at = NOW();

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'events',
        'formations',
        'subscriptions',
        'event_purchases',
        'formation_purchases'
    ]
    LOOP
        EXECUTE FORMAT('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS primary_vertical_id UUID REFERENCES public.verticals(id)', table_name);
        EXECUTE FORMAT('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS content_scope TEXT DEFAULT ''global''', table_name);
    END LOOP;
END $$;

UPDATE public.events
SET
    primary_vertical_id = CASE
        WHEN specialization_code = 'forense' THEN (SELECT id FROM public.verticals WHERE code = 'ciencias_forenses')
        ELSE (SELECT id FROM public.verticals WHERE code = 'psicologia')
    END,
    content_scope = 'vertical'
WHERE primary_vertical_id IS NULL;

UPDATE public.formations
SET
    primary_vertical_id = CASE
        WHEN specialization_code = 'forense' THEN (SELECT id FROM public.verticals WHERE code = 'ciencias_forenses')
        ELSE (SELECT id FROM public.verticals WHERE code = 'psicologia')
    END,
    content_scope = 'vertical'
WHERE primary_vertical_id IS NULL;

UPDATE public.subscriptions
SET
    primary_vertical_id = CASE
        WHEN specialization_code = 'forense' THEN (SELECT id FROM public.verticals WHERE code = 'ciencias_forenses')
        ELSE (SELECT id FROM public.verticals WHERE code = 'psicologia')
    END,
    content_scope = 'vertical'
WHERE primary_vertical_id IS NULL;

UPDATE public.event_purchases AS purchases
SET
    primary_vertical_id = COALESCE(events.primary_vertical_id, (SELECT id FROM public.verticals WHERE code = 'psicologia')),
    content_scope = COALESCE(events.content_scope, 'vertical')
FROM public.events
WHERE purchases.event_id = events.id
  AND purchases.primary_vertical_id IS NULL;

UPDATE public.formation_purchases AS purchases
SET
    primary_vertical_id = COALESCE(formations.primary_vertical_id, (SELECT id FROM public.verticals WHERE code = 'psicologia')),
    content_scope = COALESCE(formations.content_scope, 'vertical')
FROM public.formations
WHERE purchases.formation_id = formations.id
  AND purchases.primary_vertical_id IS NULL;

UPDATE public.event_purchases
SET
    primary_vertical_id = (SELECT id FROM public.verticals WHERE code = 'psicologia'),
    content_scope = 'vertical'
WHERE primary_vertical_id IS NULL;

UPDATE public.formation_purchases
SET
    primary_vertical_id = (SELECT id FROM public.verticals WHERE code = 'psicologia'),
    content_scope = 'vertical'
WHERE primary_vertical_id IS NULL;

DO $$
DECLARE
    table_name TEXT;
    constraint_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'events',
        'formations',
        'subscriptions',
        'event_purchases',
        'formation_purchases'
    ]
    LOOP
        EXECUTE FORMAT('ALTER TABLE public.%I ALTER COLUMN content_scope SET NOT NULL', table_name);

        constraint_name := table_name || '_content_scope_allowed';
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = constraint_name
        ) THEN
            EXECUTE FORMAT(
                'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (content_scope IN (''global'', ''vertical'', ''cross_vertical''))',
                table_name,
                constraint_name
            );
        END IF;

        constraint_name := table_name || '_content_scope_vertical_consistency';
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = constraint_name
        ) THEN
            EXECUTE FORMAT(
                'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK ((content_scope = ''global'' AND primary_vertical_id IS NULL) OR (content_scope IN (''vertical'', ''cross_vertical'') AND primary_vertical_id IS NOT NULL))',
                table_name,
                constraint_name
            );
        END IF;

        EXECUTE FORMAT('CREATE INDEX IF NOT EXISTS idx_%I_primary_vertical ON public.%I (primary_vertical_id) WHERE primary_vertical_id IS NOT NULL', table_name, table_name);
        EXECUTE FORMAT('CREATE INDEX IF NOT EXISTS idx_%I_content_scope ON public.%I (content_scope)', table_name, table_name);
    END LOOP;
END $$;

COMMENT ON TABLE public.verticals IS 'Commercial product verticals for SAPIHUM.';
COMMENT ON TABLE public.user_vertical_access IS 'Per-user access, role and membership level by SAPIHUM vertical.';
