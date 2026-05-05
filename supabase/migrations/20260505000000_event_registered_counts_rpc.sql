CREATE OR REPLACE FUNCTION public.get_event_registered_counts(p_event_ids uuid[])
RETURNS TABLE(event_id uuid, attendee_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        registrations.event_id,
        COUNT(*)::integer AS attendee_count
    FROM public.event_registrations AS registrations
    WHERE registrations.event_id = ANY(p_event_ids)
      AND registrations.status = 'registered'
    GROUP BY registrations.event_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_registered_counts(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_event_registered_counts(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_registered_counts(uuid[]) TO service_role;
