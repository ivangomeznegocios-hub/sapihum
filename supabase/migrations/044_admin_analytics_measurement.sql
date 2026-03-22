-- ============================================
-- Migration 044: Admin analytics, attribution and unit economics
-- ============================================

-- 1) Visitor and session tracking
CREATE TABLE IF NOT EXISTS public.analytics_visitors (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    consent_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_touch JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_touch JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_non_direct_touch JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY,
    visitor_id UUID NOT NULL REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    landing_path TEXT,
    referrer TEXT,
    attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attribution_touches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name TEXT,
    touch_source TEXT,
    touch_medium TEXT,
    touch_campaign TEXT,
    touch_term TEXT,
    touch_content TEXT,
    ref TEXT,
    gclid TEXT,
    fbclid TEXT,
    channel TEXT NOT NULL DEFAULT 'direct',
    is_direct BOOLEAN NOT NULL DEFAULT true,
    referrer TEXT,
    landing_path TEXT,
    target_plan TEXT,
    target_specialization TEXT,
    funnel TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES public.analytics_visitors(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    event_source TEXT NOT NULL DEFAULT 'client',
    page_path TEXT,
    attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Manual marketing inputs
CREATE TABLE IF NOT EXISTS public.marketing_cost_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    channel TEXT NOT NULL,
    campaign TEXT,
    cost_type TEXT NOT NULL,
    owner TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.manual_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_name TEXT,
    client_name TEXT,
    email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    closed_at TIMESTAMPTZ NOT NULL,
    stage TEXT NOT NULL DEFAULT 'won',
    channel TEXT NOT NULL,
    campaign TEXT,
    owner TEXT,
    notes TEXT,
    attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) Attribution snapshots on operational revenue tables
ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS analytics_visitor_id UUID REFERENCES public.analytics_visitors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS analytics_session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS analytics_visitor_id UUID REFERENCES public.analytics_visitors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS analytics_session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.event_purchases
    ADD COLUMN IF NOT EXISTS analytics_visitor_id UUID REFERENCES public.analytics_visitors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS analytics_session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS attribution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_user ON public.analytics_visitors(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_last_seen ON public.analytics_visitors(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor ON public.analytics_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON public.analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON public.analytics_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_attribution_touches_visitor ON public.attribution_touches(visitor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_touches_user ON public.attribution_touches(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_touches_channel ON public.attribution_touches(channel, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_cost_entries_period ON public.marketing_cost_entries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_marketing_cost_entries_channel_campaign ON public.marketing_cost_entries(channel, campaign);

CREATE INDEX IF NOT EXISTS idx_manual_deals_closed_at ON public.manual_deals(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_deals_channel_campaign ON public.manual_deals(channel, campaign);
CREATE INDEX IF NOT EXISTS idx_manual_deals_stage ON public.manual_deals(stage);

CREATE INDEX IF NOT EXISTS idx_subscriptions_analytics_visitor ON public.subscriptions(analytics_visitor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_analytics_visitor ON public.payment_transactions(analytics_visitor_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_analytics_visitor ON public.event_purchases(analytics_visitor_id);

-- 5) RLS
ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_touches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_deals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_visitors'
        AND policyname = 'Admins full access to analytics visitors'
    ) THEN
        CREATE POLICY "Admins full access to analytics visitors"
            ON public.analytics_visitors
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_sessions'
        AND policyname = 'Admins full access to analytics sessions'
    ) THEN
        CREATE POLICY "Admins full access to analytics sessions"
            ON public.analytics_sessions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'attribution_touches'
        AND policyname = 'Admins full access to attribution touches'
    ) THEN
        CREATE POLICY "Admins full access to attribution touches"
            ON public.attribution_touches
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'analytics_events'
        AND policyname = 'Admins full access to analytics events'
    ) THEN
        CREATE POLICY "Admins full access to analytics events"
            ON public.analytics_events
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'marketing_cost_entries'
        AND policyname = 'Admins full access to marketing cost entries'
    ) THEN
        CREATE POLICY "Admins full access to marketing cost entries"
            ON public.marketing_cost_entries
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'manual_deals'
        AND policyname = 'Admins full access to manual deals'
    ) THEN
        CREATE POLICY "Admins full access to manual deals"
            ON public.manual_deals
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- 6) updated_at triggers
DROP TRIGGER IF EXISTS update_analytics_visitors_updated_at ON public.analytics_visitors;
CREATE TRIGGER update_analytics_visitors_updated_at
    BEFORE UPDATE ON public.analytics_visitors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_sessions_updated_at ON public.analytics_sessions;
CREATE TRIGGER update_analytics_sessions_updated_at
    BEFORE UPDATE ON public.analytics_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_cost_entries_updated_at ON public.marketing_cost_entries;
CREATE TRIGGER update_marketing_cost_entries_updated_at
    BEFORE UPDATE ON public.marketing_cost_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_manual_deals_updated_at ON public.manual_deals;
CREATE TRIGGER update_manual_deals_updated_at
    BEFORE UPDATE ON public.manual_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
