-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE MIGRATION
-- Migration: 027_fix_clinical_records_columns
-- Fix clinical_records column issues
-- ============================================

-- 1. Change 'type' column from record_type ENUM to TEXT
--    The app uses values like 'session_note', 'assessment', 'treatment_plan', etc.
--    but the enum only had 'nota' and 'historia_clinica'
ALTER TABLE public.clinical_records 
    ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- Set a sensible default
ALTER TABLE public.clinical_records 
    ALTER COLUMN type SET DEFAULT 'session_note';

-- Drop the old enum if no other tables use it
-- (clinical_records was the only table using record_type)
DROP TYPE IF EXISTS record_type;
