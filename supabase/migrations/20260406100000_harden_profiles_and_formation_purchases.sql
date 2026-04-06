-- ============================================================================
-- Security hardening for self-service profile updates and formation purchases
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_self_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
    v_previous JSONB;
    v_next JSONB;
    v_allowed_columns TEXT[] := ARRAY[
        'full_name',
        'avatar_url',
        'specialty',
        'bio',
        'hourly_rate',
        'office_address',
        'services',
        'availability',
        'payment_methods',
        'phone',
        'cedula_profesional',
        'populations_served',
        'therapeutic_approaches',
        'languages',
        'years_experience',
        'education',
        'accepts_referral_terms',
        'referral_terms_accepted_at',
        'email_notifications',
        'session_reminders',
        'preferred_payment_method',
        'updated_at'
    ];
BEGIN
    IF COALESCE(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Not allowed to modify this profile';
    END IF;

    v_previous := to_jsonb(OLD) - v_allowed_columns;
    v_next := to_jsonb(NEW) - v_allowed_columns;

    IF v_next IS DISTINCT FROM v_previous THEN
        RAISE EXCEPTION 'Users can only update safe self-service profile fields';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_self_sensitive_changes ON public.profiles;
CREATE TRIGGER trg_prevent_profile_self_sensitive_changes
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_self_sensitive_changes();

DROP POLICY IF EXISTS "Anyone can create formation purchases" ON public.formation_purchases;

-- Reinforce the hardened state in case these legacy policies still exist.
DROP POLICY IF EXISTS "Users can create own entitlements" ON public.event_entitlements;
DROP POLICY IF EXISTS "Users can claim matching entitlements" ON public.event_entitlements;

NOTIFY pgrst, 'reload schema';
