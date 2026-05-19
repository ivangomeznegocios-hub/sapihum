-- Allow creators to read their own event rows, including draft events with
-- restricted target audiences. PostgREST insert(...).select() needs SELECT
-- visibility on the inserted row to return it.

DROP POLICY IF EXISTS "Event creators can view own events" ON public.events;

CREATE POLICY "Event creators can view own events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());
