-- ==========================================
-- MIGRATION: 019_ai_credits_system
-- Description: Adds AI credit tracking to profiles and creates transaction history
-- ==========================================

-- 1. Add ai_minutes_available to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'ai_minutes_available') THEN
        ALTER TABLE public.profiles ADD COLUMN ai_minutes_available INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Create transactions history table
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for recharges, negative for usage
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('monthly_grant', 'purchase', 'usage', 'admin_adjustment')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own credit transactions"
    ON public.ai_credit_transactions
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Policy: Admins can do anything
CREATE POLICY "Admins can view and manage all credit transactions"
    ON public.ai_credit_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_transactions_profile_id ON public.ai_credit_transactions(profile_id);
