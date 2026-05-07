-- Allow public catalog pages to resolve cross-vertical visibility without exposing private rows.
-- The bridge row is readable only when its parent content is publicly publishable.

GRANT SELECT ON public.event_verticals TO anon, authenticated;
GRANT SELECT ON public.formation_verticals TO anon, authenticated;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_verticals'
          AND policyname = 'Public can read published event verticals'
    ) THEN
        CREATE POLICY "Public can read published event verticals"
            ON public.event_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.events
                    WHERE events.id = event_verticals.event_id
                      AND events.status NOT IN ('draft', 'cancelled')
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'formation_verticals'
          AND policyname = 'Public can read active formation verticals'
    ) THEN
        CREATE POLICY "Public can read active formation verticals"
            ON public.formation_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.formations
                    WHERE formations.id = formation_verticals.formation_id
                      AND formations.status = 'active'
                )
            );
    END IF;
END $$;
