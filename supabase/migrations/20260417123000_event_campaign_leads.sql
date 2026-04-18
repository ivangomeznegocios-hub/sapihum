CREATE TABLE IF NOT EXISTS public.event_interest_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    event_slug TEXT,
    formation_track TEXT NOT NULL,
    source_surface TEXT NOT NULL,
    source_action TEXT NOT NULL DEFAULT 'download_syllabus',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT,
    speaker_ref TEXT,
    lead_tag TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'captured',
    attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact_key TEXT GENERATED ALWAYS AS (LOWER(email)) STORED,
    interest_key TEXT GENERATED ALWAYS AS (COALESCE(event_slug, formation_track)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT event_interest_leads_status_allowed CHECK (
        status IN ('captured', 'qualified', 'converted', 'discarded')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_interest_leads_contact_interest_action
    ON public.event_interest_leads (contact_key, interest_key, source_action);

CREATE INDEX IF NOT EXISTS idx_event_interest_leads_created_at
    ON public.event_interest_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_interest_leads_track
    ON public.event_interest_leads (formation_track);

CREATE INDEX IF NOT EXISTS idx_event_interest_leads_event_slug
    ON public.event_interest_leads (event_slug)
    WHERE event_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_interest_leads_speaker_ref
    ON public.event_interest_leads (speaker_ref)
    WHERE speaker_ref IS NOT NULL;

ALTER TABLE public.event_interest_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_interest_leads'
          AND policyname = 'Anyone can insert event interest leads'
    ) THEN
        CREATE POLICY "Anyone can insert event interest leads"
            ON public.event_interest_leads
            FOR INSERT
            WITH CHECK (
                (user_id IS NULL OR user_id = auth.uid())
                AND email IS NOT NULL
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_interest_leads'
          AND policyname = 'Users can view own event interest leads'
    ) THEN
        CREATE POLICY "Users can view own event interest leads"
            ON public.event_interest_leads
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_interest_leads'
          AND policyname = 'Admins full access to event interest leads'
    ) THEN
        CREATE POLICY "Admins full access to event interest leads"
            ON public.event_interest_leads
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_event_interest_leads_updated_at ON public.event_interest_leads;
CREATE TRIGGER update_event_interest_leads_updated_at
    BEFORE UPDATE ON public.event_interest_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.events
SET formation_track = 'Psicologia Criminal y Forense'
WHERE slug IN (
    'psicologia-criminal-y-analisis-de-la-conducta-delictiva',
    'psicologia-forense-aplicada-al-sistema-de-justicia',
    'perfilacion-criminal-y-analisis-de-la-conducta-del-delincuente'
);

UPDATE public.events
SET formation_track = 'Memoria, Envejecimiento y Deterioro Cognitivo'
WHERE slug IN (
    'cambios-de-memoria-en-la-vejez-senales-normales-y-senales-de-alerta',
    'deterioro-cognitivo-en-la-vejez-guia-practica-para-actuar-y-acompanar'
);
