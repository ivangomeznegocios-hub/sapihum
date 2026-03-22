-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 014_clinical_records_enhancement
-- Expediente Clínico Digital — Enhanced Clinical Records
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM ('test_result', 'referral', 'consent', 'report', 'intake_form', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'export');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. ENHANCE clinical_records TABLE
-- ============================================
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- Index for tag searches
CREATE INDEX IF NOT EXISTS idx_clinical_records_tags ON public.clinical_records USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clinical_records_pinned ON public.clinical_records(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_clinical_records_appointment ON public.clinical_records(appointment_id);

-- ============================================
-- 3. CREATE clinical_documents TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clinical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_type TEXT NOT NULL, -- MIME type (application/pdf, image/png, etc.)
    file_size BIGINT NOT NULL, -- bytes
    category document_category NOT NULL DEFAULT 'other',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clinical_documents IS 'File attachments linked to patient clinical records (PDFs, images, test results, etc.)';

ALTER TABLE public.clinical_documents ENABLE ROW LEVEL SECURITY;

-- RLS: Only the assigned psychologist can read/write
CREATE POLICY "Psychologists can view own clinical documents"
ON public.clinical_documents FOR SELECT
USING (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can create clinical documents"
ON public.clinical_documents FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
    AND EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = clinical_documents.patient_id
        AND ppr.status = 'active'
    )
);

CREATE POLICY "Psychologists can update own clinical documents"
ON public.clinical_documents FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can delete own clinical documents"
ON public.clinical_documents FOR DELETE
USING (psychologist_id = auth.uid());

CREATE POLICY "Admins can view all clinical documents"
ON public.clinical_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient ON public.clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_psychologist ON public.clinical_documents(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_category ON public.clinical_documents(category);

-- Trigger for updated_at
CREATE TRIGGER update_clinical_documents_updated_at
    BEFORE UPDATE ON public.clinical_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. CREATE session_summaries TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 5),
    key_topics TEXT[] DEFAULT '{}',
    homework TEXT,
    next_session_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.session_summaries IS 'Brief session summaries linked to appointments, tracking mood, progress, and homework';

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

-- RLS: psychologist-only
CREATE POLICY "Psychologists can view own session summaries"
ON public.session_summaries FOR SELECT
USING (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can create session summaries"
ON public.session_summaries FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

CREATE POLICY "Psychologists can update own session summaries"
ON public.session_summaries FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can delete own session summaries"
ON public.session_summaries FOR DELETE
USING (psychologist_id = auth.uid());

CREATE POLICY "Admins can view all session summaries"
ON public.session_summaries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_summaries_appointment ON public.session_summaries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_patient ON public.session_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_psychologist ON public.session_summaries(psychologist_id);

-- Trigger for updated_at
CREATE TRIGGER update_session_summaries_updated_at
    BEFORE UPDATE ON public.session_summaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. CREATE clinical_audit_log TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clinical_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    record_type TEXT NOT NULL, -- 'clinical_record', 'clinical_document', 'session_summary'
    record_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clinical_audit_log IS 'Immutable audit trail for all clinical data operations';

ALTER TABLE public.clinical_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: psychologist can only view own logs, never delete
CREATE POLICY "Psychologists can view own audit logs"
ON public.clinical_audit_log FOR SELECT
USING (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can create audit logs"
ON public.clinical_audit_log FOR INSERT
WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
ON public.clinical_audit_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- No UPDATE or DELETE policies — audit log is immutable

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_psychologist ON public.clinical_audit_log(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON public.clinical_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.clinical_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.clinical_audit_log(created_at DESC);

-- ============================================
-- 6. STORAGE BUCKET POLICY (for reference)
-- ============================================
-- NOTE: Run this in the Supabase Dashboard → Storage → New bucket
--   Bucket name: clinical-documents
--   Public: OFF (private)
--
-- Then add these Storage policies via SQL Editor:
--
-- CREATE POLICY "Psychologists can upload clinical documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'clinical-documents'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- CREATE POLICY "Psychologists can view own clinical documents"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'clinical-documents'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );
--
-- CREATE POLICY "Psychologists can delete own clinical documents"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'clinical-documents'
--     AND auth.uid()::text = (storage.foldername(name))[1]
-- );
