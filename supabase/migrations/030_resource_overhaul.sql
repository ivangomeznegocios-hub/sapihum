-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 030_resource_overhaul
-- Adds expiration, categories, tags, featured, download count,
-- and event_resources linking table
-- ============================================

-- ============================================
-- 1. ADD NEW COLUMNS TO resources
-- ============================================

-- Expiration date (NULL = never expires)
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Category for organization
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
CHECK (category IN ('guia', 'estudio', 'herramienta', 'plantilla', 'curso_material', 'general'));

-- Free-form tags for search and filtering
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Download/view counter
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Featured flag (admin only)
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Custom sort order
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Comments
COMMENT ON COLUMN public.resources.expires_at IS 'Expiration date for the resource. NULL means no expiration.';
COMMENT ON COLUMN public.resources.category IS 'Content category: guia, estudio, herramienta, plantilla, curso_material, general';
COMMENT ON COLUMN public.resources.tags IS 'Free-form tags for search and filtering';
COMMENT ON COLUMN public.resources.download_count IS 'Number of times the resource has been accessed/downloaded';
COMMENT ON COLUMN public.resources.is_featured IS 'Admin-flagged featured resources shown at the top';
COMMENT ON COLUMN public.resources.sort_order IS 'Custom sort order (lower = first)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_expires_at ON public.resources(expires_at);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_resources_is_featured ON public.resources(is_featured) WHERE is_featured = true;

-- ============================================
-- 2. ADD 'tool' TO resource_type ENUM
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'tool'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'resource_type')
    ) THEN
        ALTER TYPE resource_type ADD VALUE 'tool';
    END IF;
END $$;

-- ============================================
-- 3. CREATE event_resources TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    is_locked BOOLEAN DEFAULT true,
    unlock_at TIMESTAMPTZ,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, resource_id)
);

COMMENT ON TABLE public.event_resources IS 'Links resources to events/courses. Resources can be locked until event starts.';

ALTER TABLE public.event_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR event_resources
-- ============================================

-- Anyone authenticated can see event_resources
CREATE POLICY "Authenticated users can view event_resources"
ON public.event_resources FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admin has full access
CREATE POLICY "Admin full access to event_resources"
ON public.event_resources FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Event creator (ponente) can manage event_resources for their events
CREATE POLICY "Event creators can manage event_resources"
ON public.event_resources FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_resources.event_id
        AND e.created_by = auth.uid()
    )
);

-- ============================================
-- 5. UPDATE RLS FOR resources (ponente can edit own)
-- ============================================

-- Add policy for ponente to update their own resources
-- (The existing "Creators can update own resources" already covers this via created_by = auth.uid())
-- But we need to ensure ponente role is included in INSERT policy
DO $$
BEGIN
    -- Drop and recreate the insert policy to include 'ponente'
    DROP POLICY IF EXISTS "Psychologists can create resources" ON public.resources;
    
    CREATE POLICY "Staff can create resources"
    ON public.resources FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('psychologist', 'admin', 'ponente')
        )
    );
END $$;

-- ============================================
-- 6. FUNCTION: increment_resource_downloads
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(p_resource_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.resources
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = p_resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. INDEXES FOR event_resources
-- ============================================
CREATE INDEX IF NOT EXISTS idx_event_resources_event ON public.event_resources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_resource ON public.event_resources(resource_id);
