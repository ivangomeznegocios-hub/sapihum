-- ============================================
-- FIX: Allow patients to create appointments + add profile columns for psychologist settings
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Allow patients to INSERT appointments (booking flow)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Patients can create appointments' AND tablename = 'appointments'
    ) THEN
        CREATE POLICY "Patients can create appointments"
        ON public.appointments FOR INSERT
        WITH CHECK (
            patient_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'patient'
            )
            AND EXISTS (
                SELECT 1 FROM public.patient_psychologist_relationships ppr
                WHERE ppr.patient_id = auth.uid()
                AND ppr.psychologist_id = appointments.psychologist_id
                AND ppr.status = 'active'
            )
        );
    END IF;
END $$;

-- 2. Allow patients to update their own pending appointments (cancel)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Patients can cancel own appointments' AND tablename = 'appointments'
    ) THEN
        CREATE POLICY "Patients can cancel own appointments"
        ON public.appointments FOR UPDATE
        USING (patient_id = auth.uid())
        WITH CHECK (patient_id = auth.uid());
    END IF;
END $$;

-- 3. Add all necessary columns to profiles for psychologist configuration
-- Services: [{ name, duration, price, modality }]
-- Availability: { monday: [{start, end}], ... }
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS office_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '{}'::jsonb;

-- 4. Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN (
    'services', 'availability', 'office_address', 'bio', 'hourly_rate', 'payment_methods'
);
