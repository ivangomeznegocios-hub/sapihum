CREATE TABLE IF NOT EXISTS public.organic_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    email_key TEXT GENERATED ALWAYS AS (LOWER(email)) STORED,
    name TEXT NOT NULL,
    whatsapp TEXT,
    country TEXT,
    city TEXT,
    role TEXT,
    specialty TEXT,
    years_experience INTEGER,
    interest_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    intent TEXT NOT NULL DEFAULT 'learn',
    source_page TEXT NOT NULL,
    source_topic TEXT,
    source_asset TEXT,
    source_type TEXT NOT NULL DEFAULT 'resource',
    utms JSONB NOT NULL DEFAULT '{}'::jsonb,
    referrer TEXT,
    score INTEGER NOT NULL DEFAULT 0,
    lifecycle_stage TEXT NOT NULL DEFAULT 'captured',
    attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_engagement_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_engagement_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organic_leads_email_required CHECK (length(btrim(email)) > 3),
    CONSTRAINT organic_leads_name_required CHECK (length(btrim(name)) > 1),
    CONSTRAINT organic_leads_score_non_negative CHECK (score >= 0),
    CONSTRAINT organic_leads_years_experience_valid CHECK (
        years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 80)
    ),
    CONSTRAINT organic_leads_intent_allowed CHECK (
        intent IN (
            'learn',
            'download_resource',
            'attend_event',
            'explore_formation',
            'join_community',
            'evaluate_membership',
            'commercial_interest',
            'purchase_intent'
        )
    ),
    CONSTRAINT organic_leads_source_type_allowed CHECK (
        source_type IN (
            'guide',
            'resource',
            'resource_format',
            'resource_scale',
            'author',
            'book',
            'approach',
            'tool',
            'psychologist',
            'event',
            'formation',
            'specialty',
            'community',
            'academy'
        )
    ),
    CONSTRAINT organic_leads_lifecycle_stage_allowed CHECK (
        lifecycle_stage IN ('captured', 'engaged', 'qualified', 'opportunity', 'converted', 'discarded')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organic_leads_email_key
    ON public.organic_leads (email_key);

CREATE INDEX IF NOT EXISTS idx_organic_leads_source_page
    ON public.organic_leads (source_page);

CREATE INDEX IF NOT EXISTS idx_organic_leads_source_topic
    ON public.organic_leads (source_topic)
    WHERE source_topic IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organic_leads_intent
    ON public.organic_leads (intent);

CREATE INDEX IF NOT EXISTS idx_organic_leads_specialty
    ON public.organic_leads (specialty)
    WHERE specialty IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organic_leads_lifecycle_stage
    ON public.organic_leads (lifecycle_stage);

CREATE INDEX IF NOT EXISTS idx_organic_leads_created_at
    ON public.organic_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_organic_leads_interest_tags
    ON public.organic_leads USING GIN (interest_tags);

ALTER TABLE public.organic_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'organic_leads'
          AND policyname = 'Users can view own organic lead'
    ) THEN
        CREATE POLICY "Users can view own organic lead"
            ON public.organic_leads
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'organic_leads'
          AND policyname = 'Admins can manage organic leads'
    ) THEN
        CREATE POLICY "Admins can manage organic leads"
            ON public.organic_leads
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE id = auth.uid()
                      AND role = 'admin'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

GRANT SELECT, UPDATE, DELETE ON TABLE public.organic_leads TO authenticated;
GRANT ALL ON TABLE public.organic_leads TO service_role;

DROP TRIGGER IF EXISTS update_organic_leads_updated_at ON public.organic_leads;
CREATE TRIGGER update_organic_leads_updated_at
    BEFORE UPDATE ON public.organic_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
