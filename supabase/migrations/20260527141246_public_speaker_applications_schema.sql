-- Public speaker application flow.
-- Allows qualified public signups to become internal speakers while keeping public
-- speaker publication under admin control.

CREATE TABLE IF NOT EXISTS public.speaker_applications (
    applicant_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    professional_id TEXT,
    specialty TEXT,
    years_experience INTEGER,
    bio TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    topic_proposal TEXT,
    credentials TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'needs_review',
    requirements_version TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    income_terms_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT speaker_applications_status_check
        CHECK (status IN ('needs_review', 'auto_approved_internal', 'approved_publication', 'rejected')),
    CONSTRAINT speaker_applications_years_experience_check
        CHECK (years_experience IS NULL OR years_experience >= 0)
);

COMMENT ON TABLE public.speaker_applications IS 'Public landing applications for people who want internal speaker access.';
COMMENT ON COLUMN public.speaker_applications.status IS 'auto_approved_internal means the user can enter as ponente, but public publication is still admin controlled.';

ALTER TABLE public.speaker_applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.speaker_applications TO authenticated;

CREATE POLICY "Applicants can view own speaker application"
    ON public.speaker_applications FOR SELECT
    USING (applicant_id = auth.uid());

CREATE POLICY "Admins full access to speaker applications"
    ON public.speaker_applications FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE INDEX IF NOT EXISTS speaker_applications_status_idx
    ON public.speaker_applications (status, created_at DESC);

DROP TRIGGER IF EXISTS update_speaker_applications_updated_at ON public.speaker_applications;
CREATE TRIGGER update_speaker_applications_updated_at
    BEFORE UPDATE ON public.speaker_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    registration_role public.user_role := 'patient'::public.user_role;
    application jsonb := NEW.raw_user_meta_data -> 'speaker_application';
    requested_role text := NEW.raw_user_meta_data ->> 'registration_role';
    years_experience text := application ->> 'years_experience';
BEGIN
    IF requested_role IN ('psychologist', 'patient') THEN
        registration_role := requested_role::public.user_role;
    ELSIF requested_role = 'ponente'
        AND jsonb_typeof(application) = 'object'
        AND NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')), '') IS NOT NULL
        AND NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', application ->> 'photo_url', '')), '') IS NOT NULL
        AND NULLIF(BTRIM(COALESCE(application ->> 'phone', '')), '') IS NOT NULL
        AND NULLIF(BTRIM(COALESCE(application ->> 'professional_id', '')), '') IS NOT NULL
        AND NULLIF(BTRIM(COALESCE(application ->> 'specialty', '')), '') IS NOT NULL
        AND LENGTH(BTRIM(COALESCE(application ->> 'bio', ''))) >= 80
        AND years_experience ~ '^[0-9]+$'
        AND years_experience::integer >= 1
        AND application ->> 'accepted_speaker_terms' = 'true'
        AND application ->> 'accepted_income_terms' = 'true'
    THEN
        registration_role := 'ponente'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', application ->> 'photo_url'),
        registration_role
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_ponente_speaker_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW.role = 'ponente'
       AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM 'ponente') THEN
        INSERT INTO public.speakers (id, is_public)
        VALUES (NEW.id, false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ponente_speaker_profile();
