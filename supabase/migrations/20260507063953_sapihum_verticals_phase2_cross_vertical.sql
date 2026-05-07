-- SAPIHUM multi-vertical phase 2.
-- Adds bridge tables for content shared across verticals without duplicating rows.

CREATE TABLE IF NOT EXISTS public.event_verticals (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, vertical_id)
);

CREATE TABLE IF NOT EXISTS public.formation_verticals (
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (formation_id, vertical_id)
);

CREATE INDEX IF NOT EXISTS idx_event_verticals_vertical
    ON public.event_verticals (vertical_id);

CREATE INDEX IF NOT EXISTS idx_formation_verticals_vertical
    ON public.formation_verticals (vertical_id);

INSERT INTO public.event_verticals (event_id, vertical_id)
SELECT id, primary_vertical_id
FROM public.events
WHERE content_scope IN ('vertical', 'cross_vertical')
  AND primary_vertical_id IS NOT NULL
ON CONFLICT (event_id, vertical_id) DO NOTHING;

INSERT INTO public.formation_verticals (formation_id, vertical_id)
SELECT id, primary_vertical_id
FROM public.formations
WHERE content_scope IN ('vertical', 'cross_vertical')
  AND primary_vertical_id IS NOT NULL
ON CONFLICT (formation_id, vertical_id) DO NOTHING;

ALTER TABLE public.event_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_verticals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_verticals'
          AND policyname = 'Users can read event verticals they can access'
    ) THEN
        CREATE POLICY "Users can read event verticals they can access"
            ON public.event_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = event_verticals.vertical_id
                      AND access.access_status IN ('interested', 'active')
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.events
                    WHERE events.id = event_verticals.event_id
                      AND events.created_by = auth.uid()
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
          AND policyname = 'Users can read formation verticals they can access'
    ) THEN
        CREATE POLICY "Users can read formation verticals they can access"
            ON public.formation_verticals
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = formation_verticals.vertical_id
                      AND access.access_status IN ('interested', 'active')
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.formations
                    WHERE formations.id = formation_verticals.formation_id
                      AND formations.created_by = auth.uid()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'event_verticals'
          AND policyname = 'Editors can manage event verticals'
    ) THEN
        CREATE POLICY "Editors can manage event verticals"
            ON public.event_verticals
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.events
                    WHERE events.id = event_verticals.event_id
                      AND events.created_by = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = event_verticals.vertical_id
                      AND access.vertical_role = 'admin'
                      AND access.access_status = 'active'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.events
                    WHERE events.id = event_verticals.event_id
                      AND events.created_by = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = event_verticals.vertical_id
                      AND access.vertical_role = 'admin'
                      AND access.access_status = 'active'
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
          AND policyname = 'Editors can manage formation verticals'
    ) THEN
        CREATE POLICY "Editors can manage formation verticals"
            ON public.formation_verticals
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.formations
                    WHERE formations.id = formation_verticals.formation_id
                      AND formations.created_by = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = formation_verticals.vertical_id
                      AND access.vertical_role = 'admin'
                      AND access.access_status = 'active'
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.formations
                    WHERE formations.id = formation_verticals.formation_id
                      AND formations.created_by = auth.uid()
                )
                OR EXISTS (
                    SELECT 1
                    FROM public.user_vertical_access access
                    WHERE access.user_id = auth.uid()
                      AND access.vertical_id = formation_verticals.vertical_id
                      AND access.vertical_role = 'admin'
                      AND access.access_status = 'active'
                )
            );
    END IF;
END $$;

COMMENT ON TABLE public.event_verticals IS 'Vertical visibility bridge for events, including cross-vertical events.';
COMMENT ON TABLE public.formation_verticals IS 'Vertical visibility bridge for formations, including cross-vertical formations.';
