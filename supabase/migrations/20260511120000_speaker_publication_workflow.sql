-- Keep speaker profiles private until an admin explicitly publishes them.

ALTER TABLE public.speakers
    ALTER COLUMN is_public SET DEFAULT false;

UPDATE public.speakers AS s
SET is_public = false
FROM public.profiles AS p
WHERE p.id = s.id
  AND s.is_public = true
  AND (
      NULLIF(BTRIM(p.full_name), '') IS NULL
      OR NULLIF(BTRIM(COALESCE(s.photo_url, p.avatar_url, '')), '') IS NULL
  );

CREATE OR REPLACE FUNCTION public.prevent_non_admin_speaker_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_is_admin boolean := false;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
    INTO caller_is_admin;

    IF caller_is_admin THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.is_public IS TRUE THEN
        RAISE EXCEPTION 'Solo un administrador puede publicar un ponente';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.is_public IS DISTINCT FROM OLD.is_public THEN
        RAISE EXCEPTION 'Solo un administrador puede cambiar el estado publico de un ponente';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_non_admin_speaker_publication ON public.speakers;
CREATE TRIGGER prevent_non_admin_speaker_publication
    BEFORE INSERT OR UPDATE OF is_public ON public.speakers
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_non_admin_speaker_publication();
