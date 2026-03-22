-- ============================================
-- Migration 024: Payment System (Stripe Subscriptions + One-time)
-- ============================================

-- 1. Add Stripe fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'stripe';

-- Create index for fast Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Plan info
    membership_level INTEGER NOT NULL,
    
    -- Stripe info
    payment_provider TEXT NOT NULL DEFAULT 'stripe'
        CHECK (payment_provider IN ('stripe', 'paypal', 'manual')),
    provider_subscription_id TEXT UNIQUE,   -- Stripe sub_xxx
    provider_customer_id TEXT,              -- Stripe cus_xxx
    provider_price_id TEXT,                 -- Stripe price_xxx
    
    -- Lifecycle status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired', 'paused', 'incomplete')),
    
    -- Billing cycle
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.subscriptions IS 'Tracks subscription lifecycle for membership plans';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Payment transactions table (history of all charges)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    
    -- What was purchased
    purchase_type TEXT NOT NULL
        CHECK (purchase_type IN ('subscription_payment', 'ai_credits', 'event_purchase')),
    purchase_reference_id TEXT,   -- membership_level, event_id, etc.
    
    -- Amounts
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'MXN',
    
    -- Stripe info
    payment_provider TEXT NOT NULL DEFAULT 'stripe',
    provider_session_id TEXT,    -- Stripe checkout session_id
    provider_payment_id TEXT,    -- Stripe payment_intent_id
    provider_invoice_id TEXT,    -- Stripe invoice_id
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Extra data
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.payment_transactions IS 'Complete history of all payment charges (recurring and one-time)';

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES - subscriptions
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins full access to subscriptions"
    ON public.subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role (webhooks) can manage all subscriptions
-- (handled by service_role key, no policy needed)

-- ============================================
-- 5. RLS POLICIES - payment_transactions
-- ============================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.payment_transactions FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all transactions
CREATE POLICY "Admins full access to transactions"
    ON public.payment_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub ON public.subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_profile ON public.payment_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription ON public.payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_session ON public.payment_transactions(provider_session_id);
