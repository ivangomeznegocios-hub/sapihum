-- Respect the registration role choice for new auth users.
-- Only public self-registration roles are accepted here; missing or invalid metadata falls back to patient.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    registration_role public.user_role := 'patient'::public.user_role;
BEGIN
    IF NEW.raw_user_meta_data ->> 'registration_role' IN ('psychologist', 'patient') THEN
        registration_role := (NEW.raw_user_meta_data ->> 'registration_role')::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url',
        registration_role
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;
