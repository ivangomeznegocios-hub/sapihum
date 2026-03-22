-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 004_luma_events
-- Description: Add Luma-style event features
-- ============================================

-- ============================================
-- 1. CREATE NEW ENUM FOR EVENT TYPE
-- ============================================
DO $$ BEGIN
    CREATE TYPE event_type_enum AS ENUM ('live', 'on_demand', 'course');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ADD NEW COLUMNS TO EVENTS TABLE
-- ============================================

-- Event type (live, on_demand, course)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'live' 
CHECK (event_type IN ('live', 'on_demand', 'course'));

-- Target audience array
-- Values: 'public', 'members', 'psychologists', 'patients', 'active_patients'
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT ARRAY['public'];

-- Required subscription status (null = no requirement)
-- Values: 'trial', 'active', or null for no requirement
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS required_subscription TEXT[] DEFAULT NULL;

-- Recording availability (days after event)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recording_available_days INTEGER DEFAULT 20;

-- Recording expiration date (auto-calculated or manual)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recording_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Prerequisite event (for courses/sequential content)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS prerequisite_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- ============================================
-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN public.events.event_type IS 'Type of event: live (real-time), on_demand (pre-recorded), course (multi-session)';
COMMENT ON COLUMN public.events.target_audience IS 'Array of allowed audiences: public, members, psychologists, patients, active_patients';
COMMENT ON COLUMN public.events.required_subscription IS 'Required subscription status to access: trial, active, or null for no requirement';
COMMENT ON COLUMN public.events.recording_available_days IS 'Number of days the recording is available after the event ends';
COMMENT ON COLUMN public.events.recording_expires_at IS 'Calculated expiration date for recording access';
COMMENT ON COLUMN public.events.prerequisite_event_id IS 'ID of event that must be completed before accessing this one';

-- ============================================
-- 4. CREATE FUNCTION TO AUTO-SET RECORDING EXPIRATION
-- ============================================
CREATE OR REPLACE FUNCTION public.set_recording_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- When event is marked as completed and has recording, set expiration
    IF NEW.status = 'completed' AND NEW.recording_url IS NOT NULL AND NEW.recording_expires_at IS NULL THEN
        NEW.recording_expires_at := COALESCE(NEW.end_time, NOW()) + (NEW.recording_available_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for auto-setting expiration
DROP TRIGGER IF EXISTS set_recording_expiration_trigger ON public.events;
CREATE TRIGGER set_recording_expiration_trigger
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_recording_expiration();

-- ============================================
-- 5. UPDATE RLS POLICIES FOR AUDIENCE CONTROL
-- ============================================

-- Drop existing public events policy to replace with audience-aware version
DROP POLICY IF EXISTS "Anyone can see public events" ON public.events;

-- New policy: Users can see events matching their audience
CREATE POLICY "Users can see events matching their audience"
ON public.events FOR SELECT
USING (
    -- Event is public
    'public' = ANY(target_audience)
    OR
    -- User is admin (can see all)
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User is psychologist and event targets psychologists
    (
        'psychologists' = ANY(target_audience)
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'psychologist'
        )
    )
    OR
    -- User is patient and event targets patients
    (
        'patients' = ANY(target_audience)
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'patient'
        )
    )
    OR
    -- User is active member and event targets members
    (
        'members' = ANY(target_audience)
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND subscription_status IN ('trial', 'active')
        )
    )
    OR
    -- User is active patient (has active relationship) and event targets active_patients
    (
        'active_patients' = ANY(target_audience)
        AND EXISTS (
            SELECT 1 FROM public.patient_psychologist_relationships ppr
            WHERE ppr.patient_id = auth.uid() 
            AND ppr.status = 'active'
        )
    )
);

-- ============================================
-- 6. ADD INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_target_audience ON public.events USING GIN(target_audience);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_recording_expires ON public.events(recording_expires_at);
