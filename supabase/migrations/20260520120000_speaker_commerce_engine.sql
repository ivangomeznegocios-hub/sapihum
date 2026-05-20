-- ============================================
-- Migration: Speaker Commerce Engine
-- Attribution links, commission rules, immutable sale snapshots, and manual payout requests.
-- ============================================

-- 1. Commercial rules by channel/scope.
CREATE TABLE IF NOT EXISTS public.sales_commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL DEFAULT 'global',
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sale_origin TEXT NOT NULL DEFAULT 'sapihum_channel',
    speaker_percentage DECIMAL(7,6) NOT NULL,
    sapihum_percentage DECIMAL(7,6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sales_commission_rules_scope_check
        CHECK (scope IN ('global', 'event', 'speaker_event')),
    CONSTRAINT sales_commission_rules_sale_origin_check
        CHECK (sale_origin IN ('speaker_direct', 'sapihum_channel', 'manual_adjustment')),
    CONSTRAINT sales_commission_rules_percentages_check
        CHECK (
            speaker_percentage >= 0
            AND sapihum_percentage >= 0
            AND speaker_percentage <= 1
            AND sapihum_percentage <= 1
            AND abs((speaker_percentage + sapihum_percentage) - 1) < 0.0001
        ),
    CONSTRAINT sales_commission_rules_scope_shape_check
        CHECK (
            (scope = 'global' AND event_id IS NULL)
            OR (scope = 'event' AND event_id IS NOT NULL AND speaker_id IS NULL)
            OR (scope = 'speaker_event' AND event_id IS NOT NULL AND speaker_id IS NOT NULL)
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_commission_rules_global_unique
    ON public.sales_commission_rules (sale_origin)
    WHERE scope = 'global' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS sales_commission_rules_event_unique
    ON public.sales_commission_rules (event_id, sale_origin)
    WHERE scope = 'event' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS sales_commission_rules_speaker_event_unique
    ON public.sales_commission_rules (event_id, speaker_id, sale_origin)
    WHERE scope = 'speaker_event' AND is_active = true;

CREATE INDEX IF NOT EXISTS sales_commission_rules_lookup_idx
    ON public.sales_commission_rules (scope, event_id, speaker_id, sale_origin, is_active);

COMMENT ON TABLE public.sales_commission_rules IS 'Admin-managed commercial rules. Sales copy the active rule into speaker_earnings at purchase time.';

-- Seed default global rules without overriding admin changes.
INSERT INTO public.sales_commission_rules (scope, sale_origin, speaker_percentage, sapihum_percentage)
VALUES
    ('global', 'speaker_direct', 0.800000, 0.200000),
    ('global', 'sapihum_channel', 0.500000, 0.500000)
ON CONFLICT DO NOTHING;

ALTER TABLE public.sales_commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to sales commission rules"
    ON public.sales_commission_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Speakers can view own commercial rules"
    ON public.sales_commission_rules FOR SELECT
    USING (
        scope = 'global'
        OR speaker_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.event_speakers es
            WHERE es.event_id = sales_commission_rules.event_id
              AND es.speaker_id = auth.uid()
        )
    );

-- 2. Unique commercial sales links per event/speaker.
CREATE TABLE IF NOT EXISTS public.event_speaker_sales_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE DEFAULT public.generate_invite_code(10),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS event_speaker_sales_links_event_idx
    ON public.event_speaker_sales_links (event_id);

CREATE INDEX IF NOT EXISTS event_speaker_sales_links_speaker_idx
    ON public.event_speaker_sales_links (speaker_id);

CREATE INDEX IF NOT EXISTS event_speaker_sales_links_code_active_idx
    ON public.event_speaker_sales_links (code, is_active);

COMMENT ON TABLE public.event_speaker_sales_links IS 'Commercial attribution links for event/speaker sales.';

ALTER TABLE public.event_speaker_sales_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to event speaker sales links"
    ON public.event_speaker_sales_links FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Speakers can view own event sales links"
    ON public.event_speaker_sales_links FOR SELECT
    USING (speaker_id = auth.uid());

CREATE POLICY "Speakers can create own assigned event sales links"
    ON public.event_speaker_sales_links FOR INSERT
    WITH CHECK (
        speaker_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.event_speakers es
            WHERE es.event_id = event_speaker_sales_links.event_id
              AND es.speaker_id = auth.uid()
        )
    );

-- 3. Extend existing earnings with the financial snapshot. No existing columns are renamed.
ALTER TABLE public.speaker_earnings
    ADD COLUMN IF NOT EXISTS sale_origin TEXT DEFAULT 'sapihum_channel',
    ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS sapihum_amount DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS attributed_speaker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sales_link_id UUID REFERENCES public.event_speaker_sales_links(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS commission_rule_id UUID REFERENCES public.sales_commission_rules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS commission_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payout_request_id UUID,
    ADD COLUMN IF NOT EXISTS financial_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS source_purchase_type TEXT,
    ADD COLUMN IF NOT EXISTS source_purchase_id UUID;

UPDATE public.speaker_earnings
SET
    sale_origin = COALESCE(sale_origin, 'sapihum_channel'),
    price_type = COALESCE(price_type, CASE WHEN earning_type::text = 'manual_bonus' THEN 'manual' ELSE 'public' END),
    amount_paid = COALESCE(amount_paid, gross_amount),
    sapihum_amount = COALESCE(sapihum_amount, GREATEST(gross_amount - net_amount, 0)),
    attributed_speaker_id = COALESCE(attributed_speaker_id, speaker_id),
    financial_status = COALESCE(
        financial_status,
        CASE
            WHEN status::text = 'released' THEN 'available'
            WHEN status::text = 'voided' THEN 'cancelled'
            ELSE 'pending'
        END
    ),
    locked_at = COALESCE(locked_at, created_at)
WHERE sale_origin IS NULL
   OR price_type IS NULL
   OR amount_paid IS NULL
   OR sapihum_amount IS NULL
   OR attributed_speaker_id IS NULL
   OR financial_status IS NULL
   OR locked_at IS NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'speaker_earnings_sale_origin_check'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_sale_origin_check
            CHECK (sale_origin IN ('speaker_direct', 'sapihum_channel', 'manual_adjustment'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'speaker_earnings_price_type_check'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_price_type_check
            CHECK (price_type IN ('public', 'member', 'manual'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'speaker_earnings_financial_status_check'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_financial_status_check
            CHECK (financial_status IN ('pending', 'available', 'requested', 'paid', 'cancelled'));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'speaker_earnings_source_purchase_type_check'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_source_purchase_type_check
            CHECK (source_purchase_type IS NULL OR source_purchase_type IN ('event_purchase', 'formation_purchase', 'manual'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS speaker_earnings_financial_status_idx
    ON public.speaker_earnings (financial_status, speaker_id);

CREATE INDEX IF NOT EXISTS speaker_earnings_sale_origin_idx
    ON public.speaker_earnings (sale_origin, event_id);

CREATE INDEX IF NOT EXISTS speaker_earnings_source_purchase_idx
    ON public.speaker_earnings (source_purchase_type, source_purchase_id);

COMMENT ON COLUMN public.speaker_earnings.commission_snapshot IS 'Immutable copy of the rule and attribution used when the sale was closed.';
COMMENT ON COLUMN public.speaker_earnings.locked_at IS 'Set when a sale calculation is created. Future rule changes must not recalculate this row.';

-- 4. Manual payout request workflow.
CREATE TABLE IF NOT EXISTS public.speaker_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'requested',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT speaker_payout_requests_status_check
        CHECK (status IN ('requested', 'approved', 'paid', 'rejected', 'cancelled')),
    CONSTRAINT speaker_payout_requests_amount_check
        CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS public.speaker_payout_request_items (
    payout_request_id UUID NOT NULL REFERENCES public.speaker_payout_requests(id) ON DELETE CASCADE,
    speaker_earning_id UUID NOT NULL REFERENCES public.speaker_earnings(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (payout_request_id, speaker_earning_id),
    CONSTRAINT speaker_payout_request_items_amount_check CHECK (amount >= 0)
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'speaker_earnings_payout_request_id_fkey'
    ) THEN
        ALTER TABLE public.speaker_earnings
            ADD CONSTRAINT speaker_earnings_payout_request_id_fkey
            FOREIGN KEY (payout_request_id)
            REFERENCES public.speaker_payout_requests(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS speaker_payout_requests_speaker_status_idx
    ON public.speaker_payout_requests (speaker_id, status);

ALTER TABLE public.speaker_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_payout_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speakers can view own payout requests"
    ON public.speaker_payout_requests FOR SELECT
    USING (speaker_id = auth.uid());

CREATE POLICY "Speakers can create own payout requests"
    ON public.speaker_payout_requests FOR INSERT
    WITH CHECK (speaker_id = auth.uid());

CREATE POLICY "Admins full access to payout requests"
    ON public.speaker_payout_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Speakers can view own payout request items"
    ON public.speaker_payout_request_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.speaker_payout_requests spr
            WHERE spr.id = speaker_payout_request_items.payout_request_id
              AND spr.speaker_id = auth.uid()
        )
    );

CREATE POLICY "Admins full access to payout request items"
    ON public.speaker_payout_request_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Member pricing exception knobs for admin use.
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS member_discount_rule_disabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS member_discount_minimum_mxn DECIMAL(10,2) NOT NULL DEFAULT 200.00;

COMMENT ON COLUMN public.events.member_discount_rule_disabled IS 'Admin override for the minimum member discount rule.';
COMMENT ON COLUMN public.events.member_discount_minimum_mxn IS 'Minimum discount expected between public price and member price when discounted member pricing is used.';

-- Keep old release helper aligned with the new financial status.
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
        financial_status = 'available',
        released_at = NOW(),
        updated_at = NOW()
    WHERE
        status = 'pending'
        AND COALESCE(financial_status, 'pending') = 'pending'
        AND release_date <= CURRENT_DATE
        AND is_frozen = false
        AND payout_request_id IS NULL
        AND paid_at IS NULL;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;

-- Defensive trigger: prevent destructive financial edits once requested or paid.
CREATE OR REPLACE FUNCTION public.prevent_locked_speaker_earning_financial_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.financial_status IN ('requested', 'paid')
       OR OLD.requested_at IS NOT NULL
       OR OLD.paid_at IS NOT NULL THEN
        IF (
            NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
            OR NEW.amount_paid IS DISTINCT FROM OLD.amount_paid
            OR NEW.net_amount IS DISTINCT FROM OLD.net_amount
            OR NEW.sapihum_amount IS DISTINCT FROM OLD.sapihum_amount
            OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
            OR NEW.compensation_value IS DISTINCT FROM OLD.compensation_value
            OR NEW.sale_origin IS DISTINCT FROM OLD.sale_origin
            OR NEW.commission_rule_id IS DISTINCT FROM OLD.commission_rule_id
            OR NEW.commission_snapshot IS DISTINCT FROM OLD.commission_snapshot
        ) THEN
            RAISE EXCEPTION 'Speaker earning financial fields are locked after payout request or payment';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_locked_speaker_earning_financial_edits
    ON public.speaker_earnings;

CREATE TRIGGER prevent_locked_speaker_earning_financial_edits
    BEFORE UPDATE ON public.speaker_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_locked_speaker_earning_financial_edits();
