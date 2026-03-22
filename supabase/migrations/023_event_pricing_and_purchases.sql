-- ============================================
-- Migration 023: Event Pricing & Guest Purchases
-- ============================================

-- 1. Add dual pricing columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS member_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS member_access_type TEXT DEFAULT 'free'
    CHECK (member_access_type IN ('free', 'discounted', 'full_price'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_embeddable BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS og_description TEXT;

-- 2. Create event_purchases table for guest/non-member purchases
CREATE TABLE IF NOT EXISTS public.event_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'MXN',
    payment_method TEXT DEFAULT 'manual',   -- manual, transfer, card
    payment_reference TEXT,                 -- Transaction ID or reference
    access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.event_purchases IS 'Tracks individual event purchases by non-member guests';

ALTER TABLE public.event_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES FOR EVENT_PURCHASES
-- ============================================

-- Admins can see all purchases
CREATE POLICY "Admins full access to event purchases"
    ON public.event_purchases FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Event creators (ponentes) can see purchases for their events
CREATE POLICY "Event creators can view their event purchases"
    ON public.event_purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_purchases.event_id
            AND e.created_by = auth.uid()
        )
    );

-- Anyone can create a purchase (guest checkout)
CREATE POLICY "Anyone can create event purchases"
    ON public.event_purchases FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_event_purchases_event ON public.event_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_email ON public.event_purchases(email);
CREATE INDEX IF NOT EXISTS idx_event_purchases_token ON public.event_purchases(access_token);
CREATE INDEX IF NOT EXISTS idx_event_purchases_status ON public.event_purchases(status);
CREATE INDEX IF NOT EXISTS idx_events_member_access ON public.events(member_access_type);
