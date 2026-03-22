-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 003_resources_and_events
-- ============================================

-- ============================================
-- 1. CREATE ENUMS
-- ============================================
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'link', 'document');
CREATE TYPE visibility_type AS ENUM ('public', 'private', 'members_only');
CREATE TYPE event_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');

-- ============================================
-- 2. CREATE RESOURCES TABLE
-- ============================================
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type resource_type NOT NULL DEFAULT 'link',
    visibility visibility_type NOT NULL DEFAULT 'private',
    thumbnail_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.resources IS 'Educational resources: PDFs, videos, documents for patients';

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE PATIENT_RESOURCES (Assignments)
-- ============================================
CREATE TABLE public.patient_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    -- Prevent duplicate assignments
    UNIQUE(resource_id, patient_id)
);

COMMENT ON TABLE public.patient_resources IS 'Tracks resources assigned to specific patients by psychologists';

ALTER TABLE public.patient_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE EVENTS TABLE (Workshops/Talleres)
-- ============================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status event_status NOT NULL DEFAULT 'upcoming',
    location TEXT, -- Could be 'online' or physical address
    meeting_link TEXT, -- For live events
    recording_url TEXT, -- For completed events
    max_attendees INTEGER,
    price DECIMAL(10, 2) DEFAULT 0, -- Free events = 0
    is_members_only BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'Workshops, talleres, and community events';

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE EVENT_REGISTRATIONS
-- ============================================
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    -- Prevent duplicate registrations
    UNIQUE(event_id, user_id)
);

COMMENT ON TABLE public.event_registrations IS 'User registrations for events';

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR RESOURCES
-- ============================================

-- Public resources are visible to everyone
CREATE POLICY "Public resources visible to all"
ON public.resources FOR SELECT
USING (visibility = 'public');

-- Members can see members_only resources
CREATE POLICY "Members can see members_only resources"
ON public.resources FOR SELECT
USING (
    visibility = 'members_only'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND subscription_status IN ('trial', 'active')
    )
);

-- Users can see their assigned private resources
CREATE POLICY "Users see assigned private resources"
ON public.resources FOR SELECT
USING (
    visibility = 'private'
    AND EXISTS (
        SELECT 1 FROM public.patient_resources pr
        WHERE pr.resource_id = resources.id
        AND pr.patient_id = auth.uid()
    )
);

-- Psychologists can see all resources they created
CREATE POLICY "Creators can see own resources"
ON public.resources FOR SELECT
USING (created_by = auth.uid());

-- Psychologists can create resources
CREATE POLICY "Psychologists can create resources"
ON public.resources FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('psychologist', 'admin')
    )
);

-- Creators can update their resources
CREATE POLICY "Creators can update own resources"
ON public.resources FOR UPDATE
USING (created_by = auth.uid());

-- Creators can delete their resources
CREATE POLICY "Creators can delete own resources"
ON public.resources FOR DELETE
USING (created_by = auth.uid());

-- Admins have full access
CREATE POLICY "Admins full access to resources"
ON public.resources FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 7. RLS POLICIES FOR PATIENT_RESOURCES
-- ============================================

-- Patients can see their assignments
CREATE POLICY "Patients see own resource assignments"
ON public.patient_resources FOR SELECT
USING (patient_id = auth.uid());

-- Psychologists can see assignments they made
CREATE POLICY "Psychologists see own assignments"
ON public.patient_resources FOR SELECT
USING (assigned_by = auth.uid());

-- Psychologists can create assignments for their patients
CREATE POLICY "Psychologists can assign resources"
ON public.patient_resources FOR INSERT
WITH CHECK (
    assigned_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = patient_resources.patient_id
        AND ppr.status = 'active'
    )
);

-- Psychologists can delete their assignments
CREATE POLICY "Psychologists can remove assignments"
ON public.patient_resources FOR DELETE
USING (assigned_by = auth.uid());

-- ============================================
-- 8. RLS POLICIES FOR EVENTS
-- ============================================

-- Anyone can see upcoming public events
CREATE POLICY "Anyone can see public events"
ON public.events FOR SELECT
USING (NOT is_members_only OR is_members_only = false);

-- Members can see members_only events
CREATE POLICY "Members can see members_only events"
ON public.events FOR SELECT
USING (
    is_members_only = true
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND subscription_status IN ('trial', 'active')
    )
);

-- Admins and psychologists can manage events
CREATE POLICY "Staff can manage events"
ON public.events FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('psychologist', 'admin')
    )
);

-- ============================================
-- 9. RLS POLICIES FOR EVENT_REGISTRATIONS
-- ============================================

-- Users can see their own registrations
CREATE POLICY "Users see own registrations"
ON public.event_registrations FOR SELECT
USING (user_id = auth.uid());

-- Event creators/admins can see all registrations for their events
CREATE POLICY "Staff see event registrations"
ON public.event_registrations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE e.id = event_registrations.event_id
        AND (e.created_by = auth.uid() OR p.role = 'admin')
    )
);

-- Users can register for events
CREATE POLICY "Users can register for events"
ON public.event_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can cancel their registration
CREATE POLICY "Users can cancel registration"
ON public.event_registrations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete registration"
ON public.event_registrations FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 10. TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_visibility ON public.resources(visibility);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);

CREATE INDEX idx_patient_resources_patient ON public.patient_resources(patient_id);
CREATE INDEX idx_patient_resources_resource ON public.patient_resources(resource_id);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_members_only ON public.events(is_members_only);

CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);
