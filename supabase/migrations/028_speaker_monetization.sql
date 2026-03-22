-- ============================================
-- Migration 028: Speaker Monetization System
-- Earnings tracking, attendance validation (90% rule),
-- 30-day release period, and month-end close
-- ============================================

-- 1. Add commission_rate to speakers
ALTER TABLE public.speakers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0.5000;

COMMENT ON COLUMN public.speakers.commission_rate IS 'Commission % for premium program sales (0.50 = 50%)';

-- ============================================
-- 2. ATTENDANCE LOG — Tracks student connection time
-- ============================================
CREATE TABLE IF NOT EXISTS public.speaker_attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Time tracking
    join_time TIMESTAMPTZ NOT NULL,
    leave_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    session_duration_minutes INTEGER NOT NULL DEFAULT 0,

    -- 90% validation
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    qualifies BOOLEAN NOT NULL DEFAULT false,

    -- Source of the record
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'embedded_page', 'api', 'jitsi', 'youtube')),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- One log per student per event (can be updated)
    UNIQUE(event_id, student_id)
);

COMMENT ON TABLE public.speaker_attendance_log IS 'Tracks student connection time for the 90% attendance validation rule';

ALTER TABLE public.speaker_attendance_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. EARNINGS TABLE — Per-student per-event income
-- ============================================

-- Earning type enum
DO $$ BEGIN
    CREATE TYPE earning_type AS ENUM ('membership_proration', 'premium_commission');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Earning status enum
DO $$ BEGIN
    CREATE TYPE earning_status AS ENUM ('pending', 'released', 'voided');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.speaker_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Earning model
    earning_type earning_type NOT NULL DEFAULT 'membership_proration',

    -- Amounts
    gross_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- 30-day release rule
    status earning_status NOT NULL DEFAULT 'pending',
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    release_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),

    released_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,

    -- Payment linkage
    source_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    attendance_log_id UUID REFERENCES public.speaker_attendance_log(id) ON DELETE SET NULL,

    -- Month grouping for month-end close
    month_key TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM'),

    -- Month-end close
    is_frozen BOOLEAN NOT NULL DEFAULT false,
    frozen_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One earning per student per event per speaker
    UNIQUE(speaker_id, event_id, student_id)
);

COMMENT ON TABLE public.speaker_earnings IS 'Tracks speaker earnings per student/event with 30-day release period';

ALTER TABLE public.speaker_earnings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. MONTH-END CLOSE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.speaker_month_close (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_key TEXT NOT NULL UNIQUE,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    total_released DECIMAL(10,2) DEFAULT 0,
    total_voided DECIMAL(10,2) DEFAULT 0,
    total_pending DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.speaker_month_close IS 'Tracks monthly close events for speaker earnings';

ALTER TABLE public.speaker_month_close ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES — speaker_attendance_log
-- ============================================

-- Speakers (ponentes) can see attendance for their own events
CREATE POLICY "Ponentes can view attendance for own events"
    ON public.speaker_attendance_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = speaker_attendance_log.event_id
            AND e.created_by = auth.uid()
        )
    );

-- Students can see their own attendance
CREATE POLICY "Students can view own attendance"
    ON public.speaker_attendance_log FOR SELECT
    USING (student_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins full access to attendance log"
    ON public.speaker_attendance_log FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role (webhooks/embedded pages) can insert attendance
-- Handled by service_role key, no policy needed

-- ============================================
-- 6. RLS POLICIES — speaker_earnings
-- ============================================

-- Speakers see own earnings
CREATE POLICY "Speakers can view own earnings"
    ON public.speaker_earnings FOR SELECT
    USING (speaker_id = auth.uid());

-- Ponentes can see earnings for events they created (to see student payment status)
CREATE POLICY "Ponentes can view earnings for own events"
    ON public.speaker_earnings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = speaker_earnings.event_id
            AND e.created_by = auth.uid()
        )
    );

-- Admins full access
CREATE POLICY "Admins full access to speaker earnings"
    ON public.speaker_earnings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 7. RLS POLICIES — speaker_month_close
-- ============================================

-- Admins only
CREATE POLICY "Admins full access to month close"
    ON public.speaker_month_close FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Speakers can view close records (read only)
CREATE POLICY "Speakers can view month close records"
    ON public.speaker_month_close FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('ponente', 'admin')
        )
    );

-- ============================================
-- 8. FUNCTION — Auto-release earnings past 30 days
-- ============================================
CREATE OR REPLACE FUNCTION public.release_mature_earnings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.speaker_earnings
    SET
        status = 'released',
        released_at = NOW(),
        updated_at = NOW()
    WHERE
        status = 'pending'
        AND release_date <= CURRENT_DATE
        AND is_frozen = false;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;

COMMENT ON FUNCTION public.release_mature_earnings() IS 'Releases all earnings that have passed the 30-day hold period';

-- ============================================
-- 9. FUNCTION — Calculate membership proration
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_membership_earning(
    p_pool_amount DECIMAL DEFAULT 110.00,
    p_total_events INTEGER DEFAULT 1
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_total_events <= 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_pool_amount / p_total_events, 2);
END;
$$;

COMMENT ON FUNCTION public.calculate_membership_earning IS 'Calculates the prorated earning per event: G = 110 / E';

-- ============================================
-- 10. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS update_speaker_earnings_updated_at ON public.speaker_earnings;
CREATE TRIGGER update_speaker_earnings_updated_at
    BEFORE UPDATE ON public.speaker_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_log_event ON public.speaker_attendance_log(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_log_student ON public.speaker_attendance_log(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_log_qualifies ON public.speaker_attendance_log(qualifies) WHERE qualifies = true;

CREATE INDEX IF NOT EXISTS idx_speaker_earnings_speaker ON public.speaker_earnings(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_event ON public.speaker_earnings(event_id);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_student ON public.speaker_earnings(student_id);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_status ON public.speaker_earnings(status);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_release_date ON public.speaker_earnings(release_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_month ON public.speaker_earnings(month_key);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_frozen ON public.speaker_earnings(is_frozen) WHERE is_frozen = false;
CREATE INDEX IF NOT EXISTS idx_month_close_key ON public.speaker_month_close(month_key);
