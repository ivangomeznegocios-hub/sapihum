-- ============================================
-- COMUNIDAD DE PSICOLOGIA - DATABASE SCHEMA
-- Migration: 041_soft_delete_retention
-- Description: Soft-delete columns and restrictive RLS for clinical retention
-- ============================================

-- 1. Add soft-delete columns
ALTER TABLE public.clinical_records
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.clinical_documents
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.session_summaries
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.patient_documents
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Indexes for active/soft-deleted lookups
CREATE INDEX IF NOT EXISTS idx_clinical_records_deleted_at
    ON public.clinical_records (deleted_at);

CREATE INDEX IF NOT EXISTS idx_clinical_records_active_patient_created
    ON public.clinical_records (patient_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_documents_deleted_at
    ON public.clinical_documents (deleted_at);

CREATE INDEX IF NOT EXISTS idx_clinical_documents_active_patient_created
    ON public.clinical_documents (patient_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_session_summaries_deleted_at
    ON public.session_summaries (deleted_at);

CREATE INDEX IF NOT EXISTS idx_session_summaries_active_patient_created
    ON public.session_summaries (patient_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_patient_documents_deleted_at
    ON public.patient_documents (deleted_at);

CREATE INDEX IF NOT EXISTS idx_patient_documents_active_psychologist_created
    ON public.patient_documents (psychologist_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- 3. Restrictive RLS policies for active rows only
-- SELECT and DELETE must never touch soft-deleted rows.
DO $$
BEGIN
    CREATE POLICY "clinical_records active rows only"
    ON public.clinical_records
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "clinical_records active rows only update"
    ON public.clinical_records
    AS RESTRICTIVE
    FOR UPDATE
    TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "clinical_records active rows only delete"
    ON public.clinical_records
    AS RESTRICTIVE
    FOR DELETE
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "clinical_documents active rows only"
    ON public.clinical_documents
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "clinical_documents active rows only update"
    ON public.clinical_documents
    AS RESTRICTIVE
    FOR UPDATE
    TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "clinical_documents active rows only delete"
    ON public.clinical_documents
    AS RESTRICTIVE
    FOR DELETE
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "session_summaries active rows only"
    ON public.session_summaries
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "session_summaries active rows only update"
    ON public.session_summaries
    AS RESTRICTIVE
    FOR UPDATE
    TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "session_summaries active rows only delete"
    ON public.session_summaries
    AS RESTRICTIVE
    FOR DELETE
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "patient_documents active rows only"
    ON public.patient_documents
    AS RESTRICTIVE
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "patient_documents active rows only update"
    ON public.patient_documents
    AS RESTRICTIVE
    FOR UPDATE
    TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE POLICY "patient_documents active rows only delete"
    ON public.patient_documents
    AS RESTRICTIVE
    FOR DELETE
    TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

