-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 035_marketing_services
-- Marketing services tracking for level-3 members
-- ============================================

-- ============================================
-- 1. MARKETING SERVICES TABLE
-- Tracks status of each marketing service per user
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_key TEXT NOT NULL CHECK (service_key IN (
        'community_manager',
        'content_creation',
        'assistant',
        'seo',
        'ads',
        'google_business'
    )),
    status TEXT NOT NULL DEFAULT 'pending_brief' CHECK (status IN (
        'pending_brief',
        'in_progress',
        'active',
        'paused'
    )),
    notes TEXT,              -- Notes visible to the user
    admin_notes TEXT,         -- Internal admin-only notes
    assigned_to TEXT,         -- Name/contact of assigned team member
    contact_link TEXT,        -- WhatsApp/email link for the assigned person
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Each user can only have one row per service
    UNIQUE(user_id, service_key)
);

COMMENT ON TABLE public.marketing_services IS 'Tracks the status of each marketing service per level-3 member';

-- ============================================
-- 2. MARKETING BRIEFS TABLE
-- Brand brief submissions from level-3 members
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT,
    tone_of_voice TEXT,
    target_audience TEXT,
    colors_and_style TEXT,
    social_links TEXT,
    goals TEXT,
    additional_notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted',
        'reviewed',
        'approved'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- One brief per user (can be updated)
    UNIQUE(user_id)
);

COMMENT ON TABLE public.marketing_briefs IS 'Brand brief submissions from level-3 marketing premium members';

-- ============================================
-- 3. ENABLE RLS
-- ============================================
ALTER TABLE public.marketing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_briefs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES — marketing_services
-- ============================================

-- Users can view their own services
CREATE POLICY "Users can view own marketing services"
ON public.marketing_services FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own services (limited fields via app logic)
CREATE POLICY "Users can update own marketing services"
ON public.marketing_services FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins full access marketing services"
ON public.marketing_services FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Service role can insert (for initialization)
CREATE POLICY "Service role can insert marketing services"
ON public.marketing_services FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. RLS POLICIES — marketing_briefs
-- ============================================

-- Users can view their own brief
CREATE POLICY "Users can view own marketing brief"
ON public.marketing_briefs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own brief
CREATE POLICY "Users can insert own marketing brief"
ON public.marketing_briefs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own brief
CREATE POLICY "Users can update own marketing brief"
ON public.marketing_briefs FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins full access marketing briefs"
ON public.marketing_briefs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 6. TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_marketing_services_updated_at
    BEFORE UPDATE ON public.marketing_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_briefs_updated_at
    BEFORE UPDATE ON public.marketing_briefs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX idx_marketing_services_user ON public.marketing_services(user_id);
CREATE INDEX idx_marketing_services_status ON public.marketing_services(status);
CREATE INDEX idx_marketing_briefs_user ON public.marketing_briefs(user_id);
CREATE INDEX idx_marketing_briefs_status ON public.marketing_briefs(status);
