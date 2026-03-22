-- ============================================
-- Migration 022b: Speaker tables, RLS, and event policies
-- Run AFTER 022 has been committed
-- ============================================

-- 1. Create speakers table (public profile for ponentes)
CREATE TABLE IF NOT EXISTS public.speakers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    headline TEXT,
    bio TEXT,
    photo_url TEXT,
    credentials TEXT[] DEFAULT '{}',
    formations TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.speakers IS 'Public profiles for event speakers/ponentes';

ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;

-- 2. Create event_speakers junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.event_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'speaker' CHECK (role IN ('speaker', 'moderator', 'host')),
    display_order INTEGER DEFAULT 0,
    UNIQUE(event_id, speaker_id)
);

COMMENT ON TABLE public.event_speakers IS 'Links events to their speakers';

ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES FOR SPEAKERS
-- ============================================

CREATE POLICY "Anyone can view public speakers"
    ON public.speakers FOR SELECT
    USING (is_public = true);

CREATE POLICY "Speakers can view own profile"
    ON public.speakers FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Ponentes can update own speaker profile"
    ON public.speakers FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Ponentes can create own speaker profile"
    ON public.speakers FOR INSERT
    WITH CHECK (
        id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ponente', 'admin')
        )
    );

CREATE POLICY "Admins full access to speakers"
    ON public.speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 4. RLS POLICIES FOR EVENT_SPEAKERS
-- ============================================

CREATE POLICY "Anyone can view event speakers"
    ON public.event_speakers FOR SELECT
    USING (true);

CREATE POLICY "Event creators and admins can manage event speakers"
    ON public.event_speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_speakers.event_id
            AND (
                e.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role = 'admin'
                )
            )
        )
    );

-- ============================================
-- 5. UPDATE EVENT POLICIES FOR PONENTE ROLE
-- ============================================

DROP POLICY IF EXISTS "Staff can manage events" ON public.events;

CREATE POLICY "Admins and ponentes can manage events"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ponente', 'admin')
        )
    );

CREATE POLICY "Ponentes can modify own events"
    ON public.events FOR UPDATE
    USING (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ponente'
        )
    );

CREATE POLICY "Ponentes can delete own events"
    ON public.events FOR DELETE
    USING (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ponente'
        )
    );

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_speakers_is_public ON public.speakers(is_public);
CREATE INDEX IF NOT EXISTS idx_event_speakers_event ON public.event_speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_speakers_speaker ON public.event_speakers(speaker_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_speakers_updated_at ON public.speakers;
CREATE TRIGGER update_speakers_updated_at
    BEFORE UPDATE ON public.speakers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. AUTO-CREATE SPEAKER PROFILE FOR PONENTES
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_ponente_speaker_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NEW.role = 'ponente' AND (OLD.role IS NULL OR OLD.role != 'ponente') THEN
        INSERT INTO public.speakers (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
    AFTER UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_ponente_speaker_profile();
