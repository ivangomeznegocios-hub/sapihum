-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 037_hipaa_audit_triggers
-- Description: Creates database triggers to automatically log all mutations to clinical data
-- ============================================

-- Ensure the auth.uid() function is usable within the trigger
-- The trigger executes in the context of the user, so auth.uid() resolves correctly

CREATE OR REPLACE FUNCTION public.log_clinical_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Drop existing triggers if re-running
DROP TRIGGER IF EXISTS trg_audit_clinical_records ON public.clinical_records;
DROP TRIGGER IF EXISTS trg_audit_clinical_documents ON public.clinical_documents;
DROP TRIGGER IF EXISTS trg_audit_patient_documents ON public.patient_documents;
DROP TRIGGER IF EXISTS trg_audit_session_summaries ON public.session_summaries;

-- Attach triggers
CREATE TRIGGER trg_audit_clinical_records
    AFTER INSERT OR UPDATE OR DELETE ON public.clinical_records
    FOR EACH ROW EXECUTE FUNCTION public.log_clinical_mutation();

CREATE TRIGGER trg_audit_clinical_documents
    AFTER INSERT OR UPDATE OR DELETE ON public.clinical_documents
    FOR EACH ROW EXECUTE FUNCTION public.log_clinical_mutation();

CREATE TRIGGER trg_audit_patient_documents
    AFTER INSERT OR UPDATE OR DELETE ON public.patient_documents
    FOR EACH ROW EXECUTE FUNCTION public.log_clinical_mutation();

CREATE TRIGGER trg_audit_session_summaries
    AFTER INSERT OR UPDATE OR DELETE ON public.session_summaries
    FOR EACH ROW EXECUTE FUNCTION public.log_clinical_mutation();
