-- ============================================
-- FIX: Appointment System
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Add missing enum values to appointment_status
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Add 'type' column to appointments table (video or in_person)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video';

-- 3. Verify
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'appointment_status'::regtype ORDER BY enumsortorder;
SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'type';
