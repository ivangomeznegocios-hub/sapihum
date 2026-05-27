-- Allow event editors to see attendee access created by registrations,
-- purchases and memberships for their own/assigned events.

DROP POLICY IF EXISTS "Event editors can view event registrations" ON public.event_registrations;

CREATE POLICY "Event editors can view event registrations"
    ON public.event_registrations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.events e
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE e.id = event_registrations.event_id
              AND (
                e.created_by = auth.uid()
                OR p.role::text IN ('admin', 'event_manager')
                OR EXISTS (
                    SELECT 1
                    FROM public.event_speakers es
                    WHERE es.event_id = e.id
                      AND es.speaker_id = auth.uid()
                )
              )
        )
    );

DROP POLICY IF EXISTS "Event editors can view event entitlements" ON public.event_entitlements;

CREATE POLICY "Event editors can view event entitlements"
    ON public.event_entitlements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.events e
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE e.id = event_entitlements.event_id
              AND (
                e.created_by = auth.uid()
                OR p.role::text IN ('admin', 'event_manager')
                OR EXISTS (
                    SELECT 1
                    FROM public.event_speakers es
                    WHERE es.event_id = e.id
                      AND es.speaker_id = auth.uid()
                )
              )
        )
    );

NOTIFY pgrst, 'reload schema';
