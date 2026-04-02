-- ============================================
-- Migration: Event checkout reservations + replay access
-- ============================================

ALTER TABLE public.event_purchases
    ADD COLUMN IF NOT EXISTS checkout_session_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_event_purchases_event_pending_expiry
    ON public.event_purchases (event_id, status, checkout_session_expires_at);

WITH ranked_pending AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY event_id, COALESCE(user_id::TEXT, LOWER(BTRIM(email)))
            ORDER BY purchased_at DESC, id DESC
        ) AS pending_rank
    FROM public.event_purchases
    WHERE status = 'pending'
)
UPDATE public.event_purchases AS purchases
SET
    status = 'cancelled',
    metadata = COALESCE(purchases.metadata, '{}'::jsonb) || JSONB_BUILD_OBJECT(
        'cancelled_reason', 'deduplicated_pending_checkout',
        'cancelled_at', NOW()
    )
FROM ranked_pending
WHERE purchases.id = ranked_pending.id
  AND ranked_pending.pending_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_purchases_pending_identity
    ON public.event_purchases (
        event_id,
        COALESCE(user_id::TEXT, LOWER(BTRIM(email)))
    )
    WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.reserve_event_checkout_purchase(
    p_event_id UUID,
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_amount_paid DECIMAL(10, 2) DEFAULT 0,
    p_currency TEXT DEFAULT 'MXN',
    p_payment_method TEXT DEFAULT 'card',
    p_analytics_visitor_id UUID DEFAULT NULL,
    p_analytics_session_id UUID DEFAULT NULL,
    p_attribution_snapshot JSONB DEFAULT '{}'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_enforce_capacity BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    purchase_id UUID,
    reservation_state TEXT,
    checkout_session_id TEXT,
    checkout_session_expires_at TIMESTAMPTZ,
    checkout_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_normalized_email TEXT := LOWER(BTRIM(COALESCE(p_email, '')));
    v_max_attendees INTEGER;
    v_reserved_count INTEGER := 0;
BEGIN
    IF p_event_id IS NULL THEN
        RAISE EXCEPTION 'EVENT_ID_REQUIRED';
    END IF;

    IF v_normalized_email = '' THEN
        RAISE EXCEPTION 'EMAIL_REQUIRED';
    END IF;

    SELECT events.max_attendees
    INTO v_max_attendees
    FROM public.events AS events
    WHERE events.id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    UPDATE public.event_purchases
    SET
        status = 'cancelled',
        metadata = COALESCE(metadata, '{}'::jsonb) || JSONB_BUILD_OBJECT(
            'cancelled_reason', 'stale_checkout',
            'cancelled_at', NOW()
        )
    WHERE event_id = p_event_id
      AND status = 'pending'
      AND COALESCE(checkout_session_expires_at, purchased_at + INTERVAL '30 minutes') <= NOW();

    RETURN QUERY
    SELECT
        purchases.id,
        'reused'::TEXT,
        purchases.provider_session_id,
        purchases.checkout_session_expires_at,
        NULLIF(COALESCE(purchases.metadata ->> 'checkout_url', ''), '')
    FROM public.event_purchases AS purchases
    WHERE purchases.event_id = p_event_id
      AND purchases.status = 'pending'
      AND (
        (p_user_id IS NOT NULL AND purchases.user_id = p_user_id)
        OR LOWER(BTRIM(purchases.email)) = v_normalized_email
      )
    ORDER BY purchases.purchased_at DESC, purchases.id DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN;
    END IF;

    IF p_enforce_capacity AND v_max_attendees IS NOT NULL THEN
        WITH current_access AS (
            SELECT DISTINCT 'user:' || registrations.user_id::TEXT AS identity_key
            FROM public.event_registrations AS registrations
            WHERE registrations.event_id = p_event_id
              AND registrations.status = 'registered'
              AND registrations.user_id IS NOT NULL

            UNION

            SELECT DISTINCT COALESCE(
                CASE
                    WHEN entitlements.user_id IS NOT NULL THEN 'user:' || entitlements.user_id::TEXT
                    ELSE NULL
                END,
                CASE
                    WHEN entitlements.identity_key IS NOT NULL THEN 'email:' || entitlements.identity_key
                    ELSE NULL
                END
            ) AS identity_key
            FROM public.event_entitlements AS entitlements
            WHERE entitlements.event_id = p_event_id
              AND entitlements.status = 'active'
              AND (entitlements.ends_at IS NULL OR entitlements.ends_at > NOW())
              AND entitlements.source_type IN ('registration', 'purchase', 'membership')

            UNION

            SELECT DISTINCT COALESCE(
                CASE
                    WHEN purchases.user_id IS NOT NULL THEN 'user:' || purchases.user_id::TEXT
                    ELSE NULL
                END,
                CASE
                    WHEN purchases.email IS NOT NULL THEN 'email:' || LOWER(BTRIM(purchases.email))
                    ELSE NULL
                END
            ) AS identity_key
            FROM public.event_purchases AS purchases
            WHERE purchases.event_id = p_event_id
              AND purchases.status = 'pending'
              AND COALESCE(purchases.checkout_session_expires_at, purchases.purchased_at + INTERVAL '30 minutes') > NOW()
        )
        SELECT COUNT(*)
        INTO v_reserved_count
        FROM current_access
        WHERE identity_key IS NOT NULL;

        IF v_reserved_count >= v_max_attendees THEN
            RAISE EXCEPTION 'EVENT_CAPACITY_REACHED';
        END IF;
    END IF;

    RETURN QUERY
    INSERT INTO public.event_purchases (
        event_id,
        user_id,
        email,
        full_name,
        amount_paid,
        currency,
        payment_method,
        status,
        purchased_at,
        analytics_visitor_id,
        analytics_session_id,
        attribution_snapshot,
        metadata
    )
    VALUES (
        p_event_id,
        p_user_id,
        v_normalized_email,
        NULLIF(BTRIM(COALESCE(p_full_name, '')), ''),
        COALESCE(p_amount_paid, 0),
        COALESCE(NULLIF(BTRIM(COALESCE(p_currency, '')), ''), 'MXN'),
        COALESCE(NULLIF(BTRIM(COALESCE(p_payment_method, '')), ''), 'card'),
        'pending',
        NOW(),
        p_analytics_visitor_id,
        p_analytics_session_id,
        COALESCE(p_attribution_snapshot, '{}'::jsonb),
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING
        id,
        'created'::TEXT,
        provider_session_id,
        checkout_session_expires_at,
        NULL::TEXT;
END;
$$;

INSERT INTO public.event_entitlements (
    event_id,
    user_id,
    email,
    access_kind,
    source_type,
    source_reference,
    status,
    starts_at,
    ends_at,
    metadata
)
SELECT
    entitlements.event_id,
    entitlements.user_id,
    entitlements.email,
    'replay_access',
    entitlements.source_type,
    entitlements.source_reference,
    entitlements.status,
    entitlements.starts_at,
    COALESCE(entitlements.ends_at, events.recording_expires_at),
    COALESCE(entitlements.metadata, '{}'::jsonb) || JSONB_BUILD_OBJECT(
        'migration', '20260402110000_event_checkout_reservations_and_replay_access'
    )
FROM public.event_entitlements AS entitlements
INNER JOIN public.events AS events
    ON events.id = entitlements.event_id
WHERE entitlements.access_kind = 'live_access'
  AND entitlements.status = 'active'
  AND events.event_type NOT IN ('course', 'on_demand')
ON CONFLICT (event_id, access_kind, identity_key, source_type) DO NOTHING;
