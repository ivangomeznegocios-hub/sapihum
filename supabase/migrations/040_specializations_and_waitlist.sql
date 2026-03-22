-- ============================================
-- Migration 040: Specializations + Waitlist
-- ============================================

-- 1) Profile-level specialization for paid level 2/3 users
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS membership_specialization_code TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_membership_specialization_code_allowed'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_membership_specialization_code_allowed
            CHECK (
                membership_specialization_code IS NULL
                OR membership_specialization_code IN (
                    'clinica',
                    'forense',
                    'educacion',
                    'organizacional',
                    'infanto_juvenil',
                    'neuropsicologia',
                    'deportiva',
                    'sexologia_clinica',
                    'psicogerontologia'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_membership_specialization_code
    ON public.profiles (membership_specialization_code)
    WHERE membership_specialization_code IS NOT NULL;

-- 2) Track specialization chosen for each subscription row
ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS specialization_code TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'subscriptions_specialization_code_allowed'
    ) THEN
        ALTER TABLE public.subscriptions
            ADD CONSTRAINT subscriptions_specialization_code_allowed
            CHECK (
                specialization_code IS NULL
                OR specialization_code IN (
                    'clinica',
                    'forense',
                    'educacion',
                    'organizacional',
                    'infanto_juvenil',
                    'neuropsicologia',
                    'deportiva',
                    'sexologia_clinica',
                    'psicogerontologia'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_specialization_code
    ON public.subscriptions (specialization_code)
    WHERE specialization_code IS NOT NULL;

-- 3) Specialization demand waitlist
CREATE TABLE IF NOT EXISTS public.specialization_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialization_code TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    source TEXT NOT NULL DEFAULT 'landing',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact_key TEXT GENERATED ALWAYS AS (
        COALESCE(user_id::text, LOWER(email))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT specialization_waitlist_specialization_code_allowed CHECK (
        specialization_code IN (
            'clinica',
            'forense',
            'educacion',
            'organizacional',
            'infanto_juvenil',
            'neuropsicologia',
            'deportiva',
            'sexologia_clinica',
            'psicogerontologia'
        )
    ),
    CONSTRAINT specialization_waitlist_source_allowed CHECK (
        source IN ('landing', 'app')
    ),
    CONSTRAINT specialization_waitlist_contact_required CHECK (
        user_id IS NOT NULL OR email IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_specialization_waitlist_contact_and_specialization
    ON public.specialization_waitlist (contact_key, specialization_code);

CREATE INDEX IF NOT EXISTS idx_specialization_waitlist_specialization
    ON public.specialization_waitlist (specialization_code);

CREATE INDEX IF NOT EXISTS idx_specialization_waitlist_created_at
    ON public.specialization_waitlist (created_at DESC);

ALTER TABLE public.specialization_waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'specialization_waitlist'
          AND policyname = 'Anyone can join specialization waitlist'
    ) THEN
        CREATE POLICY "Anyone can join specialization waitlist"
            ON public.specialization_waitlist
            FOR INSERT
            WITH CHECK (
                (user_id IS NULL OR user_id = auth.uid())
                AND (email IS NOT NULL OR auth.uid() IS NOT NULL)
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'specialization_waitlist'
          AND policyname = 'Users can view own specialization waitlist rows'
    ) THEN
        CREATE POLICY "Users can view own specialization waitlist rows"
            ON public.specialization_waitlist
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'specialization_waitlist'
          AND policyname = 'Admins full access to specialization waitlist'
    ) THEN
        CREATE POLICY "Admins full access to specialization waitlist"
            ON public.specialization_waitlist
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.profiles
                    WHERE id = auth.uid()
                      AND role = 'admin'
                )
            );
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_specialization_waitlist_updated_at ON public.specialization_waitlist;
CREATE TRIGGER update_specialization_waitlist_updated_at
    BEFORE UPDATE ON public.specialization_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Monthly demand view (for operational ranking)
CREATE OR REPLACE VIEW public.specialization_waitlist_monthly_ranking AS
SELECT
    DATE_TRUNC('month', created_at)::date AS month_bucket,
    specialization_code,
    COUNT(*)::int AS demand_count
FROM public.specialization_waitlist
GROUP BY 1, 2
ORDER BY month_bucket DESC, demand_count DESC;

