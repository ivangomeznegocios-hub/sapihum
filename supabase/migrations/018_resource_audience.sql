-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 018_resource_audience
-- Adds audience targeting to resources (same pattern as events)
-- ============================================

-- Add target_audience column (same as events)
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT ARRAY['public'];

-- Add min_membership_level column
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS min_membership_level INTEGER DEFAULT 0;

-- Comments
COMMENT ON COLUMN public.resources.target_audience IS 'Array of allowed audiences: public, members, psychologists, patients, active_patients';
COMMENT ON COLUMN public.resources.min_membership_level IS 'Minimum membership level required to view (0=free, 1=comunidad, 2=consultorio, 3=marketing)';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_resources_target_audience ON public.resources USING GIN(target_audience);
CREATE INDEX IF NOT EXISTS idx_resources_min_membership_level ON public.resources(min_membership_level);

-- Update existing resources: set all current resources to target psychologists + public
-- (since they were created before audience controls existed)
UPDATE public.resources
SET target_audience = ARRAY['public', 'psychologists', 'members']
WHERE target_audience = ARRAY['public'];
