-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 036_hipaa_storage_policies
-- Description: Applies strict RLS to the clinical-documents Supabase storage bucket
-- ============================================

-- Ensure the bucket exists and is set to private
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-documents', 'clinical-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- =========================================================================
-- NOTE: SUPABASE STORAGE LIMITATION
-- The 'postgres' role used in migrations cannot create policies on storage.objects.
-- Just like in migration 014, please copy and paste the following policies 
-- directly into your Supabase Dashboard -> SQL Editor and run them there.
-- =========================================================================

/*
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Psychologists can upload their own clinical documents
CREATE POLICY "Psychologists can upload clinical documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'clinical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

-- Policy 2: Psychologists can view their own clinical documents
CREATE POLICY "Psychologists can view own clinical documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Psychologists can update their own clinical documents
CREATE POLICY "Psychologists can update own clinical documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Psychologists can delete their own clinical documents
CREATE POLICY "Psychologists can delete own clinical documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Admins can do everything
CREATE POLICY "Admins have full access to clinical documents"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
*/

-- Note: We intentionally do NOT give patients direct access to the storage bucket
-- even if they get access to the clinical_documents table records. 
-- In a compliant system, a patient should request the document through 
-- a signed URL generated securely on the server side by their psychologist or via an API endpoint,
-- or we can update this policy later to allow patients if they have an active relationship.
