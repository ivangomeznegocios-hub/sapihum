CREATE TABLE IF NOT EXISTS public.speaker_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (BTRIM(title) <> ''),
    description TEXT,
    youtube_url TEXT NOT NULL CHECK (BTRIM(youtube_url) <> ''),
    youtube_video_id TEXT NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.speaker_tutorials IS 'Global YouTube tutorial library for speaker onboarding and operations.';
COMMENT ON COLUMN public.speaker_tutorials.youtube_video_id IS 'Validated YouTube video identifier used to render safe embeds.';

CREATE INDEX IF NOT EXISTS idx_speaker_tutorials_active_sort
    ON public.speaker_tutorials (is_active, sort_order, created_at DESC);

ALTER TABLE public.speaker_tutorials ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.speaker_tutorials TO authenticated;
GRANT ALL ON TABLE public.speaker_tutorials TO service_role;

CREATE POLICY "Ponentes can view active speaker tutorials"
    ON public.speaker_tutorials
    FOR SELECT
    TO authenticated
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'ponente'
        )
    );

CREATE POLICY "Admins can manage speaker tutorials"
    ON public.speaker_tutorials
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
        )
    );

DROP TRIGGER IF EXISTS update_speaker_tutorials_updated_at ON public.speaker_tutorials;
CREATE TRIGGER update_speaker_tutorials_updated_at
    BEFORE UPDATE ON public.speaker_tutorials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
