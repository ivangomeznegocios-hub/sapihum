-- Allows SAPIHUM support users to resolve shared vertical content in read-only flows.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_verticals'
          AND policyname = 'Support can read all event verticals'
    ) THEN
        CREATE POLICY "Support can read all event verticals"
            ON public.event_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'support'
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
          AND policyname = 'Support can read all formation verticals'
    ) THEN
        CREATE POLICY "Support can read all formation verticals"
            ON public.formation_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'support'
                )
            );
    END IF;
END $$;
