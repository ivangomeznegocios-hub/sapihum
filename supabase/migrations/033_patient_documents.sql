-- Migration: Create patient documents table
-- Description: Adds the patient_documents table to allow psychologists to store files and documents for their patients.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'document_category') THEN
        CREATE TYPE document_category AS ENUM ('test_result', 'referral', 'consent', 'report', 'intake_form', 'other');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    category document_category NOT NULL DEFAULT 'other',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);



-- Enable Row Level Security
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN

    -- Policy: Psychologists can INSERT documents for their patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Psychologists can insert documents for their patients'
    ) THEN
        CREATE POLICY "Psychologists can insert documents for their patients"
            ON public.patient_documents
            FOR INSERT
            TO authenticated
            WITH CHECK (
                auth.uid() = psychologist_id AND 
                EXISTS (
                    SELECT 1 FROM public.patient_psychologist_relationships 
                    WHERE psychologist_id = auth.uid() AND patient_id = patient_documents.patient_id AND status = 'active'
                )
            );
    END IF;

    -- Policy: Psychologists can SELECT documents for their patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Psychologists can view documents of their patients'
    ) THEN
        CREATE POLICY "Psychologists can view documents of their patients"
            ON public.patient_documents
            FOR SELECT
            TO authenticated
            USING (
                auth.uid() = psychologist_id AND 
                EXISTS (
                    SELECT 1 FROM public.patient_psychologist_relationships 
                    WHERE psychologist_id = auth.uid() AND patient_id = patient_documents.patient_id AND status = 'active'
                )
            );
    END IF;

    -- Policy: Psychologists can UPDATE documents for their patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Psychologists can update documents of their patients'
    ) THEN
        CREATE POLICY "Psychologists can update documents of their patients"
            ON public.patient_documents
            FOR UPDATE
            TO authenticated
            USING (
                auth.uid() = psychologist_id AND 
                EXISTS (
                    SELECT 1 FROM public.patient_psychologist_relationships 
                    WHERE psychologist_id = auth.uid() AND patient_id = patient_documents.patient_id AND status = 'active'
                )
            )
            WITH CHECK (
                auth.uid() = psychologist_id AND 
                EXISTS (
                    SELECT 1 FROM public.patient_psychologist_relationships 
                    WHERE psychologist_id = auth.uid() AND patient_id = patient_documents.patient_id AND status = 'active'
                )
            );
    END IF;

    -- Policy: Psychologists can DELETE documents for their patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Psychologists can delete documents of their patients'
    ) THEN
        CREATE POLICY "Psychologists can delete documents of their patients"
            ON public.patient_documents
            FOR DELETE
            TO authenticated
            USING (
                auth.uid() = psychologist_id AND 
                EXISTS (
                    SELECT 1 FROM public.patient_psychologist_relationships 
                    WHERE psychologist_id = auth.uid() AND patient_id = patient_documents.patient_id AND status = 'active'
                )
            );
    END IF;

    -- Policy: Admins can do everything
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patient_documents' AND policyname = 'Admins can do everything on patient documents'
    ) THEN
        CREATE POLICY "Admins can do everything on patient documents"
            ON public.patient_documents
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;

END $$;
