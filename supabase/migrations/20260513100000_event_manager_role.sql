ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'event_manager';

-- Events: platform admins and event managers can manage every event except
-- deletion remains admin-only. Ponentes keep create/update access for their own
-- events through narrower policies.
DROP POLICY IF EXISTS "Staff can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins and ponentes can manage events" ON public.events;
DROP POLICY IF EXISTS "Ponentes can delete own events" ON public.events;
DROP POLICY IF EXISTS "Admins and event managers can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins and event managers can create events" ON public.events;
DROP POLICY IF EXISTS "Admins and event managers can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Ponentes can create own events" ON public.events;

CREATE POLICY "Admins and event managers can view all events"
    ON public.events FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

CREATE POLICY "Admins and event managers can create events"
    ON public.events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

CREATE POLICY "Ponentes can create own events"
    ON public.events FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text = 'ponente'
        )
    );

CREATE POLICY "Admins and event managers can update events"
    ON public.events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

CREATE POLICY "Admins can delete events"
    ON public.events FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text = 'admin'
        )
    );

-- Event side tables.
DROP POLICY IF EXISTS "Event creators and admins can manage event speakers" ON public.event_speakers;
DROP POLICY IF EXISTS "Event creators and event managers can manage event speakers" ON public.event_speakers;

CREATE POLICY "Event creators and event managers can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = event_speakers.event_id
              AND (
                e.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role::text IN ('admin', 'event_manager')
                )
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.events e
            WHERE e.id = event_speakers.event_id
              AND (
                e.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM public.profiles p
                    WHERE p.id = auth.uid()
                      AND p.role::text IN ('admin', 'event_manager')
                )
              )
        )
    );

DROP POLICY IF EXISTS "Admin full access to event_resources" ON public.event_resources;
DROP POLICY IF EXISTS "Admins and event managers can manage event_resources" ON public.event_resources;

CREATE POLICY "Admins and event managers can manage event_resources"
    ON public.event_resources FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

DROP POLICY IF EXISTS "Staff see event registrations" ON public.event_registrations;

CREATE POLICY "Staff see event registrations"
    ON public.event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.events e
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE e.id = event_registrations.event_id
              AND (
                e.created_by = auth.uid()
                OR p.role::text IN ('admin', 'event_manager')
              )
        )
    );

DROP POLICY IF EXISTS "Event managers can manage event verticals" ON public.event_verticals;

CREATE POLICY "Event managers can manage event verticals"
    ON public.event_verticals FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

-- Formations: event managers can manage the formation shell and course links,
-- while learner progress, purchases, and certificates remain admin-only.
DROP POLICY IF EXISTS "Admins full access to formations" ON public.formations;
DROP POLICY IF EXISTS "Admins and event managers full access to formations" ON public.formations;

CREATE POLICY "Admins and event managers full access to formations"
    ON public.formations FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

DROP POLICY IF EXISTS "Admins full access to formation courses" ON public.formation_courses;
DROP POLICY IF EXISTS "Admins and event managers full access to formation courses" ON public.formation_courses;

CREATE POLICY "Admins and event managers full access to formation courses"
    ON public.formation_courses FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );

DROP POLICY IF EXISTS "Event managers can manage formation verticals" ON public.formation_verticals;

CREATE POLICY "Event managers can manage formation verticals"
    ON public.formation_verticals FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
              AND role::text IN ('admin', 'event_manager')
        )
    );
