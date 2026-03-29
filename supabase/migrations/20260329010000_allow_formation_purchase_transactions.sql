ALTER TABLE public.payment_transactions
    DROP CONSTRAINT IF EXISTS payment_transactions_purchase_type_check;

ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_purchase_type_check
    CHECK (purchase_type IN ('subscription_payment', 'ai_credits', 'event_purchase', 'formation_purchase'));
