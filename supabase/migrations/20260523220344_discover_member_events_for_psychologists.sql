-- Let psychologist accounts discover published member events in the dashboard
-- without granting registration, checkout, meeting links, or entitlement access.

DROP POLICY IF EXISTS "Users can see events matching their audience" ON public.events;

CREATE POLICY "Users can see events matching their audience"
ON public.events FOR SELECT
USING (
    status NOT IN ('draft', 'cancelled')
    AND (
        'public' = ANY(target_audience)
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role::text IN ('admin', 'event_manager')
        )
        OR (
            'psychologists' = ANY(target_audience)
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role::text = 'psychologist'
            )
        )
        OR (
            'patients' = ANY(target_audience)
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role::text = 'patient'
            )
        )
        OR (
            'members' = ANY(target_audience)
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                  AND (
                    role::text = 'psychologist'
                    OR subscription_status IN ('trial', 'active', 'past_due')
                  )
            )
        )
        OR (
            'active_patients' = ANY(target_audience)
            AND EXISTS (
                SELECT 1
                FROM public.patient_psychologist_relationships ppr
                WHERE ppr.patient_id = auth.uid()
                  AND ppr.status = 'active'
            )
        )
    )
);
