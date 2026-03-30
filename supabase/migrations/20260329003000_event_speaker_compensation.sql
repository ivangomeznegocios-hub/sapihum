-- ============================================
-- Migration: Event-level speaker compensation
-- Each speaker assignment can now define how that event pays out:
-- percentage of sale, fixed amount per sale, or variable/manual.
-- ============================================

ALTER TABLE public.event_speakers
    ADD COLUMN IF NOT EXISTS compensation_type TEXT,
    ADD COLUMN IF NOT EXISTS compensation_value DECIMAL(10,4);

UPDATE public.event_speakers es
SET
    compensation_type = COALESCE(es.compensation_type, 'percentage'),
    compensation_value = COALESCE(es.compensation_value, s.commission_rate, 0.5000)
FROM public.speakers s
WHERE es.speaker_id = s.id
  AND (es.compensation_type IS NULL OR es.compensation_value IS NULL);

UPDATE public.event_speakers
SET compensation_type = COALESCE(compensation_type, 'percentage');

UPDATE public.event_speakers
SET compensation_value = COALESCE(compensation_value, 0.5000)
WHERE compensation_type = 'percentage';

ALTER TABLE public.event_speakers
    ALTER COLUMN compensation_type SET DEFAULT 'percentage',
    ALTER COLUMN compensation_type SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'event_speakers_compensation_type_check'
    ) THEN
        ALTER TABLE public.event_speakers
            ADD CONSTRAINT event_speakers_compensation_type_check
            CHECK (compensation_type IN ('percentage', 'fixed', 'variable'));
    END IF;
END $$;

COMMENT ON COLUMN public.event_speakers.compensation_type IS 'How this event pays this speaker: percentage, fixed, or variable/manual';
COMMENT ON COLUMN public.event_speakers.compensation_value IS 'Percentage stores decimal rate (0.50 = 50%). Fixed stores MXN amount. Variable can remain null.';

ALTER TABLE public.speaker_earnings
    ADD COLUMN IF NOT EXISTS compensation_type TEXT,
    ADD COLUMN IF NOT EXISTS compensation_value DECIMAL(10,4);

UPDATE public.speaker_earnings
SET
    compensation_type = COALESCE(
        compensation_type,
        CASE
            WHEN earning_type::text = 'manual_bonus' THEN 'fixed'
            ELSE 'percentage'
        END
    ),
    compensation_value = COALESCE(
        compensation_value,
        CASE
            WHEN earning_type::text = 'manual_bonus' THEN COALESCE(net_amount, gross_amount, 0)
            ELSE COALESCE(commission_rate, 0.5000)
        END
    )
WHERE compensation_type IS NULL OR compensation_value IS NULL;

UPDATE public.speaker_earnings
SET compensation_value = COALESCE(compensation_value, 0.5000)
WHERE compensation_type = 'percentage';

UPDATE public.speaker_earnings
SET compensation_value = COALESCE(compensation_value, net_amount, gross_amount, 0)
WHERE compensation_type = 'fixed';

ALTER TABLE public.speaker_earnings
    ALTER COLUMN compensation_type SET DEFAULT 'percentage',
    ALTER COLUMN compensation_type SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'speaker_earnings_compensation_type_check'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_compensation_type_check
            CHECK (compensation_type IN ('percentage', 'fixed', 'variable'));
    END IF;
END $$;

COMMENT ON COLUMN public.speaker_earnings.compensation_type IS 'Resolved compensation model used for this earning';
COMMENT ON COLUMN public.speaker_earnings.compensation_value IS 'Resolved value used for this earning. Percentage stores decimal rate (0.50 = 50%). Fixed stores MXN amount.';

COMMENT ON COLUMN public.speakers.commission_rate IS 'Legacy fallback rate. New event payouts should use event_speakers.compensation_type/value.';
