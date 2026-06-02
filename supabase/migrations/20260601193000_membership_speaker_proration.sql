-- Membership speaker proration aligned with current membership plans.
-- Speaker pool = monthly plan amount * 50%, prorated across qualified
-- membership-included events consumed by that member in the month.

DROP FUNCTION IF EXISTS public.calculate_membership_earning(NUMERIC, INTEGER);

CREATE OR REPLACE FUNCTION public.calculate_membership_earning(
    p_plan_monthly_amount DECIMAL DEFAULT 290.00,
    p_total_events INTEGER DEFAULT 1,
    p_speaker_pool_rate DECIMAL DEFAULT 0.50,
    p_speaker_count INTEGER DEFAULT 1
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_plan_monthly_amount <= 0 OR p_total_events <= 0 OR p_speaker_pool_rate <= 0 OR p_speaker_count <= 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((p_plan_monthly_amount * p_speaker_pool_rate) / p_total_events / p_speaker_count, 2);
END;
$$;

COMMENT ON FUNCTION public.calculate_membership_earning(DECIMAL, INTEGER, DECIMAL, INTEGER) IS
    'Calculates speaker earning for membership-included content: plan monthly amount * speaker pool rate / qualified monthly membership events / speaker count.';

GRANT ALL ON FUNCTION public.calculate_membership_earning(DECIMAL, INTEGER, DECIMAL, INTEGER) TO anon;
GRANT ALL ON FUNCTION public.calculate_membership_earning(DECIMAL, INTEGER, DECIMAL, INTEGER) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_membership_earning(DECIMAL, INTEGER, DECIMAL, INTEGER) TO service_role;
