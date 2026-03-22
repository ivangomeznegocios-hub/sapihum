-- Fix RLS policy for events table

DROP POLICY IF EXISTS "Admins and ponentes can manage events" ON public.events;

CREATE POLICY "Admins and ponentes can manage events"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ponente', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ponente', 'admin')
        )
    );
