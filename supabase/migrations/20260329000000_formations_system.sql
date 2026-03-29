-- ============================================
-- Migration: Formations System
-- Groups events/courses into training programs
-- with bundle pricing and progressive certification
-- ============================================

-- 1. FORMATIONS (the parent program)
CREATE TABLE IF NOT EXISTS public.formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    -- Pricing
    bundle_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    bundle_member_price DECIMAL(10,2) DEFAULT 0,
    -- Certification
    individual_certificate_type TEXT DEFAULT 'participation'
        CHECK (individual_certificate_type IN ('none', 'participation', 'completion')),
    full_certificate_type TEXT DEFAULT 'specialized'
        CHECK (full_certificate_type IN ('none', 'completion', 'specialized')),
    full_certificate_label TEXT DEFAULT 'Certificación de Formación Completa',
    -- Status
    status TEXT DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.formations IS 'Training programs that bundle multiple events/courses together';

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

-- 2. FORMATION_COURSES (junction: formation ↔ event)
CREATE TABLE IF NOT EXISTS public.formation_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(formation_id, event_id)
);

COMMENT ON TABLE public.formation_courses IS 'Links events/courses to a formation program in order';

ALTER TABLE public.formation_courses ENABLE ROW LEVEL SECURITY;

-- 3. FORMATION_PURCHASES (bundle purchases)
CREATE TABLE IF NOT EXISTS public.formation_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'MXN',
    payment_reference TEXT,
    provider_session_id TEXT,
    provider_payment_id TEXT,
    access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    metadata JSONB DEFAULT '{}',
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.formation_purchases IS 'Tracks bundle purchases for complete formation programs';

ALTER TABLE public.formation_purchases ENABLE ROW LEVEL SECURITY;

-- 4. FORMATION_PROGRESS (per-course completion tracking)
CREATE TABLE IF NOT EXISTS public.formation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_issued BOOLEAN DEFAULT false,
    certificate_issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(formation_id, email, event_id)
);

COMMENT ON TABLE public.formation_progress IS 'Tracks individual course completion within a formation for certification';

ALTER TABLE public.formation_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- formations: anyone can read active, admins can manage
CREATE POLICY "Anyone can see active formations"
    ON public.formations FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admins full access to formations"
    ON public.formations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- formation_courses: anyone can read, admins can manage
CREATE POLICY "Anyone can see formation courses"
    ON public.formation_courses FOR SELECT
    USING (true);

CREATE POLICY "Admins full access to formation courses"
    ON public.formation_courses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- formation_purchases: users see own, admins see all
CREATE POLICY "Users can see own formation purchases"
    ON public.formation_purchases FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Anyone can create formation purchases"
    ON public.formation_purchases FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins full access to formation purchases"
    ON public.formation_purchases FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- formation_progress: users see own, admins see all
CREATE POLICY "Users can see own formation progress"
    ON public.formation_progress FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins full access to formation progress"
    ON public.formation_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_formations_slug ON public.formations(slug);
CREATE INDEX IF NOT EXISTS idx_formations_status ON public.formations(status);
CREATE INDEX IF NOT EXISTS idx_formation_courses_formation ON public.formation_courses(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_courses_event ON public.formation_courses(event_id);
CREATE INDEX IF NOT EXISTS idx_formation_purchases_formation ON public.formation_purchases(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_purchases_email ON public.formation_purchases(email);
CREATE INDEX IF NOT EXISTS idx_formation_purchases_user ON public.formation_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_purchases_status ON public.formation_purchases(status);
CREATE INDEX IF NOT EXISTS idx_formation_progress_formation ON public.formation_progress(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_progress_email ON public.formation_progress(email);
CREATE INDEX IF NOT EXISTS idx_formation_progress_user ON public.formation_progress(user_id);

-- ============================================
-- 7. TRIGGERS
-- ============================================
CREATE TRIGGER update_formations_updated_at
    BEFORE UPDATE ON public.formations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. Update events table: replace text formation_track with UUID FK
-- ============================================
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_formation ON public.events(formation_id) WHERE formation_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
