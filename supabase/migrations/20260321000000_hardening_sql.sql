-- ============================================
-- MIGRATION: 20260321000000_hardening_sql
-- Description: Hardens payment idempotency, AI credits, RLS, storage policies,
--              and codifies drift for messages/tasks.
-- ============================================

-- ============================================================================
-- 1. Stripe webhook idempotency
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'processed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts > 0),
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_event_id)
);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
    ON public.payment_webhook_events (status);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_provider_locked
    ON public.payment_webhook_events (provider, locked_at DESC);

CREATE OR REPLACE FUNCTION public.acquire_payment_webhook_event(
    p_provider TEXT,
    p_provider_event_id TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.mark_payment_webhook_processed(
    p_provider TEXT,
    p_provider_event_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.mark_payment_webhook_failed(
    p_provider TEXT,
    p_provider_event_id TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- ============================================================================
-- 2. AI credits hardening
-- ============================================================================

ALTER TABLE public.ai_credit_transactions
    ADD COLUMN IF NOT EXISTS source_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_credit_transactions_source_ref_unique
    ON public.ai_credit_transactions (source_ref)
    WHERE source_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION public.consume_ai_minutes(
    p_minutes INTEGER,
    p_source_ref TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    profile_id UUID,
    transaction_id UUID,
    previous_balance INTEGER,
    new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

CREATE OR REPLACE FUNCTION public.refund_ai_minutes(
    p_minutes INTEGER,
    p_source_ref TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    profile_id UUID,
    transaction_id UUID,
    previous_balance INTEGER,
    new_balance INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- ============================================================================
-- 3. Payment transaction uniqueness
-- ============================================================================

WITH ranked_duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY provider_session_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.payment_transactions
    WHERE provider_session_id IS NOT NULL
)
DELETE FROM public.payment_transactions pt
USING ranked_duplicates rd
WHERE pt.id = rd.id
  AND rd.rn > 1;

WITH ranked_duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY provider_payment_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.payment_transactions
    WHERE provider_payment_id IS NOT NULL
)
DELETE FROM public.payment_transactions pt
USING ranked_duplicates rd
WHERE pt.id = rd.id
  AND rd.rn > 1;

WITH ranked_duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY provider_invoice_id
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.payment_transactions
    WHERE provider_invoice_id IS NOT NULL
)
DELETE FROM public.payment_transactions pt
USING ranked_duplicates rd
WHERE pt.id = rd.id
  AND rd.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_session_id_unique
    ON public.payment_transactions (provider_session_id)
    WHERE provider_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_payment_id_unique
    ON public.payment_transactions (provider_payment_id)
    WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_provider_invoice_id_unique
    ON public.payment_transactions (provider_invoice_id)
    WHERE provider_invoice_id IS NOT NULL;

-- ============================================================================
-- 4. RLS hardening for appointments
-- ============================================================================

DROP POLICY IF EXISTS "Psychologists can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Psychologists can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Psychologists can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Psychologists can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can cancel own appointments" ON public.appointments;

CREATE POLICY "Psychologists can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (psychologist_id = auth.uid());

CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Psychologists can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
    AND EXISTS (
        SELECT 1
        FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
          AND ppr.patient_id = appointments.patient_id
          AND ppr.status = 'active'
    )
);

CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'patient'
    )
    AND EXISTS (
        SELECT 1
        FROM public.patient_psychologist_relationships ppr
        WHERE ppr.patient_id = auth.uid()
          AND ppr.psychologist_id = appointments.psychologist_id
          AND ppr.status = 'active'
    )
);

CREATE POLICY "Psychologists can update own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
)
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
);

CREATE POLICY "Patients can cancel own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    patient_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'patient'
    )
)
WITH CHECK (
    patient_id = auth.uid()
    AND status = 'cancelled'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'patient'
    )
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.prevent_appointment_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

DROP TRIGGER IF EXISTS trg_prevent_appointment_sensitive_changes ON public.appointments;
CREATE TRIGGER trg_prevent_appointment_sensitive_changes
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_appointment_sensitive_changes();

-- ============================================================================
-- 5. RLS hardening for tool_assignments
-- ============================================================================

DROP POLICY IF EXISTS "Psychologists see own assignments" ON public.tool_assignments;
DROP POLICY IF EXISTS "Patients see own assignments" ON public.tool_assignments;
DROP POLICY IF EXISTS "Psychologists can assign tools" ON public.tool_assignments;
DROP POLICY IF EXISTS "Psychologists can update own assignments" ON public.tool_assignments;
DROP POLICY IF EXISTS "Patients can update own assignment status" ON public.tool_assignments;
DROP POLICY IF EXISTS "Psychologists can delete own assignments" ON public.tool_assignments;
DROP POLICY IF EXISTS "Admins full access to assignments" ON public.tool_assignments;

CREATE POLICY "Psychologists see own assignments"
ON public.tool_assignments
FOR SELECT
TO authenticated
USING (psychologist_id = auth.uid());

CREATE POLICY "Patients see own assignments"
ON public.tool_assignments
FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Psychologists can assign tools"
ON public.tool_assignments
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
    AND EXISTS (
        SELECT 1
        FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
          AND ppr.patient_id = tool_assignments.patient_id
          AND ppr.status = 'active'
    )
);

CREATE POLICY "Psychologists can update own assignments"
ON public.tool_assignments
FOR UPDATE
TO authenticated
USING (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
)
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
);

CREATE POLICY "Patients can update own assignment status"
ON public.tool_assignments
FOR UPDATE
TO authenticated
USING (
    patient_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'patient'
    )
)
WITH CHECK (
    patient_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'patient'
    )
);

CREATE POLICY "Psychologists can delete own assignments"
ON public.tool_assignments
FOR DELETE
TO authenticated
USING (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
);

CREATE POLICY "Admins full access to assignments"
ON public.tool_assignments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.prevent_tool_assignment_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

DROP TRIGGER IF EXISTS trg_prevent_tool_assignment_sensitive_changes ON public.tool_assignments;
CREATE TRIGGER trg_prevent_tool_assignment_sensitive_changes
    BEFORE UPDATE ON public.tool_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_tool_assignment_sensitive_changes();

-- ============================================================================
-- 6. Storage policies for clinical-documents
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-documents', 'clinical-documents', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- NOTE:
-- Hosted Supabase does not allow this migration role to ALTER TABLE / CREATE POLICY
-- on storage.objects. The bucket is materialized here, but the storage policies must
-- be applied manually from the Dashboard SQL Editor using:
--   supabase/manual/20260321000000_clinical_documents_storage_policies.sql

-- ============================================================================
-- 7. Drift codification for messages and tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS sender_id UUID;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS receiver_id UUID;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'messages_content_not_empty'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_content_not_empty CHECK (btrim(content) <> '');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_sender_created
    ON public.messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_read_created
    ON public.messages (receiver_id, is_read, created_at DESC);

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark own messages as read" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('patient', 'psychologist')
    )
    AND EXISTS (
        SELECT 1
        FROM public.patient_psychologist_relationships ppr
        WHERE ppr.status = 'active'
          AND (
              (ppr.patient_id = sender_id AND ppr.psychologist_id = receiver_id)
              OR
              (ppr.psychologist_id = sender_id AND ppr.patient_id = receiver_id)
          )
    )
);

CREATE POLICY "Users can mark own messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Admins can manage all messages"
ON public.messages
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.prevent_message_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

DROP TRIGGER IF EXISTS trg_prevent_message_tampering ON public.messages;
CREATE TRIGGER trg_prevent_message_tampering
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_message_tampering();

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS patient_id UUID;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS psychologist_id UUID;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS response JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS completion_notes TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasks_type_allowed'
    ) THEN
        ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_type_allowed CHECK (type IN ('journal', 'reading', 'exercise', 'form', 'general'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasks_status_allowed'
    ) THEN
        ALTER TABLE public.tasks
        ADD CONSTRAINT tasks_status_allowed CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_patient
    ON public.tasks (patient_id);

CREATE INDEX IF NOT EXISTS idx_tasks_psychologist
    ON public.tasks (psychologist_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON public.tasks (status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON public.tasks (due_date);

DROP POLICY IF EXISTS "Patients can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Psychologists can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Psychologists can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Patients can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Psychologists can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Psychologists can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;

CREATE POLICY "Patients can view own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "Psychologists can view own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
    AND EXISTS (
        SELECT 1
        FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
          AND ppr.patient_id = tasks.patient_id
          AND ppr.status = 'active'
    )
);

CREATE POLICY "Patients can update own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Psychologists can update own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

CREATE POLICY "Psychologists can delete own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('psychologist', 'admin')
    )
);

CREATE POLICY "Admins can manage all tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
);

CREATE OR REPLACE FUNCTION public.prevent_task_sensitive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

DROP TRIGGER IF EXISTS trg_prevent_task_sensitive_changes ON public.tasks;
CREATE TRIGGER trg_prevent_task_sensitive_changes
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_task_sensitive_changes();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
