-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 038_hipaa_patient_access_rls
-- Description: HIPAA Privacy Rule: Gives patients read-only access to their own clinical records
-- ============================================

-- Wait, let's safely grant SELECT to the patients for their own records.
-- Patients cannot UPDATE, INSERT, or DELETE. Only SELECT.

-- 1. clinical_records
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clinical_records' AND policyname = 'Patients can view own clinical records'
    ) THEN
        CREATE POLICY "Patients can view own clinical records"
        ON public.clinical_records FOR SELECT TO authenticated
        USING (patient_id = auth.uid());
    END IF;
END $$;

-- 2. clinical_documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clinical_documents' AND policyname = 'Patients can view own clinical documents'
    ) THEN
        CREATE POLICY "Patients can view own clinical documents"
        ON public.clinical_documents FOR SELECT TO authenticated
        USING (patient_id = auth.uid());
    END IF;
END $$;

-- 3. patient_documents (Existing migration 033 didn't give patient SELECT access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Patients can view own patient documents'
    ) THEN
        CREATE POLICY "Patients can view own patient documents"
        ON public.patient_documents FOR SELECT TO authenticated
        USING (patient_id = auth.uid());
    END IF;
END $$;

-- 4. session_summaries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'session_summaries' AND policyname = 'Patients can view own session summaries'
    ) THEN
        CREATE POLICY "Patients can view own session summaries"
        ON public.session_summaries FOR SELECT TO authenticated
        USING (patient_id = auth.uid());
    END IF;
END $$;

-- Also update the storage bucket to allow patients to download their files IF they request it over signed urls.
-- For direct reads from storage by patient, we can add a SELECT policy onto clinical-documents bucket:

/*
-- NOTE: Run this directly in the Supabase Dashboard SQL Editor (due to storage ownership limits)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Patients can view own clinical documents in storage'
    ) THEN
        CREATE POLICY "Patients can view own clinical documents in storage"
        ON storage.objects FOR SELECT TO authenticated
        USING (
            bucket_id = 'clinical-documents'
            AND EXISTS (
                SELECT 1 FROM public.clinical_documents cd
                WHERE cd.patient_id = auth.uid()
                AND cd.file_path = storage.objects.name
            )
        );
    END IF;
END $$;
*/
