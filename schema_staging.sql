


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."appointment_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'scheduled',
    'completed'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."assignment_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'expired'
);


ALTER TYPE "public"."assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update',
    'delete',
    'view',
    'export'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."document_category" AS ENUM (
    'test_result',
    'referral',
    'consent',
    'report',
    'intake_form',
    'other'
);


ALTER TYPE "public"."document_category" OWNER TO "postgres";


CREATE TYPE "public"."earning_status" AS ENUM (
    'pending',
    'released',
    'voided'
);


ALTER TYPE "public"."earning_status" OWNER TO "postgres";


CREATE TYPE "public"."earning_type" AS ENUM (
    'membership_proration',
    'premium_commission',
    'manual_bonus'
);


ALTER TYPE "public"."earning_type" OWNER TO "postgres";


CREATE TYPE "public"."event_status" AS ENUM (
    'draft',
    'upcoming',
    'live',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type_enum" AS ENUM (
    'live',
    'on_demand',
    'course'
);


ALTER TYPE "public"."event_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."resource_type" AS ENUM (
    'pdf',
    'video',
    'audio',
    'link',
    'document',
    'tool'
);


ALTER TYPE "public"."resource_type" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'trial',
    'active',
    'past_due',
    'cancelled',
    'inactive'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'reviewed'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."task_type" AS ENUM (
    'journal',
    'reading',
    'exercise',
    'form',
    'general'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


CREATE TYPE "public"."tool_category" AS ENUM (
    'test',
    'questionnaire',
    'task',
    'exercise',
    'scale'
);


ALTER TYPE "public"."tool_category" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'psychologist',
    'patient',
    'ponente',
    'support'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."visibility_type" AS ENUM (
    'public',
    'private',
    'members_only'
);


ALTER TYPE "public"."visibility_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."acquire_payment_webhook_event"("p_provider" "text", "p_provider_event_id" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF p_provider IS NULL OR btrim(p_provider) = '' THEN
        RAISE EXCEPTION 'provider is required';
    END IF;

    IF p_provider_event_id IS NULL OR btrim(p_provider_event_id) = '' THEN
        RAISE EXCEPTION 'provider_event_id is required';
    END IF;

    INSERT INTO public.payment_webhook_events (
        provider,
        provider_event_id,
        payload,
        status,
        attempts,
        locked_at
    )
    VALUES (
        p_provider,
        p_provider_event_id,
        COALESCE(p_payload, '{}'::jsonb),
        'processing',
        1,
        NOW()
    )
    ON CONFLICT (provider, provider_event_id) DO UPDATE
        SET payload = COALESCE(EXCLUDED.payload, public.payment_webhook_events.payload),
            status = 'processing',
            attempts = public.payment_webhook_events.attempts + 1,
            locked_at = NOW(),
            error_message = NULL,
            failed_at = NULL,
            processed_at = NULL,
            updated_at = NOW()
        WHERE public.payment_webhook_events.status = 'failed'
           OR public.payment_webhook_events.locked_at < NOW() - INTERVAL '15 minutes'
    RETURNING status INTO v_status;

    IF FOUND THEN
        RETURN TRUE;
    END IF;

    SELECT status
    INTO v_status
    FROM public.payment_webhook_events
    WHERE provider = p_provider
      AND provider_event_id = p_provider_event_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."acquire_payment_webhook_event"("p_provider" "text", "p_provider_event_id" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."are_public_referrals_enabled"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN COALESCE(
        (SELECT value::text::boolean FROM public.platform_settings WHERE key = 'allow_public_referrals'),
        false
    );
END;
$$;


ALTER FUNCTION "public"."are_public_referrals_enabled"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."are_public_referrals_enabled"() IS 'Check if psychologists can directly refer to colleagues (admin toggle)';



CREATE OR REPLACE FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric DEFAULT 110.00, "p_total_events" integer DEFAULT 1) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    IF p_total_events <= 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_pool_amount / p_total_events, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric, "p_total_events" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric, "p_total_events" integer) IS 'Calculates the prorated earning per event: G = 110 / E';



CREATE OR REPLACE FUNCTION "public"."consume_ai_minutes"("p_minutes" integer, "p_source_ref" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS TABLE("profile_id" "uuid", "transaction_id" "uuid", "previous_balance" integer, "new_balance" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_profile_id UUID := auth.uid();
    v_source_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_minutes IS NULL OR p_minutes <= 0 THEN
        RAISE EXCEPTION 'p_minutes must be greater than zero';
    END IF;

    IF v_source_ref IS NULL THEN
        v_source_ref := 'ai-consume:' || gen_random_uuid()::TEXT;
    END IF;

    SELECT
        t.id,
        p.ai_minutes_available
    INTO transaction_id, new_balance
    FROM public.ai_credit_transactions t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.source_ref = v_source_ref
      AND t.profile_id = v_profile_id
    LIMIT 1;

    IF FOUND THEN
        profile_id := v_profile_id;
        previous_balance := new_balance;
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE public.profiles
    SET ai_minutes_available = COALESCE(ai_minutes_available, 0) - p_minutes
    WHERE id = v_profile_id
      AND COALESCE(ai_minutes_available, 0) >= p_minutes
    RETURNING ai_minutes_available
    INTO new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient AI minutes';
    END IF;

    previous_balance := new_balance + p_minutes;
    profile_id := v_profile_id;

    INSERT INTO public.ai_credit_transactions (
        profile_id,
        amount,
        transaction_type,
        description,
        source_ref
    )
    VALUES (
        v_profile_id,
        -p_minutes,
        'usage',
        COALESCE(p_description, 'AI minutes consumed'),
        v_source_ref
    )
    RETURNING id
    INTO transaction_id;

    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."consume_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invite_code"("length" integer DEFAULT 8) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; result TEXT := ''; i INT;
BEGIN FOR i IN 1..length LOOP result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1); END LOOP; RETURN result; END; $$;


ALTER FUNCTION "public"."generate_invite_code"("length" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_ponente_speaker_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    IF NEW.role = 'ponente' AND (OLD.role IS NULL OR OLD.role != 'ponente') THEN
        INSERT INTO public.speakers (id)
        VALUES (NEW.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_ponente_speaker_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND membership_level >= required_level
    );
END;
$$;


ALTER FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) IS 'Check if a user has at least the required membership level. Use in RLS policies.';



CREATE OR REPLACE FUNCTION "public"."increment_event_views"("event_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE events
  SET views = views + 1
  WHERE id = event_id;
END;
$$;


ALTER FUNCTION "public"."increment_event_views"("event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_invite_use_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN UPDATE public.invite_codes SET use_count = use_count + 1 WHERE id = NEW.invite_code_id; RETURN NEW; END; $$;


ALTER FUNCTION "public"."increment_invite_use_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_resource_downloads"("p_resource_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.resources
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = p_resource_id;
END;
$$;


ALTER FUNCTION "public"."increment_resource_downloads"("p_resource_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_clinical_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID;
    action_type public.audit_action;
    target_patient_id UUID;
    target_psychologist_id UUID;
    record_uuid UUID;
    table_name TEXT;
    payload JSONB;
BEGIN
    -- Get current authenticated user
    user_id := auth.uid();
    
    -- If no authenticated user (e.g. system background task), use a fallback or skip
    -- But since RLS enforces auth.uid() for clinical stuff, it will usually be set.
    -- If null, we might be a service role. We'll log it as null psychologist (will violate constraint if not handled)
    
    table_name := TG_TABLE_NAME;
    
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        target_patient_id := NEW.patient_id;
        target_psychologist_id := NEW.psychologist_id;
        record_uuid := NEW.id;
        -- On INSERT, payload is just the new ID to keep the log small
        payload := jsonb_build_object('id', NEW.id);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        target_patient_id := NEW.patient_id;
        target_psychologist_id := NEW.psychologist_id;
        record_uuid := NEW.id;
        -- On UPDATE, we could store diffs, but doing ID is enough to fulfill audit rules for now
        payload := jsonb_build_object('id', NEW.id);
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        target_patient_id := OLD.patient_id;
        target_psychologist_id := OLD.psychologist_id;
        record_uuid := OLD.id;
        payload := jsonb_build_object('id', OLD.id);
    END IF;
    
    -- We require psychologist_id to not be null because of the table schema constraint.
    -- If the user who triggered this is an admin but NOT the psychologist,
    -- we might want to log the admin as the actor, but the table schema expects `psychologist_id`.
    -- The schema says: `psychologist_id UUID NOT NULL REFERENCES profiles(id)`. 
    -- So we will log the actual actor if possible, otherwise fallback to the document's assigned psychologist_id.
    
    INSERT INTO public.clinical_audit_log (
        psychologist_id, 
        patient_id, 
        action, 
        record_type, 
        record_id, 
        details
    ) VALUES (
        COALESCE(user_id, target_psychologist_id), -- The actor
        target_patient_id, 
        action_type, 
        table_name, 
        record_uuid, 
        payload
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."log_clinical_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_payment_webhook_failed"("p_provider" "text", "p_provider_event_id" "text", "p_error_message" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    UPDATE public.payment_webhook_events
    SET status = 'failed',
        failed_at = NOW(),
        error_message = p_error_message,
        locked_at = NULL,
        updated_at = NOW()
    WHERE provider = p_provider
      AND provider_event_id = p_provider_event_id
      AND status IN ('processing', 'failed');

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_payment_webhook_failed"("p_provider" "text", "p_provider_event_id" "text", "p_error_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_payment_webhook_processed"("p_provider" "text", "p_provider_event_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    UPDATE public.payment_webhook_events
    SET status = 'processed',
        processed_at = NOW(),
        locked_at = NULL,
        error_message = NULL,
        updated_at = NOW()
    WHERE provider = p_provider
      AND provider_event_id = p_provider_event_id
      AND status IN ('processing', 'failed');

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_payment_webhook_processed"("p_provider" "text", "p_provider_event_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_appointment_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF coalesce(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF v_role = 'psychologist' AND OLD.psychologist_id = auth.uid() THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Appointments cannot be reassigned';
        END IF;
        RETURN NEW;
    END IF;

    IF v_role = 'patient' AND OLD.patient_id = auth.uid() THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.start_time IS DISTINCT FROM OLD.start_time
           OR NEW.end_time IS DISTINCT FROM OLD.end_time
           OR NEW.meeting_link IS DISTINCT FROM OLD.meeting_link
           OR NEW.price IS DISTINCT FROM OLD.price
           OR NEW.notes IS DISTINCT FROM OLD.notes
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Patients can only cancel their own appointments';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status <> 'cancelled' THEN
            RAISE EXCEPTION 'Patients can only cancel their own appointments';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed to modify this appointment';
END;
$$;


ALTER FUNCTION "public"."prevent_appointment_sensitive_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_message_tampering"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF coalesce(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NEW.is_read IS DISTINCT FROM OLD.is_read
       AND NEW.is_read IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Messages can only be marked as read';
    END IF;

    IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Messages are immutable except for read state';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_message_tampering"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_profile_self_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."prevent_profile_self_sensitive_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_task_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF coalesce(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF v_role = 'patient' AND OLD.patient_id = auth.uid() THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.title IS DISTINCT FROM OLD.title
           OR NEW.description IS DISTINCT FROM OLD.description
           OR NEW.type IS DISTINCT FROM OLD.type
           OR NEW.due_date IS DISTINCT FROM OLD.due_date
           OR NEW.content IS DISTINCT FROM OLD.content
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Patients can only submit task responses';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status <> 'completed' THEN
            RAISE EXCEPTION 'Patients can only mark tasks completed';
        END IF;
        RETURN NEW;
    END IF;

    IF v_role = 'psychologist' AND OLD.psychologist_id = auth.uid() THEN
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Tasks cannot be reassigned';
        END IF;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed to modify this task';
END;
$$;


ALTER FUNCTION "public"."prevent_task_sensitive_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_tool_assignment_sensitive_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF coalesce(auth.role(), '') = 'service_role' THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_role = 'admin' THEN
        RETURN NEW;
    END IF;

    IF v_role = 'psychologist' AND OLD.psychologist_id = auth.uid() THEN
        IF NEW.tool_id IS DISTINCT FROM OLD.tool_id
           OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at THEN
            RAISE EXCEPTION 'Tool assignments cannot be reassigned';
        END IF;
        RETURN NEW;
    END IF;

    IF v_role = 'patient' AND OLD.patient_id = auth.uid() THEN
        IF NEW.tool_id IS DISTINCT FROM OLD.tool_id
           OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
           OR NEW.psychologist_id IS DISTINCT FROM OLD.psychologist_id
           OR NEW.instructions IS DISTINCT FROM OLD.instructions
           OR NEW.due_date IS DISTINCT FROM OLD.due_date
           OR NEW.results_visible IS DISTINCT FROM OLD.results_visible
           OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at THEN
            RAISE EXCEPTION 'Patients can only update assignment progress';
        END IF;

        IF NEW.status IS DISTINCT FROM OLD.status
           AND NEW.status NOT IN ('in_progress', 'completed') THEN
            RAISE EXCEPTION 'Patients can only mark assignments in progress or completed';
        END IF;

        IF NEW.completed_at IS DISTINCT FROM OLD.completed_at
           AND (NEW.status <> 'completed' OR NEW.completed_at IS NULL) THEN
            RAISE EXCEPTION 'completed_at is only allowed when marking an assignment completed';
        END IF;

        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Not allowed to modify this tool assignment';
END;
$$;


ALTER FUNCTION "public"."prevent_tool_assignment_sensitive_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_ai_minutes"("p_minutes" integer, "p_source_ref" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS TABLE("profile_id" "uuid", "transaction_id" "uuid", "previous_balance" integer, "new_balance" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_profile_id UUID := auth.uid();
    v_source_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_minutes IS NULL OR p_minutes <= 0 THEN
        RAISE EXCEPTION 'p_minutes must be greater than zero';
    END IF;

    IF v_source_ref IS NULL THEN
        v_source_ref := 'ai-refund:' || gen_random_uuid()::TEXT;
    END IF;

    SELECT
        t.id,
        p.ai_minutes_available
    INTO transaction_id, new_balance
    FROM public.ai_credit_transactions t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE t.source_ref = v_source_ref
      AND t.profile_id = v_profile_id
    LIMIT 1;

    IF FOUND THEN
        profile_id := v_profile_id;
        previous_balance := new_balance;
        RETURN NEXT;
        RETURN;
    END IF;

    UPDATE public.profiles
    SET ai_minutes_available = COALESCE(ai_minutes_available, 0) + p_minutes
    WHERE id = v_profile_id
    RETURNING ai_minutes_available
    INTO new_balance;

    previous_balance := new_balance - p_minutes;
    profile_id := v_profile_id;

    INSERT INTO public.ai_credit_transactions (
        profile_id,
        amount,
        transaction_type,
        description,
        source_ref
    )
    VALUES (
        v_profile_id,
        p_minutes,
        'admin_adjustment',
        COALESCE(p_description, 'AI minutes refunded'),
        v_source_ref
    )
    RETURNING id
    INTO transaction_id;

    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."refund_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_mature_earnings"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.speaker_earnings
    SET
        status = 'released',
        released_at = NOW(),
        updated_at = NOW()
    WHERE
        status = 'pending'
        AND release_date <= CURRENT_DATE
        AND is_frozen = false;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;


ALTER FUNCTION "public"."release_mature_earnings"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_mature_earnings"() IS 'Releases all earnings that have passed the 30-day hold period';



CREATE OR REPLACE FUNCTION "public"."reserve_event_checkout_purchase"("p_event_id" "uuid", "p_email" "text", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_full_name" "text" DEFAULT NULL::"text", "p_amount_paid" numeric DEFAULT 0, "p_currency" "text" DEFAULT 'MXN'::"text", "p_payment_method" "text" DEFAULT 'card'::"text", "p_analytics_visitor_id" "uuid" DEFAULT NULL::"uuid", "p_analytics_session_id" "uuid" DEFAULT NULL::"uuid", "p_attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_enforce_capacity" boolean DEFAULT true) RETURNS TABLE("purchase_id" "uuid", "reservation_state" "text", "checkout_session_id" "text", "checkout_session_expires_at" timestamp with time zone, "checkout_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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

    UPDATE public.event_purchases AS purchases
    SET
        status = 'cancelled',
        metadata = COALESCE(purchases.metadata, '{}'::jsonb) || JSONB_BUILD_OBJECT(
            'cancelled_reason', 'stale_checkout',
            'cancelled_at', NOW()
        )
    WHERE purchases.event_id = p_event_id
      AND purchases.status = 'pending'
      AND COALESCE(
        purchases.checkout_session_expires_at,
        purchases.purchased_at + INTERVAL '30 minutes'
      ) <= NOW();

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
              AND COALESCE(
                purchases.checkout_session_expires_at,
                purchases.purchased_at + INTERVAL '30 minutes'
              ) > NOW()
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
        event_purchases.id,
        'created'::TEXT,
        event_purchases.provider_session_id,
        event_purchases.checkout_session_expires_at,
        NULL::TEXT;
END;
$$;


ALTER FUNCTION "public"."reserve_event_checkout_purchase"("p_event_id" "uuid", "p_email" "text", "p_user_id" "uuid", "p_full_name" "text", "p_amount_paid" numeric, "p_currency" "text", "p_payment_method" "text", "p_analytics_visitor_id" "uuid", "p_analytics_session_id" "uuid", "p_attribution_snapshot" "jsonb", "p_metadata" "jsonb", "p_enforce_capacity" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_recording_expiration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- When event is marked as completed and has recording, set expiration
    IF NEW.status = 'completed' AND NEW.recording_url IS NOT NULL AND NEW.recording_expires_at IS NULL THEN
        NEW.recording_expires_at := COALESCE(NEW.end_time, NOW()) + (NEW.recording_available_days || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_recording_expiration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."slugify_catalog_text"("input" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
DECLARE
    normalized TEXT;
BEGIN
    normalized := LOWER(
        TRANSLATE(
            COALESCE(input, ''),
            'ÁÀÄÂáàäâÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔóòöôÚÙÜÛúùüûÑñÇç',
            'AAAAaaaaEEEEeeeeIIIIiiiiOOOOooooUUUUuuuuNnCc'
        )
    );

    normalized := REGEXP_REPLACE(normalized, '[^a-z0-9]+', '-', 'g');
    normalized := REGEXP_REPLACE(normalized, '(^-+|-+$)', '', 'g');

    RETURN NULLIF(normalized, '');
END;
$_$;


ALTER FUNCTION "public"."slugify_catalog_text"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_profile_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_growth_campaign_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


ALTER FUNCTION "public"."update_growth_campaign_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invite_code"("p_code" "text") RETURNS TABLE("code_id" "uuid", "code_owner_id" "uuid", "is_valid" boolean, "reason" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE v_code RECORD; BEGIN SELECT * INTO v_code FROM public.invite_codes ic WHERE ic.code = UPPER(p_code) LIMIT 1; IF NOT FOUND THEN RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, 'Código no encontrado'::TEXT; RETURN; END IF; IF NOT v_code.is_active THEN RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código desactivado'::TEXT; RETURN; END IF; IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código expirado'::TEXT; RETURN; END IF; IF v_code.max_uses IS NOT NULL AND v_code.use_count >= v_code.max_uses THEN RETURN QUERY SELECT v_code.id, v_code.owner_id, false, 'Código agotado'::TEXT; RETURN; END IF; RETURN QUERY SELECT v_code.id, v_code.owner_id, true, 'Código válido'::TEXT; END; $$;


ALTER FUNCTION "public"."validate_invite_code"("p_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_operation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "action_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "target_user_id" "uuid",
    "target_email" "text",
    "reason" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_operation_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_operation_logs" IS 'Audit trail for manual operational actions performed by admins.';



CREATE TABLE IF NOT EXISTS "public"."admin_operation_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "target_user_id" "uuid",
    "target_email" "text",
    "note" "text" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_operation_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_operation_notes" IS 'Internal notes used by support and admin teams for commerce/access cases.';



CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "text" DEFAULT 'default'::"text" NOT NULL,
    "cac_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "gross_margin_percent" numeric(5,2) DEFAULT 85.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "transaction_type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "source_ref" "text",
    CONSTRAINT "ai_credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['monthly_grant'::"text", 'purchase'::"text", 'usage'::"text", 'admin_adjustment'::"text"])))
);


ALTER TABLE "public"."ai_credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_id" "uuid",
    "session_id" "uuid",
    "user_id" "uuid",
    "event_name" "text" NOT NULL,
    "event_source" "text" DEFAULT 'client'::"text" NOT NULL,
    "page_path" "text",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "properties" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_sessions" (
    "id" "uuid" NOT NULL,
    "visitor_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "landing_path" "text",
    "referrer" "text",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_visitors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "consent_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "first_touch" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_touch" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_non_direct_touch" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_visitors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "public"."appointment_status" DEFAULT 'pending'::"public"."appointment_status" NOT NULL,
    "meeting_link" "text",
    "price" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" DEFAULT 'video'::"text",
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."arco_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "description" "text",
    "admin_notes" "text",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "arco_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['access'::"text", 'rectification'::"text", 'cancellation'::"text", 'opposition'::"text", 'portability'::"text"]))),
    CONSTRAINT "arco_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."arco_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."arco_requests" IS 'ARCO/GDPR data rights requests from users. Must be resolved within 20 days (LFPDPPP) or 30 days (GDPR)';



CREATE TABLE IF NOT EXISTS "public"."attribution_touches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_id" "uuid",
    "session_id" "uuid",
    "user_id" "uuid",
    "event_name" "text",
    "touch_source" "text",
    "touch_medium" "text",
    "touch_campaign" "text",
    "touch_term" "text",
    "touch_content" "text",
    "ref" "text",
    "gclid" "text",
    "fbclid" "text",
    "channel" "text" DEFAULT 'direct'::"text" NOT NULL,
    "is_direct" boolean DEFAULT true NOT NULL,
    "referrer" "text",
    "landing_path" "text",
    "target_plan" "text",
    "target_specialization" "text",
    "funnel" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attribution_touches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "status" "text" DEFAULT 'connected'::"text" NOT NULL,
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "scopes" "text"[] DEFAULT ARRAY[]::"text"[] NOT NULL,
    "selected_calendar_ids" "text"[] DEFAULT ARRAY['primary'::"text"] NOT NULL,
    "provider_account_email" "text",
    "provider_account_label" "text",
    "last_sync_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "calendar_integrations_provider_check" CHECK (("provider" = 'google'::"text")),
    CONSTRAINT "calendar_integrations_status_check" CHECK (("status" = ANY (ARRAY['connected'::"text", 'error'::"text", 'disconnected'::"text"])))
);


ALTER TABLE "public"."calendar_integrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."calendar_integrations" IS 'OAuth connections for external calendar providers used to detect busy slots outside the platform.';



CREATE TABLE IF NOT EXISTS "public"."certificate_eligibility_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "identity_key" "text" GENERATED ALWAYS AS ("lower"("btrim"("email"))) STORED,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "evaluated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reasons" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "source_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "certificate_eligibility_snapshots_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'eligible'::"text", 'ineligible'::"text", 'issued'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."certificate_eligibility_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificate_eligibility_snapshots" IS 'Stored eligibility results for future certificate issuance flows.';



CREATE TABLE IF NOT EXISTS "public"."certificate_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "requires_purchase" boolean DEFAULT false NOT NULL,
    "requires_attendance" boolean DEFAULT false NOT NULL,
    "min_attendance_percent" numeric(5,2),
    "requires_progress" boolean DEFAULT false NOT NULL,
    "min_progress_percent" numeric(5,2),
    "requires_evaluation" boolean DEFAULT false NOT NULL,
    "min_evaluation_score" numeric(6,2),
    "requires_active_membership" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."certificate_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificate_rules" IS 'Certificate and eligibility requirements for events, courses and recordings.';



CREATE TABLE IF NOT EXISTS "public"."clinical_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "patient_id" "uuid",
    "action" "public"."audit_action" NOT NULL,
    "record_type" "text" NOT NULL,
    "record_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinical_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinical_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "category" "public"."document_category" DEFAULT 'other'::"public"."document_category" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."clinical_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinical_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "type" "text" DEFAULT 'session_note'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "appointment_id" "uuid",
    "is_pinned" boolean DEFAULT false,
    "session_number" integer,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."clinical_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "consent_type" "text" NOT NULL,
    "version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "granted" boolean DEFAULT false NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consent_records_consent_type_check" CHECK (("consent_type" = ANY (ARRAY['privacy_policy'::"text", 'terms_of_service'::"text", 'clinical_data'::"text", 'ai_processing'::"text", 'marketing'::"text", 'cookies_analytics'::"text", 'cookies_functional'::"text", 'international_transfer'::"text"])))
);


ALTER TABLE "public"."consent_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."consent_records" IS 'Immutable log of all user consents for LFPDPPP and GDPR compliance';



CREATE TABLE IF NOT EXISTS "public"."event_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "identity_key" "text" GENERATED ALWAYS AS ("lower"("btrim"("email"))) STORED,
    "access_kind" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_reference" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "starts_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ends_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "event_entitlements_access_kind_check" CHECK (("access_kind" = ANY (ARRAY['live_access'::"text", 'replay_access'::"text", 'course_access'::"text", 'membership_benefit'::"text", 'bundle_child_access'::"text", 'certificate_eligibility'::"text", 'manual_support_grant'::"text"]))),
    CONSTRAINT "event_entitlements_source_type_check" CHECK (("source_type" = ANY (ARRAY['registration'::"text", 'purchase'::"text", 'membership'::"text", 'manual'::"text", 'support'::"text", 'gift'::"text", 'alliance'::"text", 'migration'::"text"]))),
    CONSTRAINT "event_entitlements_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."event_entitlements" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_entitlements" IS 'Event-level access grants for full accounts, light accounts, memberships and manual support actions.';



CREATE TABLE IF NOT EXISTS "public"."event_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "amount_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text" NOT NULL,
    "payment_method" "text" DEFAULT 'manual'::"text",
    "payment_reference" "text",
    "access_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text"),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "analytics_visitor_id" "uuid",
    "analytics_session_id" "uuid",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "provider_session_id" "text",
    "provider_payment_id" "text",
    "checkout_session_expires_at" timestamp with time zone,
    CONSTRAINT "event_purchases_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."event_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_purchases" IS 'Tracks individual event purchases by non-member guests';



CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'registered'::"text",
    "registered_at" timestamp with time zone DEFAULT "now"(),
    "attended_at" timestamp with time zone,
    "registration_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "event_registrations_status_check" CHECK (("status" = ANY (ARRAY['registered'::"text", 'attended'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "is_locked" boolean DEFAULT true,
    "unlock_at" timestamp with time zone,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_resources" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_resources" IS 'Links resources to events/courses. Resources can be locked until event starts.';



CREATE TABLE IF NOT EXISTS "public"."event_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "speaker_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'speaker'::"text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "compensation_type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "compensation_value" numeric(10,4),
    CONSTRAINT "event_speakers_compensation_type_check" CHECK (("compensation_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text", 'variable'::"text"]))),
    CONSTRAINT "event_speakers_role_check" CHECK (("role" = ANY (ARRAY['speaker'::"text", 'moderator'::"text", 'host'::"text"])))
);


ALTER TABLE "public"."event_speakers" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_speakers" IS 'Links events to their speakers';



COMMENT ON COLUMN "public"."event_speakers"."compensation_type" IS 'How this event pays this speaker: percentage, fixed, or variable/manual';



COMMENT ON COLUMN "public"."event_speakers"."compensation_value" IS 'Percentage stores decimal rate (0.50 = 50%). Fixed stores MXN amount. Variable can remain null.';



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "status" "public"."event_status" DEFAULT 'upcoming'::"public"."event_status" NOT NULL,
    "location" "text",
    "meeting_link" "text",
    "recording_url" "text",
    "max_attendees" integer,
    "price" numeric(10,2) DEFAULT 0,
    "is_members_only" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "event_type" "text" DEFAULT 'live'::"text",
    "target_audience" "text"[] DEFAULT ARRAY['public'::"text"],
    "required_subscription" "text"[],
    "recording_available_days" integer DEFAULT 20,
    "recording_expires_at" timestamp with time zone,
    "prerequisite_event_id" "uuid",
    "views" integer DEFAULT 0,
    "registration_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "subcategory" "text",
    "member_price" numeric(10,2) DEFAULT 0,
    "member_access_type" "text" DEFAULT 'free'::"text",
    "is_embeddable" boolean DEFAULT true,
    "og_description" "text",
    "session_config" "jsonb",
    "slug" "text" NOT NULL,
    "subtitle" "text",
    "seo_title" "text",
    "seo_description" "text",
    "hero_badge" "text",
    "public_cta_label" "text",
    "ideal_for" "text"[],
    "learning_outcomes" "text"[],
    "included_resources" "text"[],
    "certificate_type" "text" DEFAULT 'none'::"text",
    "formation_track" "text",
    "formation_id" "uuid",
    "material_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "specialization_code" "text",
    CONSTRAINT "events_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'networking'::"text", 'clinical'::"text", 'business'::"text"]))),
    CONSTRAINT "events_certificate_type_check" CHECK (("certificate_type" = ANY (ARRAY['none'::"text", 'participation'::"text", 'completion'::"text", 'specialized'::"text"]))),
    CONSTRAINT "events_event_type_check" CHECK (("event_type" = ANY (ARRAY['live'::"text", 'on_demand'::"text", 'course'::"text"]))),
    CONSTRAINT "events_member_access_type_check" CHECK (("member_access_type" = ANY (ARRAY['free'::"text", 'discounted'::"text", 'full_price'::"text"]))),
    CONSTRAINT "events_specialization_code_allowed" CHECK ((("specialization_code" IS NULL) OR ("specialization_code" = ANY (ARRAY['clinica'::"text", 'forense'::"text", 'educacion'::"text", 'organizacional'::"text", 'infanto_juvenil'::"text", 'neuropsicologia'::"text", 'deportiva'::"text", 'sexologia_clinica'::"text", 'psicogerontologia'::"text"]))))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."event_type" IS 'Type of event: live (real-time), on_demand (pre-recorded), course (multi-session)';



COMMENT ON COLUMN "public"."events"."target_audience" IS 'Array of allowed audiences: public, members, psychologists, patients, active_patients';



COMMENT ON COLUMN "public"."events"."required_subscription" IS 'Required subscription status to access: trial, active, or null for no requirement';



COMMENT ON COLUMN "public"."events"."recording_available_days" IS 'Number of days the recording is available after the event ends';



COMMENT ON COLUMN "public"."events"."recording_expires_at" IS 'Calculated expiration date for recording access';



COMMENT ON COLUMN "public"."events"."prerequisite_event_id" IS 'ID of event that must be completed before accessing this one';



CREATE TABLE IF NOT EXISTS "public"."exclusive_agreements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "company_logo_url" "text",
    "description" "text" NOT NULL,
    "benefits" "text"[] DEFAULT '{}'::"text"[],
    "discount_code" "text",
    "discount_percentage" numeric(5,2),
    "website_url" "text",
    "contact_email" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exclusive_agreements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."formation_certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "formation_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "identity_key" "text" NOT NULL,
    "scope_type" "text" NOT NULL,
    "scope_reference" "text" NOT NULL,
    "event_id" "uuid",
    "certificate_type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "issued_by" "uuid",
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "formation_certificates_certificate_type_check" CHECK (("certificate_type" = ANY (ARRAY['participation'::"text", 'completion'::"text", 'specialized'::"text"]))),
    CONSTRAINT "formation_certificates_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['individual_course'::"text", 'full_program'::"text"])))
);


ALTER TABLE "public"."formation_certificates" OWNER TO "postgres";


COMMENT ON TABLE "public"."formation_certificates" IS 'Persisted certificates issued for formation bundles and their individual courses';



CREATE TABLE IF NOT EXISTS "public"."formation_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "formation_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."formation_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."formation_courses" IS 'Links events/courses to a formation program in order';



CREATE TABLE IF NOT EXISTS "public"."formation_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "formation_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "certificate_issued" boolean DEFAULT false,
    "certificate_issued_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."formation_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."formation_progress" IS 'Tracks individual course completion within a formation for certification';



CREATE TABLE IF NOT EXISTS "public"."formation_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "formation_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "full_name" "text",
    "amount_paid" numeric(10,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text",
    "payment_reference" "text",
    "provider_session_id" "text",
    "provider_payment_id" "text",
    "access_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text"),
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "purchased_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    CONSTRAINT "formation_purchases_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."formation_purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."formation_purchases" IS 'Tracks bundle purchases for complete formation programs';



CREATE TABLE IF NOT EXISTS "public"."formations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text",
    "image_url" "text",
    "bundle_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "bundle_member_price" numeric(10,2) DEFAULT 0,
    "individual_certificate_type" "text" DEFAULT 'participation'::"text",
    "full_certificate_type" "text" DEFAULT 'specialized'::"text",
    "full_certificate_label" "text" DEFAULT 'Certificación de Formación Completa'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bundle_member_access_type" "text" DEFAULT 'full_price'::"text" NOT NULL,
    "total_hours" numeric(6,2) DEFAULT 0 NOT NULL,
    "material_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "specialization_code" "text",
    CONSTRAINT "formations_bundle_member_access_type_check" CHECK (("bundle_member_access_type" = ANY (ARRAY['free'::"text", 'discounted'::"text", 'full_price'::"text"]))),
    CONSTRAINT "formations_full_certificate_type_check" CHECK (("full_certificate_type" = ANY (ARRAY['none'::"text", 'completion'::"text", 'specialized'::"text"]))),
    CONSTRAINT "formations_individual_certificate_type_check" CHECK (("individual_certificate_type" = ANY (ARRAY['none'::"text", 'participation'::"text", 'completion'::"text"]))),
    CONSTRAINT "formations_specialization_code_allowed" CHECK ((("specialization_code" IS NULL) OR ("specialization_code" = ANY (ARRAY['clinica'::"text", 'forense'::"text", 'educacion'::"text", 'organizacional'::"text", 'infanto_juvenil'::"text", 'neuropsicologia'::"text", 'deportiva'::"text", 'sexologia_clinica'::"text", 'psicogerontologia'::"text"])))),
    CONSTRAINT "formations_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."formations" OWNER TO "postgres";


COMMENT ON TABLE "public"."formations" IS 'Training programs that bundle multiple events/courses together';



CREATE TABLE IF NOT EXISTS "public"."growth_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "campaign_type" "text" NOT NULL,
    "reward_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "target_roles" "text"[] DEFAULT '{psychologist,ponente}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "image_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "program_type" "text" DEFAULT 'professional_invite'::"text" NOT NULL,
    "eligible_referrer_roles" "text"[] DEFAULT '{psychologist,ponente}'::"text"[] NOT NULL,
    "eligible_referred_roles" "text"[] DEFAULT '{psychologist}'::"text"[] NOT NULL,
    "allowed_trigger_events" "text"[] DEFAULT '{signup,profile_completed,subscription,first_purchase}'::"text"[] NOT NULL,
    CONSTRAINT "growth_campaigns_campaign_type_check" CHECK (("campaign_type" = ANY (ARRAY['referral_boost'::"text", 'milestone'::"text", 'promo'::"text", 'challenge'::"text", 'custom'::"text"]))),
    CONSTRAINT "growth_campaigns_program_type_check" CHECK (("program_type" = 'professional_invite'::"text"))
);


ALTER TABLE "public"."growth_campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."growth_campaigns" IS 'Admin-managed growth campaigns, promotions and challenges for the Growth Hub';



COMMENT ON COLUMN "public"."growth_campaigns"."program_type" IS 'Program domain targeted by the campaign';



COMMENT ON COLUMN "public"."growth_campaigns"."eligible_referrer_roles" IS 'Roles that can generate rewards by inviting professionals';



COMMENT ON COLUMN "public"."growth_campaigns"."eligible_referred_roles" IS 'Roles that qualify as invited professionals for this campaign';



COMMENT ON COLUMN "public"."growth_campaigns"."allowed_trigger_events" IS 'Trigger events that can activate campaign rewards';



CREATE TABLE IF NOT EXISTS "public"."invite_attributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invite_code_id" "uuid" NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attributed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "program_type" "text" DEFAULT 'professional_invite'::"text" NOT NULL,
    CONSTRAINT "invite_attributions_program_type_check" CHECK (("program_type" = 'professional_invite'::"text")),
    CONSTRAINT "invite_attributions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'rewarded'::"text"])))
);


ALTER TABLE "public"."invite_attributions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invite_attributions"."program_type" IS 'Program origin for invite attribution events';



CREATE TABLE IF NOT EXISTS "public"."invite_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "code" "text" DEFAULT "public"."generate_invite_code"(8) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "max_uses" integer,
    "use_count" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."invite_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_reward_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attribution_id" "uuid" NOT NULL,
    "beneficiary_id" "uuid" NOT NULL,
    "reward_type" "text" NOT NULL,
    "reward_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "trigger_event" "text" NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "processed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "program_type" "text" DEFAULT 'professional_invite'::"text" NOT NULL,
    CONSTRAINT "invite_reward_events_program_type_check" CHECK (("program_type" = 'professional_invite'::"text")),
    CONSTRAINT "invite_reward_events_reward_type_check" CHECK (("reward_type" = ANY (ARRAY['credit'::"text", 'discount'::"text", 'unlock'::"text", 'commission'::"text", 'cash_bonus'::"text", 'membership_benefit'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."invite_reward_events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invite_reward_events"."program_type" IS 'Program origin for reward events. Clinical patient referrals must never write here';



CREATE TABLE IF NOT EXISTS "public"."manual_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_name" "text",
    "client_name" "text",
    "email" "text",
    "user_id" "uuid",
    "product_name" "text" NOT NULL,
    "product_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "closed_at" timestamp with time zone NOT NULL,
    "stage" "text" DEFAULT 'won'::"text" NOT NULL,
    "channel" "text" NOT NULL,
    "campaign" "text",
    "owner" "text",
    "notes" "text",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "manual_deals_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."manual_deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_briefs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "brand_name" "text",
    "tone_of_voice" "text",
    "target_audience" "text",
    "colors_and_style" "text",
    "social_links" "text",
    "goals" "text",
    "additional_notes" "text",
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "marketing_briefs_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'reviewed'::"text", 'approved'::"text"])))
);


ALTER TABLE "public"."marketing_briefs" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketing_briefs" IS 'Brand brief submissions from level-3 marketing premium members';



CREATE TABLE IF NOT EXISTS "public"."marketing_cost_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "channel" "text" NOT NULL,
    "campaign" "text",
    "cost_type" "text" NOT NULL,
    "owner" "text",
    "amount" numeric(12,2) NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "marketing_cost_entries_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."marketing_cost_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketing_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "service_key" "text" NOT NULL,
    "status" "text" DEFAULT 'pending_brief'::"text" NOT NULL,
    "notes" "text",
    "admin_notes" "text",
    "assigned_to" "text",
    "contact_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "marketing_services_service_key_check" CHECK (("service_key" = ANY (ARRAY['community_manager'::"text", 'content_creation'::"text", 'assistant'::"text", 'seo'::"text", 'ads'::"text", 'google_business'::"text"]))),
    CONSTRAINT "marketing_services_status_check" CHECK (("status" = ANY (ARRAY['pending_brief'::"text", 'in_progress'::"text", 'active'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."marketing_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."marketing_services" IS 'Tracks the status of each marketing service per level-3 member';



CREATE TABLE IF NOT EXISTS "public"."membership_entitlement_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "membership_level" integer NOT NULL,
    "specialization_code" "text",
    "scope_type" "text" NOT NULL,
    "benefit_type" "text" DEFAULT 'access'::"text" NOT NULL,
    "event_id" "uuid",
    "event_category" "text",
    "required_audience" "text",
    "discount_percent" numeric(5,2),
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "membership_entitlement_rules_benefit_type_check" CHECK (("benefit_type" = ANY (ARRAY['access'::"text", 'discount'::"text"]))),
    CONSTRAINT "membership_entitlement_rules_membership_level_check" CHECK (("membership_level" >= 1)),
    CONSTRAINT "membership_entitlement_rules_scope_required" CHECK (((("scope_type" = 'event'::"text") AND ("event_id" IS NOT NULL)) OR (("scope_type" = 'event_category'::"text") AND ("event_category" IS NOT NULL)) OR (("scope_type" = 'event_audience'::"text") AND ("required_audience" IS NOT NULL)) OR (("scope_type" = 'discount'::"text") AND ("discount_percent" IS NOT NULL)))),
    CONSTRAINT "membership_entitlement_rules_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['event_audience'::"text", 'event_category'::"text", 'event'::"text", 'discount'::"text"])))
);


ALTER TABLE "public"."membership_entitlement_rules" OWNER TO "postgres";


COMMENT ON TABLE "public"."membership_entitlement_rules" IS 'Rules that derive access or future commercial benefits from an active membership plan.';



CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "description" "text",
    "features" "text"[] NOT NULL,
    "stripe_link" "text",
    "is_popular" boolean DEFAULT false,
    "plan_type" "text"
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_content_not_empty" CHECK (("btrim"("content") <> ''::"text"))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "content_html" "text" NOT NULL,
    "cover_image_url" "text",
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletters_month_check" CHECK ((("month" >= 1) AND ("month" <= 12))),
    CONSTRAINT "newsletters_year_check" CHECK (("year" >= 2024))
);


ALTER TABLE "public"."newsletters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "category" "public"."document_category" DEFAULT 'other'::"public"."document_category" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid"
);


ALTER TABLE "public"."patient_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_psychologist_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_psychologist_relationships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."patient_psychologist_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "notes" "text",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "viewed_at" timestamp with time zone
);


ALTER TABLE "public"."patient_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "profile_id" "uuid",
    "subscription_id" "uuid",
    "email" "text" NOT NULL,
    "purchase_type" "text" NOT NULL,
    "purchase_reference_id" "text",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text" NOT NULL,
    "payment_provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "provider_session_id" "text",
    "provider_payment_id" "text",
    "provider_invoice_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "analytics_visitor_id" "uuid",
    "analytics_session_id" "uuid",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "payment_transactions_purchase_type_check" CHECK (("purchase_type" = ANY (ARRAY['subscription_payment'::"text", 'ai_credits'::"text", 'event_purchase'::"text", 'formation_purchase'::"text"]))),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."payment_transactions" IS 'Complete history of all payment charges (recurring and one-time)';



CREATE TABLE IF NOT EXISTS "public"."payment_webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "provider_event_id" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "attempts" integer DEFAULT 1 NOT NULL,
    "locked_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_webhook_events_attempts_check" CHECK (("attempts" > 0)),
    CONSTRAINT "payment_webhook_events_status_check" CHECK (("status" = ANY (ARRAY['processing'::"text", 'processed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."payment_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT 'false'::"jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'patient'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "subscription_status" "public"."subscription_status" DEFAULT 'inactive'::"public"."subscription_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "hourly_rate" numeric(10,2),
    "bio" "text",
    "services" "jsonb" DEFAULT '[]'::"jsonb",
    "availability" "jsonb" DEFAULT '{}'::"jsonb",
    "payment_methods" "jsonb" DEFAULT '{}'::"jsonb",
    "certifications" "text"[],
    "specialty" "text",
    "email" "text",
    "office_address" "text",
    "membership_level" integer DEFAULT 0 NOT NULL,
    "phone" "text",
    "cedula_profesional" "text",
    "populations_served" "text"[] DEFAULT '{}'::"text"[],
    "therapeutic_approaches" "text"[] DEFAULT '{}'::"text"[],
    "languages" "text"[] DEFAULT ARRAY['Español'::"text"],
    "years_experience" integer,
    "education" "text",
    "accepts_referral_terms" boolean DEFAULT false,
    "referral_terms_accepted_at" timestamp with time zone,
    "ai_minutes_available" integer DEFAULT 0,
    "email_notifications" boolean DEFAULT true,
    "session_reminders" boolean DEFAULT true,
    "stripe_customer_id" "text",
    "preferred_payment_method" "text" DEFAULT 'stripe'::"text",
    "is_test" boolean DEFAULT false NOT NULL,
    "timezone" "text" DEFAULT 'America/Mexico_City'::"text",
    "membership_specialization_code" "text",
    "calendar_feed_token" "text" DEFAULT "replace"(("gen_random_uuid"())::"text", '-'::"text", ''::"text") NOT NULL,
    CONSTRAINT "membership_level_non_negative" CHECK (("membership_level" >= 0)),
    CONSTRAINT "profiles_membership_specialization_code_allowed" CHECK ((("membership_specialization_code" IS NULL) OR ("membership_specialization_code" = ANY (ARRAY['clinica'::"text", 'forense'::"text", 'educacion'::"text", 'organizacional'::"text", 'infanto_juvenil'::"text", 'neuropsicologia'::"text", 'deportiva'::"text", 'sexologia_clinica'::"text", 'psicogerontologia'::"text"]))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."is_test" IS 'Flag to mark profile as a test account, excluding it from analytics';



COMMENT ON COLUMN "public"."profiles"."calendar_feed_token" IS 'Private token used for subscribed ICS calendar feeds.';



CREATE TABLE IF NOT EXISTS "public"."referral_commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referral_id" "uuid" NOT NULL,
    "beneficiary_id" "uuid" NOT NULL,
    "session_price" numeric NOT NULL,
    "commission_rate" numeric DEFAULT 1.0 NOT NULL,
    "commission_amount" numeric GENERATED ALWAYS AS (("session_price" * "commission_rate")) STORED,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referral_commissions_commission_rate_check" CHECK ((("commission_rate" >= (0)::numeric) AND ("commission_rate" <= (1)::numeric))),
    CONSTRAINT "referral_commissions_session_price_check" CHECK (("session_price" > (0)::numeric)),
    CONSTRAINT "referral_commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."referral_commissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_commissions" IS '100% first-session commission for referring psychologist';



CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referring_psychologist_id" "uuid" NOT NULL,
    "receiving_psychologist_id" "uuid",
    "patient_name" "text" NOT NULL,
    "patient_age" integer,
    "patient_contact" "text",
    "reason" "text" NOT NULL,
    "specialty_needed" "text",
    "population_type" "text",
    "urgency" "text" DEFAULT 'normal'::"text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "admin_notes" "text",
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "first_session_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "referral_domain" "text" DEFAULT 'clinical_referral'::"text" NOT NULL,
    "handoff_completed_at" timestamp with time zone,
    CONSTRAINT "referrals_referral_domain_check" CHECK (("referral_domain" = 'clinical_referral'::"text")),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'accepted'::"text", 'rejected'::"text", 'handoff_completed'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "referrals_urgency_check" CHECK (("urgency" = ANY (ARRAY['normal'::"text", 'alta'::"text", 'urgente'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."referrals" IS 'Patient referrals between psychologists with admin oversight';



COMMENT ON COLUMN "public"."referrals"."referral_domain" IS 'Separates patient care referrals from growth/invite programs';



COMMENT ON COLUMN "public"."referrals"."handoff_completed_at" IS 'Timestamp when the clinical transfer of care was completed';



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "type" "public"."resource_type" DEFAULT 'link'::"public"."resource_type" NOT NULL,
    "visibility" "public"."visibility_type" DEFAULT 'private'::"public"."visibility_type" NOT NULL,
    "thumbnail_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "target_audience" "text"[] DEFAULT ARRAY['public'::"text"],
    "min_membership_level" integer DEFAULT 0,
    "expires_at" timestamp with time zone,
    "category" "text" DEFAULT 'general'::"text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "download_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "html_content" "text",
    "tool_config" "jsonb",
    CONSTRAINT "resources_category_check" CHECK (("category" = ANY (ARRAY['guia'::"text", 'estudio'::"text", 'herramienta'::"text", 'plantilla'::"text", 'curso_material'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


COMMENT ON COLUMN "public"."resources"."target_audience" IS 'Array of allowed audiences: public, members, psychologists, patients, active_patients';



COMMENT ON COLUMN "public"."resources"."min_membership_level" IS 'Minimum membership level required to view (0=free, 1=comunidad, 2=consultorio, 3=marketing)';



COMMENT ON COLUMN "public"."resources"."expires_at" IS 'Expiration date for the resource. NULL means no expiration.';



COMMENT ON COLUMN "public"."resources"."category" IS 'Content category: guia, estudio, herramienta, plantilla, curso_material, general';



COMMENT ON COLUMN "public"."resources"."tags" IS 'Free-form tags for search and filtering';



COMMENT ON COLUMN "public"."resources"."download_count" IS 'Number of times the resource has been accessed/downloaded';



COMMENT ON COLUMN "public"."resources"."is_featured" IS 'Admin-flagged featured resources shown at the top';



COMMENT ON COLUMN "public"."resources"."sort_order" IS 'Custom sort order (lower = first)';



COMMENT ON COLUMN "public"."resources"."html_content" IS 'Raw HTML content for interactive tools rendered in sandboxed iframes. NULL for non-tool resources.';



COMMENT ON COLUMN "public"."resources"."tool_config" IS 'Display configuration for tools: {width, height, allow_fullscreen, theme}';



CREATE TABLE IF NOT EXISTS "public"."session_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid",
    "psychologist_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "summary" "text" NOT NULL,
    "mood_rating" integer,
    "progress_rating" integer,
    "key_topics" "text"[] DEFAULT '{}'::"text"[],
    "homework" "text",
    "next_session_focus" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    CONSTRAINT "session_summaries_mood_rating_check" CHECK ((("mood_rating" >= 1) AND ("mood_rating" <= 10))),
    CONSTRAINT "session_summaries_progress_rating_check" CHECK ((("progress_rating" >= 1) AND ("progress_rating" <= 5)))
);


ALTER TABLE "public"."session_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."speaker_attendance_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "join_time" timestamp with time zone NOT NULL,
    "leave_time" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 0 NOT NULL,
    "session_duration_minutes" integer DEFAULT 0 NOT NULL,
    "attendance_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "qualifies" boolean DEFAULT false NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "speaker_attendance_log_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'embedded_page'::"text", 'api'::"text", 'jitsi'::"text", 'youtube'::"text"])))
);


ALTER TABLE "public"."speaker_attendance_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."speaker_attendance_log" IS 'Tracks student connection time for the 90% attendance validation rule';



CREATE TABLE IF NOT EXISTS "public"."speaker_earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "speaker_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "student_id" "uuid",
    "earning_type" "public"."earning_type" DEFAULT 'membership_proration'::"public"."earning_type" NOT NULL,
    "gross_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "commission_rate" numeric(5,4) DEFAULT 1.0000 NOT NULL,
    "net_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "public"."earning_status" DEFAULT 'pending'::"public"."earning_status" NOT NULL,
    "attendance_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "release_date" "date" DEFAULT (CURRENT_DATE + '30 days'::interval) NOT NULL,
    "released_at" timestamp with time zone,
    "voided_at" timestamp with time zone,
    "void_reason" "text",
    "source_transaction_id" "uuid",
    "attendance_log_id" "uuid",
    "month_key" "text" DEFAULT "to_char"((CURRENT_DATE)::timestamp with time zone, 'YYYY-MM'::"text") NOT NULL,
    "is_frozen" boolean DEFAULT false NOT NULL,
    "frozen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "compensation_type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "compensation_value" numeric(10,4),
    CONSTRAINT "speaker_earnings_compensation_type_check" CHECK (("compensation_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text", 'variable'::"text"])))
);


ALTER TABLE "public"."speaker_earnings" OWNER TO "postgres";


COMMENT ON TABLE "public"."speaker_earnings" IS 'Tracks speaker earnings per student/event with 30-day release period';



COMMENT ON COLUMN "public"."speaker_earnings"."description" IS 'Notes or reason for the earning, especially for manual bonuses';



COMMENT ON COLUMN "public"."speaker_earnings"."compensation_type" IS 'Resolved compensation model used for this earning';



COMMENT ON COLUMN "public"."speaker_earnings"."compensation_value" IS 'Resolved value used for this earning. Percentage stores decimal rate (0.50 = 50%). Fixed stores MXN amount.';



CREATE TABLE IF NOT EXISTS "public"."speaker_month_close" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "month_key" "text" NOT NULL,
    "closed_by" "uuid",
    "closed_at" timestamp with time zone DEFAULT "now"(),
    "total_released" numeric(10,2) DEFAULT 0,
    "total_voided" numeric(10,2) DEFAULT 0,
    "total_pending" numeric(10,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."speaker_month_close" OWNER TO "postgres";


COMMENT ON TABLE "public"."speaker_month_close" IS 'Tracks monthly close events for speaker earnings';



CREATE TABLE IF NOT EXISTS "public"."speakers" (
    "id" "uuid" NOT NULL,
    "headline" "text",
    "bio" "text",
    "photo_url" "text",
    "credentials" "text"[] DEFAULT '{}'::"text"[],
    "formations" "text"[] DEFAULT '{}'::"text"[],
    "specialties" "text"[] DEFAULT '{}'::"text"[],
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "is_public" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "commission_rate" numeric(5,4) DEFAULT 0.5000,
    "social_links_enabled" boolean DEFAULT false
);


ALTER TABLE "public"."speakers" OWNER TO "postgres";


COMMENT ON TABLE "public"."speakers" IS 'Public profiles for event speakers/ponentes';



COMMENT ON COLUMN "public"."speakers"."commission_rate" IS 'Legacy fallback rate. New event payouts should use event_speakers.compensation_type/value.';



CREATE TABLE IF NOT EXISTS "public"."specialization_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "specialization_code" "text" NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "source" "text" DEFAULT 'landing'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "contact_key" "text" GENERATED ALWAYS AS (COALESCE(("user_id")::"text", "lower"("email"))) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "specialization_waitlist_contact_required" CHECK ((("user_id" IS NOT NULL) OR ("email" IS NOT NULL))),
    CONSTRAINT "specialization_waitlist_source_allowed" CHECK (("source" = ANY (ARRAY['landing'::"text", 'app'::"text"]))),
    CONSTRAINT "specialization_waitlist_specialization_code_allowed" CHECK (("specialization_code" = ANY (ARRAY['clinica'::"text", 'forense'::"text", 'educacion'::"text", 'organizacional'::"text", 'infanto_juvenil'::"text", 'neuropsicologia'::"text", 'deportiva'::"text", 'sexologia_clinica'::"text", 'psicogerontologia'::"text"])))
);


ALTER TABLE "public"."specialization_waitlist" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."specialization_waitlist_monthly_ranking" AS
 SELECT ("date_trunc"('month'::"text", "created_at"))::"date" AS "month_bucket",
    "specialization_code",
    ("count"(*))::integer AS "demand_count"
   FROM "public"."specialization_waitlist"
  GROUP BY (("date_trunc"('month'::"text", "created_at"))::"date"), "specialization_code"
  ORDER BY (("date_trunc"('month'::"text", "created_at"))::"date") DESC, (("count"(*))::integer) DESC;


ALTER VIEW "public"."specialization_waitlist_monthly_ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "membership_level" integer NOT NULL,
    "payment_provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "provider_subscription_id" "text",
    "provider_customer_id" "text",
    "provider_price_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "cancelled_at" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "specialization_code" "text",
    "analytics_visitor_id" "uuid",
    "analytics_session_id" "uuid",
    "attribution_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "subscriptions_payment_provider_check" CHECK (("payment_provider" = ANY (ARRAY['stripe'::"text", 'paypal'::"text", 'manual'::"text"]))),
    CONSTRAINT "subscriptions_specialization_code_allowed" CHECK ((("specialization_code" IS NULL) OR ("specialization_code" = ANY (ARRAY['clinica'::"text", 'forense'::"text", 'educacion'::"text", 'organizacional'::"text", 'infanto_juvenil'::"text", 'neuropsicologia'::"text", 'deportiva'::"text", 'sexologia_clinica'::"text", 'psicogerontologia'::"text"])))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['trialing'::"text", 'active'::"text", 'past_due'::"text", 'cancelled'::"text", 'expired'::"text", 'paused'::"text", 'incomplete'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."subscriptions" IS 'Tracks subscription lifecycle for membership plans';



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "public"."task_type" DEFAULT 'general'::"public"."task_type" NOT NULL,
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "due_date" timestamp with time zone,
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "response" "jsonb" DEFAULT '{}'::"jsonb",
    "completion_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_status_allowed" CHECK (("status" = ANY (ARRAY['pending'::"public"."task_status", 'in_progress'::"public"."task_status", 'completed'::"public"."task_status", 'reviewed'::"public"."task_status"]))),
    CONSTRAINT "tasks_type_allowed" CHECK (("type" = ANY (ARRAY['journal'::"public"."task_type", 'reading'::"public"."task_type", 'exercise'::"public"."task_type", 'form'::"public"."task_type", 'general'::"public"."task_type"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."therapeutic_tools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "public"."tool_category" DEFAULT 'test'::"public"."tool_category" NOT NULL,
    "schema" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "estimated_minutes" integer DEFAULT 10,
    "is_template" boolean DEFAULT false,
    "created_by" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."therapeutic_tools" OWNER TO "postgres";


COMMENT ON TABLE "public"."therapeutic_tools" IS 'Catalog of interactive therapeutic tools: tests, questionnaires, exercises, scales';



CREATE TABLE IF NOT EXISTS "public"."tool_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tool_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "psychologist_id" "uuid" NOT NULL,
    "status" "public"."assignment_status" DEFAULT 'pending'::"public"."assignment_status" NOT NULL,
    "instructions" "text",
    "due_date" timestamp with time zone,
    "results_visible" boolean DEFAULT false,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tool_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."tool_assignments" IS 'Tracks tool assignments from psychologists to patients with privacy controls';



CREATE TABLE IF NOT EXISTS "public"."tool_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assignment_id" "uuid" NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scores" "jsonb" DEFAULT '{}'::"jsonb",
    "progress" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tool_responses_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."tool_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."tool_responses" IS 'Patient responses and calculated scores for assigned tools';



ALTER TABLE ONLY "public"."admin_operation_logs"
    ADD CONSTRAINT "admin_operation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_operation_notes"
    ADD CONSTRAINT "admin_operation_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_visitors"
    ADD CONSTRAINT "analytics_visitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."arco_requests"
    ADD CONSTRAINT "arco_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attribution_touches"
    ADD CONSTRAINT "attribution_touches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_integrations"
    ADD CONSTRAINT "calendar_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_integrations"
    ADD CONSTRAINT "calendar_integrations_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."certificate_eligibility_snapshots"
    ADD CONSTRAINT "certificate_eligibility_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificate_rules"
    ADD CONSTRAINT "certificate_rules_event_unique" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."certificate_rules"
    ADD CONSTRAINT "certificate_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_audit_log"
    ADD CONSTRAINT "clinical_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_documents"
    ADD CONSTRAINT "clinical_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_entitlements"
    ADD CONSTRAINT "event_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_entitlements"
    ADD CONSTRAINT "event_entitlements_unique_grant" UNIQUE ("event_id", "access_kind", "identity_key", "source_type");



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_access_token_key" UNIQUE ("access_token");



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_resources"
    ADD CONSTRAINT "event_resources_event_id_resource_id_key" UNIQUE ("event_id", "resource_id");



ALTER TABLE ONLY "public"."event_resources"
    ADD CONSTRAINT "event_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_event_id_speaker_id_key" UNIQUE ("event_id", "speaker_id");



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exclusive_agreements"
    ADD CONSTRAINT "exclusive_agreements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_formation_id_scope_type_scope_refere_key" UNIQUE ("formation_id", "scope_type", "scope_reference", "identity_key");



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_courses"
    ADD CONSTRAINT "formation_courses_formation_id_event_id_key" UNIQUE ("formation_id", "event_id");



ALTER TABLE ONLY "public"."formation_courses"
    ADD CONSTRAINT "formation_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_progress"
    ADD CONSTRAINT "formation_progress_formation_id_email_event_id_key" UNIQUE ("formation_id", "email", "event_id");



ALTER TABLE ONLY "public"."formation_progress"
    ADD CONSTRAINT "formation_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formation_purchases"
    ADD CONSTRAINT "formation_purchases_access_token_key" UNIQUE ("access_token");



ALTER TABLE ONLY "public"."formation_purchases"
    ADD CONSTRAINT "formation_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formations"
    ADD CONSTRAINT "formations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formations"
    ADD CONSTRAINT "formations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."growth_campaigns"
    ADD CONSTRAINT "growth_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_attributions"
    ADD CONSTRAINT "invite_attributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_attributions"
    ADD CONSTRAINT "invite_attributions_referred_id_key" UNIQUE ("referred_id");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_reward_events"
    ADD CONSTRAINT "invite_reward_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manual_deals"
    ADD CONSTRAINT "manual_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_briefs"
    ADD CONSTRAINT "marketing_briefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_briefs"
    ADD CONSTRAINT "marketing_briefs_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."marketing_cost_entries"
    ADD CONSTRAINT "marketing_cost_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_services"
    ADD CONSTRAINT "marketing_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_services"
    ADD CONSTRAINT "marketing_services_user_id_service_key_key" UNIQUE ("user_id", "service_key");



ALTER TABLE ONLY "public"."membership_entitlement_rules"
    ADD CONSTRAINT "membership_entitlement_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_documents"
    ADD CONSTRAINT "patient_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_psychologist_relationships"
    ADD CONSTRAINT "patient_psychologist_relationshi_patient_id_psychologist_id_key" UNIQUE ("patient_id", "psychologist_id");



ALTER TABLE ONLY "public"."patient_psychologist_relationships"
    ADD CONSTRAINT "patient_psychologist_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_resources"
    ADD CONSTRAINT "patient_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_resources"
    ADD CONSTRAINT "patient_resources_resource_id_patient_id_key" UNIQUE ("resource_id", "patient_id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_webhook_events"
    ADD CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_webhook_events"
    ADD CONSTRAINT "payment_webhook_events_provider_provider_event_id_key" UNIQUE ("provider", "provider_event_id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_commissions"
    ADD CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_commissions"
    ADD CONSTRAINT "referral_commissions_referral_id_key" UNIQUE ("referral_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_summaries"
    ADD CONSTRAINT "session_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."speaker_attendance_log"
    ADD CONSTRAINT "speaker_attendance_log_event_id_student_id_key" UNIQUE ("event_id", "student_id");



ALTER TABLE ONLY "public"."speaker_attendance_log"
    ADD CONSTRAINT "speaker_attendance_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_speaker_id_event_id_student_id_key" UNIQUE ("speaker_id", "event_id", "student_id");



ALTER TABLE ONLY "public"."speaker_month_close"
    ADD CONSTRAINT "speaker_month_close_month_key_key" UNIQUE ("month_key");



ALTER TABLE ONLY "public"."speaker_month_close"
    ADD CONSTRAINT "speaker_month_close_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."speakers"
    ADD CONSTRAINT "speakers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialization_waitlist"
    ADD CONSTRAINT "specialization_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_provider_subscription_id_key" UNIQUE ("provider_subscription_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."therapeutic_tools"
    ADD CONSTRAINT "therapeutic_tools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_assignments"
    ADD CONSTRAINT "tool_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_responses"
    ADD CONSTRAINT "tool_responses_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_operation_logs_target_email" ON "public"."admin_operation_logs" USING "btree" ("lower"("btrim"(COALESCE("target_email", ''::"text"))), "created_at" DESC);



CREATE INDEX "idx_admin_operation_logs_target_user" ON "public"."admin_operation_logs" USING "btree" ("target_user_id", "created_at" DESC);



CREATE INDEX "idx_admin_operation_notes_target_email" ON "public"."admin_operation_notes" USING "btree" ("lower"("btrim"(COALESCE("target_email", ''::"text"))), "created_at" DESC);



CREATE INDEX "idx_admin_operation_notes_target_user" ON "public"."admin_operation_notes" USING "btree" ("target_user_id", "created_at" DESC);



CREATE INDEX "idx_agreements_active" ON "public"."exclusive_agreements" USING "btree" ("is_active");



CREATE INDEX "idx_agreements_category" ON "public"."exclusive_agreements" USING "btree" ("category");



CREATE UNIQUE INDEX "idx_ai_credit_transactions_source_ref_unique" ON "public"."ai_credit_transactions" USING "btree" ("source_ref") WHERE ("source_ref" IS NOT NULL);



CREATE INDEX "idx_ai_transactions_profile_id" ON "public"."ai_credit_transactions" USING "btree" ("profile_id");



CREATE INDEX "idx_analytics_events_name" ON "public"."analytics_events" USING "btree" ("event_name", "occurred_at" DESC);



CREATE INDEX "idx_analytics_events_session" ON "public"."analytics_events" USING "btree" ("session_id", "occurred_at" DESC);



CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id", "occurred_at" DESC);



CREATE INDEX "idx_analytics_sessions_started_at" ON "public"."analytics_sessions" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_analytics_sessions_user" ON "public"."analytics_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_sessions_visitor" ON "public"."analytics_sessions" USING "btree" ("visitor_id");



CREATE INDEX "idx_analytics_visitors_last_seen" ON "public"."analytics_visitors" USING "btree" ("last_seen_at" DESC);



CREATE INDEX "idx_analytics_visitors_user" ON "public"."analytics_visitors" USING "btree" ("user_id");



CREATE INDEX "idx_appointments_patient" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_psychologist" ON "public"."appointments" USING "btree" ("psychologist_id");



CREATE INDEX "idx_appointments_psychologist_time" ON "public"."appointments" USING "btree" ("psychologist_id", "start_time");



CREATE INDEX "idx_appointments_start_time" ON "public"."appointments" USING "btree" ("start_time");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_arco_status" ON "public"."arco_requests" USING "btree" ("status");



CREATE INDEX "idx_arco_type" ON "public"."arco_requests" USING "btree" ("request_type");



CREATE INDEX "idx_arco_user" ON "public"."arco_requests" USING "btree" ("user_id");



CREATE INDEX "idx_assignments_due_date" ON "public"."tool_assignments" USING "btree" ("due_date");



CREATE INDEX "idx_assignments_patient" ON "public"."tool_assignments" USING "btree" ("patient_id");



CREATE INDEX "idx_assignments_psychologist" ON "public"."tool_assignments" USING "btree" ("psychologist_id");



CREATE INDEX "idx_assignments_status" ON "public"."tool_assignments" USING "btree" ("status");



CREATE INDEX "idx_assignments_tool" ON "public"."tool_assignments" USING "btree" ("tool_id");



CREATE INDEX "idx_attendance_log_event" ON "public"."speaker_attendance_log" USING "btree" ("event_id");



CREATE INDEX "idx_attendance_log_qualifies" ON "public"."speaker_attendance_log" USING "btree" ("qualifies") WHERE ("qualifies" = true);



CREATE INDEX "idx_attendance_log_student" ON "public"."speaker_attendance_log" USING "btree" ("student_id");



CREATE INDEX "idx_attribution_touches_channel" ON "public"."attribution_touches" USING "btree" ("channel", "occurred_at" DESC);



CREATE INDEX "idx_attribution_touches_user" ON "public"."attribution_touches" USING "btree" ("user_id", "occurred_at" DESC);



CREATE INDEX "idx_attribution_touches_visitor" ON "public"."attribution_touches" USING "btree" ("visitor_id", "occurred_at" DESC);



CREATE INDEX "idx_calendar_integrations_provider" ON "public"."calendar_integrations" USING "btree" ("provider");



CREATE INDEX "idx_calendar_integrations_user_id" ON "public"."calendar_integrations" USING "btree" ("user_id");



CREATE INDEX "idx_certificate_eligibility_event" ON "public"."certificate_eligibility_snapshots" USING "btree" ("event_id", "evaluated_at" DESC);



CREATE INDEX "idx_certificate_eligibility_user" ON "public"."certificate_eligibility_snapshots" USING "btree" ("user_id", "evaluated_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_clinical_documents_active_patient_created" ON "public"."clinical_documents" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_clinical_documents_deleted_at" ON "public"."clinical_documents" USING "btree" ("deleted_at");



CREATE INDEX "idx_clinical_records_active_patient_created" ON "public"."clinical_records" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_clinical_records_appointment" ON "public"."clinical_records" USING "btree" ("appointment_id");



CREATE INDEX "idx_clinical_records_created" ON "public"."clinical_records" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_clinical_records_deleted_at" ON "public"."clinical_records" USING "btree" ("deleted_at");



CREATE INDEX "idx_clinical_records_patient" ON "public"."clinical_records" USING "btree" ("patient_id");



CREATE INDEX "idx_clinical_records_pinned" ON "public"."clinical_records" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_clinical_records_psychologist" ON "public"."clinical_records" USING "btree" ("psychologist_id");



CREATE INDEX "idx_clinical_records_tags" ON "public"."clinical_records" USING "gin" ("tags");



CREATE INDEX "idx_clinical_records_type" ON "public"."clinical_records" USING "btree" ("type");



CREATE INDEX "idx_commissions_beneficiary" ON "public"."referral_commissions" USING "btree" ("beneficiary_id");



CREATE INDEX "idx_commissions_status" ON "public"."referral_commissions" USING "btree" ("status");



CREATE INDEX "idx_consent_granted" ON "public"."consent_records" USING "btree" ("granted_at" DESC);



CREATE INDEX "idx_consent_type" ON "public"."consent_records" USING "btree" ("consent_type");



CREATE INDEX "idx_consent_user" ON "public"."consent_records" USING "btree" ("user_id");



CREATE INDEX "idx_event_entitlements_email" ON "public"."event_entitlements" USING "btree" ("identity_key");



CREATE INDEX "idx_event_entitlements_event_status" ON "public"."event_entitlements" USING "btree" ("event_id", "status", "ends_at");



CREATE INDEX "idx_event_entitlements_source_reference" ON "public"."event_entitlements" USING "btree" ("source_type", "source_reference");



CREATE INDEX "idx_event_entitlements_user" ON "public"."event_entitlements" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_event_purchases_analytics_visitor" ON "public"."event_purchases" USING "btree" ("analytics_visitor_id");



CREATE INDEX "idx_event_purchases_email" ON "public"."event_purchases" USING "btree" ("email");



CREATE INDEX "idx_event_purchases_event" ON "public"."event_purchases" USING "btree" ("event_id");



CREATE INDEX "idx_event_purchases_event_pending_expiry" ON "public"."event_purchases" USING "btree" ("event_id", "status", "checkout_session_expires_at");



CREATE UNIQUE INDEX "idx_event_purchases_pending_identity" ON "public"."event_purchases" USING "btree" ("event_id", COALESCE(("user_id")::"text", "lower"("btrim"("email")))) WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_event_purchases_status" ON "public"."event_purchases" USING "btree" ("status");



CREATE INDEX "idx_event_purchases_token" ON "public"."event_purchases" USING "btree" ("access_token");



CREATE INDEX "idx_event_purchases_user_id" ON "public"."event_purchases" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_event_registrations_event" ON "public"."event_registrations" USING "btree" ("event_id");



CREATE INDEX "idx_event_registrations_user" ON "public"."event_registrations" USING "btree" ("user_id");



CREATE INDEX "idx_event_resources_event" ON "public"."event_resources" USING "btree" ("event_id");



CREATE INDEX "idx_event_resources_resource" ON "public"."event_resources" USING "btree" ("resource_id");



CREATE INDEX "idx_event_speakers_event" ON "public"."event_speakers" USING "btree" ("event_id");



CREATE INDEX "idx_event_speakers_speaker" ON "public"."event_speakers" USING "btree" ("speaker_id");



CREATE INDEX "idx_events_category" ON "public"."events" USING "btree" ("category");



CREATE INDEX "idx_events_event_type" ON "public"."events" USING "btree" ("event_type");



CREATE INDEX "idx_events_formation" ON "public"."events" USING "btree" ("formation_id") WHERE ("formation_id" IS NOT NULL);



CREATE INDEX "idx_events_member_access" ON "public"."events" USING "btree" ("member_access_type");



CREATE INDEX "idx_events_members_only" ON "public"."events" USING "btree" ("is_members_only");



CREATE INDEX "idx_events_public_catalog" ON "public"."events" USING "btree" ("event_type", "status", "start_time");



CREATE INDEX "idx_events_recording_expires" ON "public"."events" USING "btree" ("recording_expires_at");



CREATE UNIQUE INDEX "idx_events_slug_unique" ON "public"."events" USING "btree" ("slug");



CREATE INDEX "idx_events_specialization_code" ON "public"."events" USING "btree" ("specialization_code") WHERE ("specialization_code" IS NOT NULL);



CREATE INDEX "idx_events_start_time" ON "public"."events" USING "btree" ("start_time");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_events_target_audience" ON "public"."events" USING "gin" ("target_audience");



CREATE INDEX "idx_formation_certificates_formation" ON "public"."formation_certificates" USING "btree" ("formation_id");



CREATE INDEX "idx_formation_certificates_identity" ON "public"."formation_certificates" USING "btree" ("identity_key");



CREATE INDEX "idx_formation_certificates_scope" ON "public"."formation_certificates" USING "btree" ("scope_type", "scope_reference");



CREATE INDEX "idx_formation_courses_event" ON "public"."formation_courses" USING "btree" ("event_id");



CREATE INDEX "idx_formation_courses_formation" ON "public"."formation_courses" USING "btree" ("formation_id");



CREATE INDEX "idx_formation_progress_email" ON "public"."formation_progress" USING "btree" ("email");



CREATE INDEX "idx_formation_progress_formation" ON "public"."formation_progress" USING "btree" ("formation_id");



CREATE INDEX "idx_formation_progress_user" ON "public"."formation_progress" USING "btree" ("user_id");



CREATE INDEX "idx_formation_purchases_email" ON "public"."formation_purchases" USING "btree" ("email");



CREATE INDEX "idx_formation_purchases_formation" ON "public"."formation_purchases" USING "btree" ("formation_id");



CREATE INDEX "idx_formation_purchases_status" ON "public"."formation_purchases" USING "btree" ("status");



CREATE INDEX "idx_formation_purchases_user" ON "public"."formation_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_formations_member_access_type" ON "public"."formations" USING "btree" ("bundle_member_access_type");



CREATE INDEX "idx_formations_slug" ON "public"."formations" USING "btree" ("slug");



CREATE INDEX "idx_formations_specialization_code" ON "public"."formations" USING "btree" ("specialization_code") WHERE ("specialization_code" IS NOT NULL);



CREATE INDEX "idx_formations_status" ON "public"."formations" USING "btree" ("status");



CREATE INDEX "idx_formations_total_hours" ON "public"."formations" USING "btree" ("total_hours");



CREATE INDEX "idx_growth_campaigns_active" ON "public"."growth_campaigns" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_growth_campaigns_dates" ON "public"."growth_campaigns" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "idx_growth_campaigns_program_type" ON "public"."growth_campaigns" USING "btree" ("program_type");



CREATE INDEX "idx_growth_campaigns_sort" ON "public"."growth_campaigns" USING "btree" ("sort_order");



CREATE INDEX "idx_invite_attributions_code" ON "public"."invite_attributions" USING "btree" ("invite_code_id");



CREATE INDEX "idx_invite_attributions_program_type" ON "public"."invite_attributions" USING "btree" ("program_type");



CREATE INDEX "idx_invite_attributions_referred" ON "public"."invite_attributions" USING "btree" ("referred_id");



CREATE INDEX "idx_invite_attributions_referrer" ON "public"."invite_attributions" USING "btree" ("referrer_id");



CREATE INDEX "idx_invite_attributions_status" ON "public"."invite_attributions" USING "btree" ("status");



CREATE INDEX "idx_invite_codes_active" ON "public"."invite_codes" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_invite_codes_code" ON "public"."invite_codes" USING "btree" ("code");



CREATE INDEX "idx_invite_codes_owner" ON "public"."invite_codes" USING "btree" ("owner_id");



CREATE INDEX "idx_invite_reward_events_attribution" ON "public"."invite_reward_events" USING "btree" ("attribution_id");



CREATE INDEX "idx_invite_reward_events_beneficiary" ON "public"."invite_reward_events" USING "btree" ("beneficiary_id");



CREATE INDEX "idx_invite_reward_events_processed" ON "public"."invite_reward_events" USING "btree" ("processed") WHERE ("processed" = false);



CREATE INDEX "idx_invite_reward_events_program_type" ON "public"."invite_reward_events" USING "btree" ("program_type");



CREATE INDEX "idx_manual_deals_channel_campaign" ON "public"."manual_deals" USING "btree" ("channel", "campaign");



CREATE INDEX "idx_manual_deals_closed_at" ON "public"."manual_deals" USING "btree" ("closed_at" DESC);



CREATE INDEX "idx_manual_deals_stage" ON "public"."manual_deals" USING "btree" ("stage");



CREATE INDEX "idx_marketing_briefs_status" ON "public"."marketing_briefs" USING "btree" ("status");



CREATE INDEX "idx_marketing_briefs_user" ON "public"."marketing_briefs" USING "btree" ("user_id");



CREATE INDEX "idx_marketing_cost_entries_channel_campaign" ON "public"."marketing_cost_entries" USING "btree" ("channel", "campaign");



CREATE INDEX "idx_marketing_cost_entries_period" ON "public"."marketing_cost_entries" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_marketing_services_status" ON "public"."marketing_services" USING "btree" ("status");



CREATE INDEX "idx_marketing_services_user" ON "public"."marketing_services" USING "btree" ("user_id");



CREATE INDEX "idx_membership_entitlement_rules_membership" ON "public"."membership_entitlement_rules" USING "btree" ("membership_level", "is_active");



CREATE INDEX "idx_messages_receiver_read_created" ON "public"."messages" USING "btree" ("receiver_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_messages_sender_created" ON "public"."messages" USING "btree" ("sender_id", "created_at" DESC);



CREATE INDEX "idx_month_close_key" ON "public"."speaker_month_close" USING "btree" ("month_key");



CREATE UNIQUE INDEX "idx_newsletters_active" ON "public"."newsletters" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_newsletters_month_year" ON "public"."newsletters" USING "btree" ("year" DESC, "month" DESC);



CREATE INDEX "idx_patient_documents_active_psychologist_created" ON "public"."patient_documents" USING "btree" ("psychologist_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_patient_documents_deleted_at" ON "public"."patient_documents" USING "btree" ("deleted_at");



CREATE INDEX "idx_patient_resources_patient" ON "public"."patient_resources" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_resources_resource" ON "public"."patient_resources" USING "btree" ("resource_id");



CREATE UNIQUE INDEX "idx_payment_transactions_provider_invoice_id_unique" ON "public"."payment_transactions" USING "btree" ("provider_invoice_id") WHERE ("provider_invoice_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_payment_transactions_provider_payment_id_unique" ON "public"."payment_transactions" USING "btree" ("provider_payment_id") WHERE ("provider_payment_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_payment_transactions_provider_session_id_unique" ON "public"."payment_transactions" USING "btree" ("provider_session_id") WHERE ("provider_session_id" IS NOT NULL);



CREATE INDEX "idx_payment_webhook_events_provider_locked" ON "public"."payment_webhook_events" USING "btree" ("provider", "locked_at" DESC);



CREATE INDEX "idx_payment_webhook_events_status" ON "public"."payment_webhook_events" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_profiles_calendar_feed_token" ON "public"."profiles" USING "btree" ("calendar_feed_token");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_istest" ON "public"."profiles" USING "btree" ("is_test");



CREATE INDEX "idx_profiles_membership_level" ON "public"."profiles" USING "btree" ("membership_level");



CREATE INDEX "idx_profiles_membership_specialization_code" ON "public"."profiles" USING "btree" ("membership_specialization_code") WHERE ("membership_specialization_code" IS NOT NULL);



CREATE INDEX "idx_profiles_referral_terms" ON "public"."profiles" USING "btree" ("accepts_referral_terms") WHERE ("accepts_referral_terms" = true);



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_stripe_customer" ON "public"."profiles" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_profiles_subscription" ON "public"."profiles" USING "btree" ("subscription_status");



CREATE INDEX "idx_referrals_domain" ON "public"."referrals" USING "btree" ("referral_domain");



CREATE INDEX "idx_referrals_handoff_completed_at" ON "public"."referrals" USING "btree" ("handoff_completed_at");



CREATE INDEX "idx_referrals_receiving" ON "public"."referrals" USING "btree" ("receiving_psychologist_id");



CREATE INDEX "idx_referrals_referring" ON "public"."referrals" USING "btree" ("referring_psychologist_id");



CREATE INDEX "idx_referrals_status" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "idx_relationships_patient" ON "public"."patient_psychologist_relationships" USING "btree" ("patient_id");



CREATE INDEX "idx_relationships_psychologist" ON "public"."patient_psychologist_relationships" USING "btree" ("psychologist_id");



CREATE INDEX "idx_relationships_status" ON "public"."patient_psychologist_relationships" USING "btree" ("status");



CREATE INDEX "idx_resources_category" ON "public"."resources" USING "btree" ("category");



CREATE INDEX "idx_resources_created_by" ON "public"."resources" USING "btree" ("created_by");



CREATE INDEX "idx_resources_expires_at" ON "public"."resources" USING "btree" ("expires_at");



CREATE INDEX "idx_resources_is_featured" ON "public"."resources" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_resources_min_membership_level" ON "public"."resources" USING "btree" ("min_membership_level");



CREATE INDEX "idx_resources_tags" ON "public"."resources" USING "gin" ("tags");



CREATE INDEX "idx_resources_target_audience" ON "public"."resources" USING "gin" ("target_audience");



CREATE INDEX "idx_resources_type" ON "public"."resources" USING "btree" ("type");



CREATE INDEX "idx_resources_visibility" ON "public"."resources" USING "btree" ("visibility");



CREATE INDEX "idx_responses_assignment" ON "public"."tool_responses" USING "btree" ("assignment_id");



CREATE INDEX "idx_responses_progress" ON "public"."tool_responses" USING "btree" ("progress");



CREATE INDEX "idx_session_summaries_active_patient_created" ON "public"."session_summaries" USING "btree" ("patient_id", "created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_session_summaries_deleted_at" ON "public"."session_summaries" USING "btree" ("deleted_at");



CREATE INDEX "idx_speaker_earnings_event" ON "public"."speaker_earnings" USING "btree" ("event_id");



CREATE INDEX "idx_speaker_earnings_frozen" ON "public"."speaker_earnings" USING "btree" ("is_frozen") WHERE ("is_frozen" = false);



CREATE INDEX "idx_speaker_earnings_month" ON "public"."speaker_earnings" USING "btree" ("month_key");



CREATE INDEX "idx_speaker_earnings_release_date" ON "public"."speaker_earnings" USING "btree" ("release_date") WHERE ("status" = 'pending'::"public"."earning_status");



CREATE INDEX "idx_speaker_earnings_speaker" ON "public"."speaker_earnings" USING "btree" ("speaker_id");



CREATE INDEX "idx_speaker_earnings_status" ON "public"."speaker_earnings" USING "btree" ("status");



CREATE INDEX "idx_speaker_earnings_student" ON "public"."speaker_earnings" USING "btree" ("student_id");



CREATE INDEX "idx_speakers_is_public" ON "public"."speakers" USING "btree" ("is_public");



CREATE INDEX "idx_specialization_waitlist_created_at" ON "public"."specialization_waitlist" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_specialization_waitlist_specialization" ON "public"."specialization_waitlist" USING "btree" ("specialization_code");



CREATE INDEX "idx_subscriptions_analytics_visitor" ON "public"."subscriptions" USING "btree" ("analytics_visitor_id");



CREATE INDEX "idx_subscriptions_profile" ON "public"."subscriptions" USING "btree" ("profile_id");



CREATE INDEX "idx_subscriptions_provider_sub" ON "public"."subscriptions" USING "btree" ("provider_subscription_id");



CREATE INDEX "idx_subscriptions_specialization_code" ON "public"."subscriptions" USING "btree" ("specialization_code") WHERE ("specialization_code" IS NOT NULL);



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_patient" ON "public"."tasks" USING "btree" ("patient_id");



CREATE INDEX "idx_tasks_psychologist" ON "public"."tasks" USING "btree" ("psychologist_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tools_category" ON "public"."therapeutic_tools" USING "btree" ("category");



CREATE INDEX "idx_tools_created_by" ON "public"."therapeutic_tools" USING "btree" ("created_by");



CREATE INDEX "idx_tools_is_template" ON "public"."therapeutic_tools" USING "btree" ("is_template");



CREATE INDEX "idx_tools_tags" ON "public"."therapeutic_tools" USING "gin" ("tags");



CREATE INDEX "idx_transactions_analytics_visitor" ON "public"."payment_transactions" USING "btree" ("analytics_visitor_id");



CREATE INDEX "idx_transactions_profile" ON "public"."payment_transactions" USING "btree" ("profile_id");



CREATE INDEX "idx_transactions_provider_session" ON "public"."payment_transactions" USING "btree" ("provider_session_id");



CREATE INDEX "idx_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "idx_transactions_subscription" ON "public"."payment_transactions" USING "btree" ("subscription_id");



CREATE INDEX "idx_transactions_user" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uq_specialization_waitlist_contact_and_specialization" ON "public"."specialization_waitlist" USING "btree" ("contact_key", "specialization_code");



CREATE OR REPLACE TRIGGER "on_profile_role_change" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_ponente_speaker_profile"();



CREATE OR REPLACE TRIGGER "on_profile_sync_email" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_email"();



CREATE OR REPLACE TRIGGER "set_recording_expiration_trigger" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_recording_expiration"();



CREATE OR REPLACE TRIGGER "trg_audit_clinical_documents" AFTER INSERT OR DELETE OR UPDATE ON "public"."clinical_documents" FOR EACH ROW EXECUTE FUNCTION "public"."log_clinical_mutation"();



CREATE OR REPLACE TRIGGER "trg_audit_clinical_records" AFTER INSERT OR DELETE OR UPDATE ON "public"."clinical_records" FOR EACH ROW EXECUTE FUNCTION "public"."log_clinical_mutation"();



CREATE OR REPLACE TRIGGER "trg_audit_patient_documents" AFTER INSERT OR DELETE OR UPDATE ON "public"."patient_documents" FOR EACH ROW EXECUTE FUNCTION "public"."log_clinical_mutation"();



CREATE OR REPLACE TRIGGER "trg_audit_session_summaries" AFTER INSERT OR DELETE OR UPDATE ON "public"."session_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."log_clinical_mutation"();



CREATE OR REPLACE TRIGGER "trg_growth_campaign_updated" BEFORE UPDATE ON "public"."growth_campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_growth_campaign_timestamp"();



CREATE OR REPLACE TRIGGER "trg_increment_invite_use_count" AFTER INSERT ON "public"."invite_attributions" FOR EACH ROW EXECUTE FUNCTION "public"."increment_invite_use_count"();



CREATE OR REPLACE TRIGGER "trg_prevent_appointment_sensitive_changes" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_appointment_sensitive_changes"();



CREATE OR REPLACE TRIGGER "trg_prevent_message_tampering" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_message_tampering"();



CREATE OR REPLACE TRIGGER "trg_prevent_profile_self_sensitive_changes" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_profile_self_sensitive_changes"();



CREATE OR REPLACE TRIGGER "trg_prevent_task_sensitive_changes" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_task_sensitive_changes"();



CREATE OR REPLACE TRIGGER "trg_prevent_tool_assignment_sensitive_changes" BEFORE UPDATE ON "public"."tool_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_tool_assignment_sensitive_changes"();



CREATE OR REPLACE TRIGGER "update_admin_operation_notes_updated_at" BEFORE UPDATE ON "public"."admin_operation_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_agreements_updated_at" BEFORE UPDATE ON "public"."exclusive_agreements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_sessions_updated_at" BEFORE UPDATE ON "public"."analytics_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_analytics_visitors_updated_at" BEFORE UPDATE ON "public"."analytics_visitors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_arco_requests_updated_at" BEFORE UPDATE ON "public"."arco_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_calendar_integrations_updated_at" BEFORE UPDATE ON "public"."calendar_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_certificate_eligibility_snapshots_updated_at" BEFORE UPDATE ON "public"."certificate_eligibility_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_certificate_rules_updated_at" BEFORE UPDATE ON "public"."certificate_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinical_documents_updated_at" BEFORE UPDATE ON "public"."clinical_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinical_records_updated_at" BEFORE UPDATE ON "public"."clinical_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_event_entitlements_updated_at" BEFORE UPDATE ON "public"."event_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_formations_updated_at" BEFORE UPDATE ON "public"."formations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_manual_deals_updated_at" BEFORE UPDATE ON "public"."manual_deals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_marketing_briefs_updated_at" BEFORE UPDATE ON "public"."marketing_briefs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_marketing_cost_entries_updated_at" BEFORE UPDATE ON "public"."marketing_cost_entries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_marketing_services_updated_at" BEFORE UPDATE ON "public"."marketing_services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_membership_entitlement_rules_updated_at" BEFORE UPDATE ON "public"."membership_entitlement_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_newsletters_updated_at" BEFORE UPDATE ON "public"."newsletters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_referrals_updated_at" BEFORE UPDATE ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_relationships_updated_at" BEFORE UPDATE ON "public"."patient_psychologist_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resources_updated_at" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_summaries_updated_at" BEFORE UPDATE ON "public"."session_summaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_speaker_earnings_updated_at" BEFORE UPDATE ON "public"."speaker_earnings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_speakers_updated_at" BEFORE UPDATE ON "public"."speakers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_specialization_waitlist_updated_at" BEFORE UPDATE ON "public"."specialization_waitlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_therapeutic_tools_updated_at" BEFORE UPDATE ON "public"."therapeutic_tools" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tool_assignments_updated_at" BEFORE UPDATE ON "public"."tool_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tool_responses_updated_at" BEFORE UPDATE ON "public"."tool_responses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_operation_logs"
    ADD CONSTRAINT "admin_operation_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_operation_logs"
    ADD CONSTRAINT "admin_operation_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_operation_notes"
    ADD CONSTRAINT "admin_operation_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_operation_notes"
    ADD CONSTRAINT "admin_operation_notes_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_operation_notes"
    ADD CONSTRAINT "admin_operation_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_credit_transactions"
    ADD CONSTRAINT "ai_credit_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytics_sessions"
    ADD CONSTRAINT "analytics_sessions_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_visitors"
    ADD CONSTRAINT "analytics_visitors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."arco_requests"
    ADD CONSTRAINT "arco_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."arco_requests"
    ADD CONSTRAINT "arco_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attribution_touches"
    ADD CONSTRAINT "attribution_touches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attribution_touches"
    ADD CONSTRAINT "attribution_touches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attribution_touches"
    ADD CONSTRAINT "attribution_touches_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_integrations"
    ADD CONSTRAINT "calendar_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificate_eligibility_snapshots"
    ADD CONSTRAINT "certificate_eligibility_snapshots_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificate_eligibility_snapshots"
    ADD CONSTRAINT "certificate_eligibility_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificate_rules"
    ADD CONSTRAINT "certificate_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificate_rules"
    ADD CONSTRAINT "certificate_rules_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_audit_log"
    ADD CONSTRAINT "clinical_audit_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_audit_log"
    ADD CONSTRAINT "clinical_audit_log_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_documents"
    ADD CONSTRAINT "clinical_documents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_documents"
    ADD CONSTRAINT "clinical_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_documents"
    ADD CONSTRAINT "clinical_documents_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_records"
    ADD CONSTRAINT "clinical_records_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_records"
    ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_entitlements"
    ADD CONSTRAINT "event_entitlements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_entitlements"
    ADD CONSTRAINT "event_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_analytics_visitor_id_fkey" FOREIGN KEY ("analytics_visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_purchases"
    ADD CONSTRAINT "event_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_resources"
    ADD CONSTRAINT "event_resources_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_resources"
    ADD CONSTRAINT "event_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_prerequisite_event_id_fkey" FOREIGN KEY ("prerequisite_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exclusive_agreements"
    ADD CONSTRAINT "exclusive_agreements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formation_certificates"
    ADD CONSTRAINT "formation_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formation_courses"
    ADD CONSTRAINT "formation_courses_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_courses"
    ADD CONSTRAINT "formation_courses_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_progress"
    ADD CONSTRAINT "formation_progress_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_progress"
    ADD CONSTRAINT "formation_progress_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_progress"
    ADD CONSTRAINT "formation_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formation_purchases"
    ADD CONSTRAINT "formation_purchases_formation_id_fkey" FOREIGN KEY ("formation_id") REFERENCES "public"."formations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."formation_purchases"
    ADD CONSTRAINT "formation_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."formations"
    ADD CONSTRAINT "formations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."growth_campaigns"
    ADD CONSTRAINT "growth_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invite_attributions"
    ADD CONSTRAINT "invite_attributions_invite_code_id_fkey" FOREIGN KEY ("invite_code_id") REFERENCES "public"."invite_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_attributions"
    ADD CONSTRAINT "invite_attributions_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_attributions"
    ADD CONSTRAINT "invite_attributions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_reward_events"
    ADD CONSTRAINT "invite_reward_events_attribution_id_fkey" FOREIGN KEY ("attribution_id") REFERENCES "public"."invite_attributions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_reward_events"
    ADD CONSTRAINT "invite_reward_events_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manual_deals"
    ADD CONSTRAINT "manual_deals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."manual_deals"
    ADD CONSTRAINT "manual_deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketing_briefs"
    ADD CONSTRAINT "marketing_briefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketing_cost_entries"
    ADD CONSTRAINT "marketing_cost_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketing_services"
    ADD CONSTRAINT "marketing_services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."membership_entitlement_rules"
    ADD CONSTRAINT "membership_entitlement_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."membership_entitlement_rules"
    ADD CONSTRAINT "membership_entitlement_rules_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_documents"
    ADD CONSTRAINT "patient_documents_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_documents"
    ADD CONSTRAINT "patient_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_documents"
    ADD CONSTRAINT "patient_documents_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_psychologist_relationships"
    ADD CONSTRAINT "patient_psychologist_relationships_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_psychologist_relationships"
    ADD CONSTRAINT "patient_psychologist_relationships_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_resources"
    ADD CONSTRAINT "patient_resources_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_resources"
    ADD CONSTRAINT "patient_resources_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_resources"
    ADD CONSTRAINT "patient_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_analytics_visitor_id_fkey" FOREIGN KEY ("analytics_visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_commissions"
    ADD CONSTRAINT "referral_commissions_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_commissions"
    ADD CONSTRAINT "referral_commissions_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_receiving_psychologist_id_fkey" FOREIGN KEY ("receiving_psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referring_psychologist_id_fkey" FOREIGN KEY ("referring_psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_summaries"
    ADD CONSTRAINT "session_summaries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_summaries"
    ADD CONSTRAINT "session_summaries_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_summaries"
    ADD CONSTRAINT "session_summaries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_summaries"
    ADD CONSTRAINT "session_summaries_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_attendance_log"
    ADD CONSTRAINT "speaker_attendance_log_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_attendance_log"
    ADD CONSTRAINT "speaker_attendance_log_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_attendance_log_id_fkey" FOREIGN KEY ("attendance_log_id") REFERENCES "public"."speaker_attendance_log"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_source_transaction_id_fkey" FOREIGN KEY ("source_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_earnings"
    ADD CONSTRAINT "speaker_earnings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."speaker_month_close"
    ADD CONSTRAINT "speaker_month_close_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."speakers"
    ADD CONSTRAINT "speakers_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialization_waitlist"
    ADD CONSTRAINT "specialization_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_analytics_session_id_fkey" FOREIGN KEY ("analytics_session_id") REFERENCES "public"."analytics_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_analytics_visitor_id_fkey" FOREIGN KEY ("analytics_visitor_id") REFERENCES "public"."analytics_visitors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."therapeutic_tools"
    ADD CONSTRAINT "therapeutic_tools_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tool_assignments"
    ADD CONSTRAINT "tool_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_assignments"
    ADD CONSTRAINT "tool_assignments_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_assignments"
    ADD CONSTRAINT "tool_assignments_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "public"."therapeutic_tools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tool_responses"
    ADD CONSTRAINT "tool_responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."tool_assignments"("id") ON DELETE CASCADE;



CREATE POLICY "Admin full access to event_resources" ON "public"."event_resources" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins and ponentes can manage events" ON "public"."events" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ponente'::"public"."user_role", 'admin'::"public"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ponente'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Admins can do everything on patient documents" ON "public"."patient_documents" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can insert platform settings" ON "public"."platform_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage ARCO requests" ON "public"."arco_requests" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage agreements" ON "public"."exclusive_agreements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all appointments" ON "public"."appointments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all messages" ON "public"."messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all relationships" ON "public"."patient_psychologist_relationships" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all tasks" ON "public"."tasks" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage newsletters" ON "public"."newsletters" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update platform settings" ON "public"."platform_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all clinical records" ON "public"."clinical_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all consents" ON "public"."consent_records" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view and manage all credit transactions" ON "public"."ai_credit_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access marketing briefs" ON "public"."marketing_briefs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access marketing services" ON "public"."marketing_services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to admin operation logs" ON "public"."admin_operation_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to admin operation notes" ON "public"."admin_operation_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to analytics events" ON "public"."analytics_events" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to analytics sessions" ON "public"."analytics_sessions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to analytics visitors" ON "public"."analytics_visitors" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to assignments" ON "public"."tool_assignments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to attendance log" ON "public"."speaker_attendance_log" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to attribution touches" ON "public"."attribution_touches" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to certificate eligibility snapshots" ON "public"."certificate_eligibility_snapshots" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to certificate rules" ON "public"."certificate_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to commissions" ON "public"."referral_commissions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to event entitlements" ON "public"."event_entitlements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to event purchases" ON "public"."event_purchases" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to formation certificates" ON "public"."formation_certificates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to formation courses" ON "public"."formation_courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to formation progress" ON "public"."formation_progress" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to formation purchases" ON "public"."formation_purchases" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to formations" ON "public"."formations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to growth campaigns" ON "public"."growth_campaigns" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to invite attributions" ON "public"."invite_attributions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to invite codes" ON "public"."invite_codes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to invite reward events" ON "public"."invite_reward_events" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to manual deals" ON "public"."manual_deals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to marketing cost entries" ON "public"."marketing_cost_entries" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to membership entitlement rules" ON "public"."membership_entitlement_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to month close" ON "public"."speaker_month_close" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to referrals" ON "public"."referrals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to resources" ON "public"."resources" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to responses" ON "public"."tool_responses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to speaker earnings" ON "public"."speaker_earnings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to speakers" ON "public"."speakers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to specialization waitlist" ON "public"."specialization_waitlist" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to subscriptions" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to tools" ON "public"."therapeutic_tools" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins full access to transactions" ON "public"."payment_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Anyone can create event purchases" ON "public"."event_purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can join specialization waitlist" ON "public"."specialization_waitlist" FOR INSERT WITH CHECK (((("user_id" IS NULL) OR ("user_id" = "auth"."uid"())) AND (("email" IS NOT NULL) OR ("auth"."uid"() IS NOT NULL))));



CREATE POLICY "Anyone can look up invite codes by code" ON "public"."invite_codes" FOR SELECT USING (true);



CREATE POLICY "Anyone can read active newsletters" ON "public"."newsletters" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can read platform settings" ON "public"."platform_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can see active formations" ON "public"."formations" FOR SELECT USING (("status" = 'active'::"text"));



CREATE POLICY "Anyone can see formation courses" ON "public"."formation_courses" FOR SELECT USING (true);



CREATE POLICY "Anyone can see template tools" ON "public"."therapeutic_tools" FOR SELECT USING (("is_template" = true));



CREATE POLICY "Anyone can view event speakers" ON "public"."event_speakers" FOR SELECT USING (true);



CREATE POLICY "Anyone can view public speakers" ON "public"."speakers" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Authenticated can view events" ON "public"."events" FOR SELECT TO "authenticated" USING (("status" = ANY (ARRAY['upcoming'::"public"."event_status", 'live'::"public"."event_status", 'completed'::"public"."event_status"])));



CREATE POLICY "Authenticated users can read active agreements" ON "public"."exclusive_agreements" FOR SELECT USING ((("is_active" = true) AND ("auth"."uid"() IS NOT NULL)));



CREATE POLICY "Authenticated users can view event_resources" ON "public"."event_resources" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Creators can delete own resources" ON "public"."resources" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can delete own tools" ON "public"."therapeutic_tools" FOR DELETE USING ((("created_by" = "auth"."uid"()) AND ("is_template" = false)));



CREATE POLICY "Creators can manage own resources" ON "public"."resources" TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can see own resources" ON "public"."resources" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update own resources" ON "public"."resources" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Creators can update own tools" ON "public"."therapeutic_tools" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Enable insert access for admins to admin_settings" ON "public"."admin_settings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Enable read access for authenticated users to admin_settings" ON "public"."admin_settings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update access for admins to admin_settings" ON "public"."admin_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Event creators and admins can manage event speakers" ON "public"."event_speakers" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_speakers"."event_id") AND (("e"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"public"."user_role")))))))));



CREATE POLICY "Event creators can manage event_resources" ON "public"."event_resources" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_resources"."event_id") AND ("e"."created_by" = "auth"."uid"())))));



CREATE POLICY "Event creators can view their event purchases" ON "public"."event_purchases" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_purchases"."event_id") AND ("e"."created_by" = "auth"."uid"())))));



CREATE POLICY "Members can see members_only events" ON "public"."events" FOR SELECT USING ((("is_members_only" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."subscription_status" = ANY (ARRAY['trial'::"public"."subscription_status", 'active'::"public"."subscription_status"])))))));



CREATE POLICY "Members can see members_only resources" ON "public"."resources" FOR SELECT TO "authenticated" USING ((("visibility" = 'members_only'::"public"."visibility_type") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."subscription_status" = ANY (ARRAY['trial'::"public"."subscription_status", 'active'::"public"."subscription_status"])))))));



CREATE POLICY "Patients can cancel own appointments" ON "public"."appointments" FOR UPDATE TO "authenticated" USING ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role")))))) WITH CHECK ((("patient_id" = "auth"."uid"()) AND ("status" = 'cancelled'::"public"."appointment_status") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role"))))));



CREATE POLICY "Patients can create appointments" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role")))) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."patient_id" = "auth"."uid"()) AND ("ppr"."psychologist_id" = "appointments"."psychologist_id") AND ("ppr"."status" = 'active'::"text"))))));



CREATE POLICY "Patients can create responses" ON "public"."tool_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tool_assignments" "ta"
  WHERE (("ta"."id" = "tool_responses"."assignment_id") AND ("ta"."patient_id" = "auth"."uid"()) AND ("ta"."status" = ANY (ARRAY['pending'::"public"."assignment_status", 'in_progress'::"public"."assignment_status"]))))));



CREATE POLICY "Patients can update own assignment status" ON "public"."tool_assignments" FOR UPDATE TO "authenticated" USING ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role")))))) WITH CHECK ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role"))))));



CREATE POLICY "Patients can update own responses" ON "public"."tool_responses" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."tool_assignments" "ta"
  WHERE (("ta"."id" = "tool_responses"."assignment_id") AND ("ta"."patient_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tool_assignments" "ta"
  WHERE (("ta"."id" = "tool_responses"."assignment_id") AND ("ta"."patient_id" = "auth"."uid"())))));



CREATE POLICY "Patients can update own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("patient_id" = "auth"."uid"())) WITH CHECK (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view assigned resources" ON "public"."patient_resources" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own clinical documents" ON "public"."clinical_documents" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own clinical records" ON "public"."clinical_records" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own patient documents" ON "public"."patient_documents" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own relationships" ON "public"."patient_psychologist_relationships" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own session summaries" ON "public"."session_summaries" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients can view their psychologist" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."patient_id" = "auth"."uid"()) AND ("ppr"."psychologist_id" = "profiles"."id") AND ("ppr"."status" = 'active'::"text")))));



CREATE POLICY "Patients see own assignments" ON "public"."tool_assignments" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients see own resource assignments" ON "public"."patient_resources" FOR SELECT USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Patients see own responses" ON "public"."tool_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tool_assignments" "ta"
  WHERE (("ta"."id" = "tool_responses"."assignment_id") AND ("ta"."patient_id" = "auth"."uid"()) AND (("ta"."results_visible" = true) OR ("ta"."status" <> 'completed'::"public"."assignment_status"))))));



CREATE POLICY "Ponentes can create own speaker profile" ON "public"."speakers" FOR INSERT WITH CHECK ((("id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ponente'::"public"."user_role", 'admin'::"public"."user_role"])))))));



CREATE POLICY "Ponentes can delete own events" ON "public"."events" FOR DELETE USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ponente'::"public"."user_role"))))));



CREATE POLICY "Ponentes can modify own events" ON "public"."events" FOR UPDATE USING ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ponente'::"public"."user_role"))))));



CREATE POLICY "Ponentes can update own speaker profile" ON "public"."speakers" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Ponentes can view attendance for own events" ON "public"."speaker_attendance_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "speaker_attendance_log"."event_id") AND ("e"."created_by" = "auth"."uid"())))));



CREATE POLICY "Ponentes can view earnings for own events" ON "public"."speaker_earnings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "speaker_earnings"."event_id") AND ("e"."created_by" = "auth"."uid"())))));



CREATE POLICY "Psychologists can assign tools" ON "public"."tool_assignments" FOR INSERT TO "authenticated" WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."psychologist_id" = "auth"."uid"()) AND ("ppr"."patient_id" = "tool_assignments"."patient_id") AND ("ppr"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can create appointments" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role")))) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."psychologist_id" = "auth"."uid"()) AND ("ppr"."patient_id" = "appointments"."patient_id") AND ("ppr"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can create audit logs" ON "public"."clinical_audit_log" FOR INSERT WITH CHECK (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can create clinical documents" ON "public"."clinical_documents" FOR INSERT WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role"))))));



CREATE POLICY "Psychologists can create referrals" ON "public"."referrals" FOR INSERT WITH CHECK ((("referring_psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role") AND ("profiles"."accepts_referral_terms" = true))))));



CREATE POLICY "Psychologists can create relationships" ON "public"."patient_psychologist_relationships" FOR INSERT TO "authenticated" WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role"))))));



CREATE POLICY "Psychologists can create session summaries" ON "public"."session_summaries" FOR INSERT WITH CHECK (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can create tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."psychologist_id" = "auth"."uid"()) AND ("ppr"."patient_id" = "tasks"."patient_id") AND ("ppr"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can create tools" ON "public"."therapeutic_tools" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Psychologists can delete documents of their patients" ON "public"."patient_documents" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "psychologist_id") AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships"
  WHERE (("patient_psychologist_relationships"."psychologist_id" = "auth"."uid"()) AND ("patient_psychologist_relationships"."patient_id" = "patient_documents"."patient_id") AND ("patient_psychologist_relationships"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can delete own assignments" ON "public"."tool_assignments" FOR DELETE TO "authenticated" USING ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"])))))));



CREATE POLICY "Psychologists can delete own clinical documents" ON "public"."clinical_documents" FOR DELETE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can delete own clinical records" ON "public"."clinical_records" FOR DELETE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can delete own relationships" ON "public"."patient_psychologist_relationships" FOR DELETE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can delete own session summaries" ON "public"."session_summaries" FOR DELETE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can delete own tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"])))))));



CREATE POLICY "Psychologists can insert documents for their patients" ON "public"."patient_documents" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "psychologist_id") AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships"
  WHERE (("patient_psychologist_relationships"."psychologist_id" = "auth"."uid"()) AND ("patient_psychologist_relationships"."patient_id" = "patient_documents"."patient_id") AND ("patient_psychologist_relationships"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can manage appointments" ON "public"."appointments" TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can manage own clinical records" ON "public"."clinical_records" TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can manage resource assignments" ON "public"."patient_resources" TO "authenticated" USING (("assigned_by" = "auth"."uid"()));



CREATE POLICY "Psychologists can remove assignments" ON "public"."patient_resources" FOR DELETE USING (("assigned_by" = "auth"."uid"()));



CREATE POLICY "Psychologists can update documents of their patients" ON "public"."patient_documents" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "psychologist_id") AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships"
  WHERE (("patient_psychologist_relationships"."psychologist_id" = "auth"."uid"()) AND ("patient_psychologist_relationships"."patient_id" = "patient_documents"."patient_id") AND ("patient_psychologist_relationships"."status" = 'active'::"text")))))) WITH CHECK ((("auth"."uid"() = "psychologist_id") AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships"
  WHERE (("patient_psychologist_relationships"."psychologist_id" = "auth"."uid"()) AND ("patient_psychologist_relationships"."patient_id" = "patient_documents"."patient_id") AND ("patient_psychologist_relationships"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can update own appointments" ON "public"."appointments" FOR UPDATE TO "authenticated" USING ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role")))))) WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role"))))));



CREATE POLICY "Psychologists can update own assignments" ON "public"."tool_assignments" FOR UPDATE TO "authenticated" USING ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"]))))))) WITH CHECK ((("psychologist_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role"])))))));



CREATE POLICY "Psychologists can update own clinical documents" ON "public"."clinical_documents" FOR UPDATE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can update own clinical records" ON "public"."clinical_records" FOR UPDATE USING (("psychologist_id" = "auth"."uid"())) WITH CHECK (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can update own relationships" ON "public"."patient_psychologist_relationships" FOR UPDATE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can update own session summaries" ON "public"."session_summaries" FOR UPDATE USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can update own tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("psychologist_id" = "auth"."uid"())) WITH CHECK (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can update tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "psychologist_id"));



CREATE POLICY "Psychologists can view assigned patients" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."psychologist_id" = "auth"."uid"()) AND ("ppr"."patient_id" = "profiles"."id") AND ("ppr"."status" = 'active'::"text")))));



CREATE POLICY "Psychologists can view documents of their patients" ON "public"."patient_documents" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "psychologist_id") AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships"
  WHERE (("patient_psychologist_relationships"."psychologist_id" = "auth"."uid"()) AND ("patient_psychologist_relationships"."patient_id" = "patient_documents"."patient_id") AND ("patient_psychologist_relationships"."status" = 'active'::"text"))))));



CREATE POLICY "Psychologists can view own appointments" ON "public"."appointments" FOR SELECT TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own audit logs" ON "public"."clinical_audit_log" FOR SELECT USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own clinical documents" ON "public"."clinical_documents" FOR SELECT USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own commissions" ON "public"."referral_commissions" FOR SELECT USING (("beneficiary_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own relationships" ON "public"."patient_psychologist_relationships" FOR SELECT TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own sent referrals" ON "public"."referrals" FOR SELECT USING (("referring_psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own session summaries" ON "public"."session_summaries" FOR SELECT USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view own tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists can view received referrals" ON "public"."referrals" FOR SELECT USING (("receiving_psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists see own assignments" ON "public"."patient_resources" FOR SELECT USING (("assigned_by" = "auth"."uid"()));



CREATE POLICY "Psychologists see own assignments" ON "public"."tool_assignments" FOR SELECT TO "authenticated" USING (("psychologist_id" = "auth"."uid"()));



CREATE POLICY "Psychologists see own tools" ON "public"."therapeutic_tools" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Psychologists see patient responses" ON "public"."tool_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tool_assignments" "ta"
  WHERE (("ta"."id" = "tool_responses"."assignment_id") AND ("ta"."psychologist_id" = "auth"."uid"())))));



CREATE POLICY "Public read memberships" ON "public"."memberships" FOR SELECT USING (true);



CREATE POLICY "Public resources visible to all authenticated" ON "public"."resources" FOR SELECT TO "authenticated" USING (("visibility" = 'public'::"public"."visibility_type"));



CREATE POLICY "Receivers can mark read" ON "public"."messages" FOR UPDATE USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Receiving psychologist can update referral" ON "public"."referrals" FOR UPDATE USING (("receiving_psychologist_id" = "auth"."uid"())) WITH CHECK (("receiving_psychologist_id" = "auth"."uid"()));



CREATE POLICY "Referred users can view own attribution" ON "public"."invite_attributions" FOR SELECT USING (("referred_id" = "auth"."uid"()));



CREATE POLICY "Referrers can view their attributions" ON "public"."invite_attributions" FOR SELECT USING (("referrer_id" = "auth"."uid"()));



CREATE POLICY "Service role can insert marketing services" ON "public"."marketing_services" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Speakers can view month close records" ON "public"."speaker_month_close" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ponente'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Speakers can view own earnings" ON "public"."speaker_earnings" FOR SELECT USING (("speaker_id" = "auth"."uid"()));



CREATE POLICY "Speakers can view own profile" ON "public"."speakers" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Staff can create resources" ON "public"."resources" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['psychologist'::"public"."user_role", 'admin'::"public"."user_role", 'ponente'::"public"."user_role"]))))));



CREATE POLICY "Staff see event registrations" ON "public"."event_registrations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."events" "e"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("e"."id" = "event_registrations"."event_id") AND (("e"."created_by" = "auth"."uid"()) OR ("p"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "Students can view own attendance" ON "public"."speaker_attendance_log" FOR SELECT USING (("student_id" = "auth"."uid"()));



CREATE POLICY "Users can cancel own registrations" ON "public"."event_registrations" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can cancel registration" ON "public"."event_registrations" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create ARCO requests" ON "public"."arco_requests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own consents" ON "public"."consent_records" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own invite codes" ON "public"."invite_codes" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own calendar integrations" ON "public"."calendar_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete registration" ON "public"."event_registrations" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own calendar integrations" ON "public"."calendar_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own marketing brief" ON "public"."marketing_briefs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark own messages as read" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("receiver_id" = "auth"."uid"())) WITH CHECK (("receiver_id" = "auth"."uid"()));



CREATE POLICY "Users can register for events" ON "public"."event_registrations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can see events matching their audience" ON "public"."events" FOR SELECT USING ((('public'::"text" = ANY ("target_audience")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))) OR (('psychologists'::"text" = ANY ("target_audience")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'psychologist'::"public"."user_role"))))) OR (('patients'::"text" = ANY ("target_audience")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'patient'::"public"."user_role"))))) OR (('members'::"text" = ANY ("target_audience")) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."subscription_status" = ANY (ARRAY['trial'::"public"."subscription_status", 'active'::"public"."subscription_status"])))))) OR (('active_patients'::"text" = ANY ("target_audience")) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."patient_id" = "auth"."uid"()) AND ("ppr"."status" = 'active'::"text")))))));



CREATE POLICY "Users can see own formation certificates" ON "public"."formation_certificates" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can see own formation progress" ON "public"."formation_progress" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can see own formation purchases" ON "public"."formation_purchases" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['patient'::"public"."user_role", 'psychologist'::"public"."user_role"]))))) AND (EXISTS ( SELECT 1
   FROM "public"."patient_psychologist_relationships" "ppr"
  WHERE (("ppr"."status" = 'active'::"text") AND ((("ppr"."patient_id" = "messages"."sender_id") AND ("ppr"."psychologist_id" = "messages"."receiver_id")) OR (("ppr"."psychologist_id" = "messages"."sender_id") AND ("ppr"."patient_id" = "messages"."receiver_id"))))))));



CREATE POLICY "Users can update own calendar integrations" ON "public"."calendar_integrations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own invite codes" ON "public"."invite_codes" FOR UPDATE USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can update own marketing brief" ON "public"."marketing_briefs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own marketing services" ON "public"."marketing_services" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view active campaigns for their role" ON "public"."growth_campaigns" FOR SELECT USING ((("is_active" = true) AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" > "now"()))));



CREATE POLICY "Users can view matching entitlements" ON "public"."event_entitlements" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("lower"("btrim"(COALESCE("profiles"."email", ''::"text"))) = "event_entitlements"."identity_key"))))));



CREATE POLICY "Users can view own ARCO requests" ON "public"."arco_requests" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own calendar integrations" ON "public"."calendar_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own consents" ON "public"."consent_records" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own invite codes" ON "public"."invite_codes" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can view own marketing brief" ON "public"."marketing_briefs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own marketing services" ON "public"."marketing_services" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own registrations" ON "public"."event_registrations" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own reward events" ON "public"."invite_reward_events" FOR SELECT USING (("beneficiary_id" = "auth"."uid"()));



CREATE POLICY "Users can view own specialization waitlist rows" ON "public"."specialization_waitlist" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own tasks" ON "public"."tasks" FOR SELECT USING ((("auth"."uid"() = "patient_id") OR ("auth"."uid"() = "psychologist_id")));



CREATE POLICY "Users can view own transactions" ON "public"."payment_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own credit transactions" ON "public"."ai_credit_transactions" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users see assigned private resources" ON "public"."resources" FOR SELECT USING ((("visibility" = 'private'::"public"."visibility_type") AND (EXISTS ( SELECT 1
   FROM "public"."patient_resources" "pr"
  WHERE (("pr"."resource_id" = "resources"."id") AND ("pr"."patient_id" = "auth"."uid"()))))));



CREATE POLICY "Users see own registrations" ON "public"."event_registrations" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_operation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_operation_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_visitors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."arco_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attribution_touches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificate_eligibility_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificate_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinical_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinical_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinical_documents active rows only" ON "public"."clinical_documents" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "clinical_documents active rows only delete" ON "public"."clinical_documents" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "clinical_documents active rows only update" ON "public"."clinical_documents" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (true);



ALTER TABLE "public"."clinical_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinical_records active rows only" ON "public"."clinical_records" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "clinical_records active rows only delete" ON "public"."clinical_records" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "clinical_records active rows only update" ON "public"."clinical_records" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (true);



ALTER TABLE "public"."consent_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_entitlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_speakers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exclusive_agreements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formation_certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formation_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formation_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formation_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."growth_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_attributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_reward_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_briefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_cost_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketing_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."membership_entitlement_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_documents active rows only" ON "public"."patient_documents" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "patient_documents active rows only delete" ON "public"."patient_documents" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "patient_documents active rows only update" ON "public"."patient_documents" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (true);



ALTER TABLE "public"."patient_psychologist_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_summaries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_summaries active rows only" ON "public"."session_summaries" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "session_summaries active rows only delete" ON "public"."session_summaries" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "session_summaries active rows only update" ON "public"."session_summaries" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (true);



ALTER TABLE "public"."speaker_attendance_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."speaker_earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."speaker_month_close" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."speakers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specialization_waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."therapeutic_tools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_responses" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."acquire_payment_webhook_event"("p_provider" "text", "p_provider_event_id" "text", "p_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."acquire_payment_webhook_event"("p_provider" "text", "p_provider_event_id" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."acquire_payment_webhook_event"("p_provider" "text", "p_provider_event_id" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."are_public_referrals_enabled"() TO "anon";
GRANT ALL ON FUNCTION "public"."are_public_referrals_enabled"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_public_referrals_enabled"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric, "p_total_events" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric, "p_total_events" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_membership_earning"("p_pool_amount" numeric, "p_total_events" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."consume_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invite_code"("length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invite_code"("length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invite_code"("length" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_ponente_speaker_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_ponente_speaker_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_ponente_speaker_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_minimum_membership_level"("check_user_id" "uuid", "required_level" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_event_views"("event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_event_views"("event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_event_views"("event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_invite_use_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_invite_use_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_invite_use_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_resource_downloads"("p_resource_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_resource_downloads"("p_resource_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_resource_downloads"("p_resource_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_clinical_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_clinical_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_clinical_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_payment_webhook_failed"("p_provider" "text", "p_provider_event_id" "text", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_payment_webhook_failed"("p_provider" "text", "p_provider_event_id" "text", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_payment_webhook_failed"("p_provider" "text", "p_provider_event_id" "text", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_payment_webhook_processed"("p_provider" "text", "p_provider_event_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_payment_webhook_processed"("p_provider" "text", "p_provider_event_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_payment_webhook_processed"("p_provider" "text", "p_provider_event_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_appointment_sensitive_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_appointment_sensitive_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_appointment_sensitive_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_message_tampering"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_message_tampering"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_message_tampering"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_profile_self_sensitive_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_profile_self_sensitive_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_profile_self_sensitive_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_task_sensitive_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_task_sensitive_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_task_sensitive_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_tool_assignment_sensitive_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_tool_assignment_sensitive_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_tool_assignment_sensitive_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_ai_minutes"("p_minutes" integer, "p_source_ref" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_mature_earnings"() TO "anon";
GRANT ALL ON FUNCTION "public"."release_mature_earnings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_mature_earnings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reserve_event_checkout_purchase"("p_event_id" "uuid", "p_email" "text", "p_user_id" "uuid", "p_full_name" "text", "p_amount_paid" numeric, "p_currency" "text", "p_payment_method" "text", "p_analytics_visitor_id" "uuid", "p_analytics_session_id" "uuid", "p_attribution_snapshot" "jsonb", "p_metadata" "jsonb", "p_enforce_capacity" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."reserve_event_checkout_purchase"("p_event_id" "uuid", "p_email" "text", "p_user_id" "uuid", "p_full_name" "text", "p_amount_paid" numeric, "p_currency" "text", "p_payment_method" "text", "p_analytics_visitor_id" "uuid", "p_analytics_session_id" "uuid", "p_attribution_snapshot" "jsonb", "p_metadata" "jsonb", "p_enforce_capacity" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reserve_event_checkout_purchase"("p_event_id" "uuid", "p_email" "text", "p_user_id" "uuid", "p_full_name" "text", "p_amount_paid" numeric, "p_currency" "text", "p_payment_method" "text", "p_analytics_visitor_id" "uuid", "p_analytics_session_id" "uuid", "p_attribution_snapshot" "jsonb", "p_metadata" "jsonb", "p_enforce_capacity" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_recording_expiration"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_recording_expiration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_recording_expiration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."slugify_catalog_text"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slugify_catalog_text"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slugify_catalog_text"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_growth_campaign_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_growth_campaign_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_growth_campaign_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invite_code"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invite_code"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite_code"("p_code" "text") TO "service_role";



GRANT ALL ON TABLE "public"."admin_operation_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_operation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_operation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_operation_notes" TO "anon";
GRANT ALL ON TABLE "public"."admin_operation_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_operation_notes" TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."ai_credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_sessions" TO "anon";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_visitors" TO "anon";
GRANT ALL ON TABLE "public"."analytics_visitors" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_visitors" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."arco_requests" TO "anon";
GRANT ALL ON TABLE "public"."arco_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."arco_requests" TO "service_role";



GRANT ALL ON TABLE "public"."attribution_touches" TO "anon";
GRANT ALL ON TABLE "public"."attribution_touches" TO "authenticated";
GRANT ALL ON TABLE "public"."attribution_touches" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_integrations" TO "anon";
GRANT ALL ON TABLE "public"."calendar_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."certificate_eligibility_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."certificate_eligibility_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."certificate_eligibility_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."certificate_rules" TO "anon";
GRANT ALL ON TABLE "public"."certificate_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."certificate_rules" TO "service_role";



GRANT ALL ON TABLE "public"."clinical_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."clinical_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."clinical_documents" TO "anon";
GRANT ALL ON TABLE "public"."clinical_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_documents" TO "service_role";



GRANT ALL ON TABLE "public"."clinical_records" TO "anon";
GRANT ALL ON TABLE "public"."clinical_records" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_records" TO "service_role";



GRANT ALL ON TABLE "public"."consent_records" TO "anon";
GRANT ALL ON TABLE "public"."consent_records" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_records" TO "service_role";



GRANT ALL ON TABLE "public"."event_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."event_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."event_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."event_purchases" TO "anon";
GRANT ALL ON TABLE "public"."event_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."event_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."event_resources" TO "anon";
GRANT ALL ON TABLE "public"."event_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."event_resources" TO "service_role";



GRANT ALL ON TABLE "public"."event_speakers" TO "anon";
GRANT ALL ON TABLE "public"."event_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_speakers" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exclusive_agreements" TO "anon";
GRANT ALL ON TABLE "public"."exclusive_agreements" TO "authenticated";
GRANT ALL ON TABLE "public"."exclusive_agreements" TO "service_role";



GRANT ALL ON TABLE "public"."formation_certificates" TO "anon";
GRANT ALL ON TABLE "public"."formation_certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_certificates" TO "service_role";



GRANT ALL ON TABLE "public"."formation_courses" TO "anon";
GRANT ALL ON TABLE "public"."formation_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_courses" TO "service_role";



GRANT ALL ON TABLE "public"."formation_progress" TO "anon";
GRANT ALL ON TABLE "public"."formation_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_progress" TO "service_role";



GRANT ALL ON TABLE "public"."formation_purchases" TO "anon";
GRANT ALL ON TABLE "public"."formation_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."formation_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."formations" TO "anon";
GRANT ALL ON TABLE "public"."formations" TO "authenticated";
GRANT ALL ON TABLE "public"."formations" TO "service_role";



GRANT ALL ON TABLE "public"."growth_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."growth_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."growth_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."invite_attributions" TO "anon";
GRANT ALL ON TABLE "public"."invite_attributions" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_attributions" TO "service_role";



GRANT ALL ON TABLE "public"."invite_codes" TO "anon";
GRANT ALL ON TABLE "public"."invite_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_codes" TO "service_role";



GRANT ALL ON TABLE "public"."invite_reward_events" TO "anon";
GRANT ALL ON TABLE "public"."invite_reward_events" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_reward_events" TO "service_role";



GRANT ALL ON TABLE "public"."manual_deals" TO "anon";
GRANT ALL ON TABLE "public"."manual_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."manual_deals" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_briefs" TO "anon";
GRANT ALL ON TABLE "public"."marketing_briefs" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_briefs" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_cost_entries" TO "anon";
GRANT ALL ON TABLE "public"."marketing_cost_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_cost_entries" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_services" TO "anon";
GRANT ALL ON TABLE "public"."marketing_services" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_services" TO "service_role";



GRANT ALL ON TABLE "public"."membership_entitlement_rules" TO "anon";
GRANT ALL ON TABLE "public"."membership_entitlement_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."membership_entitlement_rules" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."newsletters" TO "anon";
GRANT ALL ON TABLE "public"."newsletters" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletters" TO "service_role";



GRANT ALL ON TABLE "public"."patient_documents" TO "anon";
GRANT ALL ON TABLE "public"."patient_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_documents" TO "service_role";



GRANT ALL ON TABLE "public"."patient_psychologist_relationships" TO "anon";
GRANT ALL ON TABLE "public"."patient_psychologist_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_psychologist_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."patient_resources" TO "anon";
GRANT ALL ON TABLE "public"."patient_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_resources" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."payment_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."payment_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."referral_commissions" TO "anon";
GRANT ALL ON TABLE "public"."referral_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."session_summaries" TO "anon";
GRANT ALL ON TABLE "public"."session_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."session_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."speaker_attendance_log" TO "anon";
GRANT ALL ON TABLE "public"."speaker_attendance_log" TO "authenticated";
GRANT ALL ON TABLE "public"."speaker_attendance_log" TO "service_role";



GRANT ALL ON TABLE "public"."speaker_earnings" TO "anon";
GRANT ALL ON TABLE "public"."speaker_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."speaker_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."speaker_month_close" TO "anon";
GRANT ALL ON TABLE "public"."speaker_month_close" TO "authenticated";
GRANT ALL ON TABLE "public"."speaker_month_close" TO "service_role";



GRANT ALL ON TABLE "public"."speakers" TO "anon";
GRANT ALL ON TABLE "public"."speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."speakers" TO "service_role";



GRANT ALL ON TABLE "public"."specialization_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."specialization_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."specialization_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."specialization_waitlist_monthly_ranking" TO "anon";
GRANT ALL ON TABLE "public"."specialization_waitlist_monthly_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."specialization_waitlist_monthly_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."therapeutic_tools" TO "anon";
GRANT ALL ON TABLE "public"."therapeutic_tools" TO "authenticated";
GRANT ALL ON TABLE "public"."therapeutic_tools" TO "service_role";



GRANT ALL ON TABLE "public"."tool_assignments" TO "anon";
GRANT ALL ON TABLE "public"."tool_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."tool_responses" TO "anon";
GRANT ALL ON TABLE "public"."tool_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_responses" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







