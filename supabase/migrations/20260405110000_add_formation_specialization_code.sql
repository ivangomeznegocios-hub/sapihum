-- ============================================
-- Formation specialization tag for Level 2 inclusion
-- ============================================

ALTER TABLE public.formations
    ADD COLUMN IF NOT EXISTS specialization_code TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'formations_specialization_code_allowed'
    ) THEN
        ALTER TABLE public.formations
            ADD CONSTRAINT formations_specialization_code_allowed
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

CREATE INDEX IF NOT EXISTS idx_formations_specialization_code
    ON public.formations (specialization_code)
    WHERE specialization_code IS NOT NULL;

NOTIFY pgrst, 'reload schema';
