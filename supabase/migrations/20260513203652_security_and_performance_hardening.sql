-- Security and performance hardening from Supabase advisors.

-- Views in exposed schemas should run with caller privileges so RLS is enforced.
ALTER VIEW IF EXISTS public.specialization_waitlist_monthly_ranking
SET (security_invoker = true);

-- Keep webhook event rows private while satisfying the RLS linter.
DROP POLICY IF EXISTS "Service role manages payment webhook events" ON public.payment_webhook_events;
CREATE POLICY "Service role manages payment webhook events"
ON public.payment_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Direct guest inserts into purchases are no longer needed; checkout goes through
-- the service-role API and reserve_event_checkout_purchase().
DROP POLICY IF EXISTS "Anyone can create event purchases" ON public.event_purchases;
DROP POLICY IF EXISTS "Service role can create event purchases" ON public.event_purchases;
CREATE POLICY "Service role can create event purchases"
ON public.event_purchases
FOR INSERT
TO service_role
WITH CHECK (true);

-- Make AI credit mutations service-safe. Refunds must not be callable directly by
-- signed-in users because they add balance.
DROP FUNCTION IF EXISTS public.consume_ai_minutes(integer, text, text);
CREATE OR REPLACE FUNCTION public.consume_ai_minutes(
    p_minutes INTEGER,
    p_source_ref TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_profile_id UUID DEFAULT NULL
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
    v_profile_id UUID := COALESCE(p_profile_id, auth.uid());
    v_source_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
    IF p_profile_id IS NOT NULL AND COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'service role required for explicit profile_id';
    END IF;

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

DROP FUNCTION IF EXISTS public.refund_ai_minutes(integer, text, text);
CREATE OR REPLACE FUNCTION public.refund_ai_minutes(
    p_minutes INTEGER,
    p_source_ref TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_profile_id UUID DEFAULT NULL
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
    v_profile_id UUID := COALESCE(p_profile_id, auth.uid());
    v_source_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'service role required';
    END IF;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'profile_id is required';
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

REVOKE EXECUTE ON FUNCTION public.consume_ai_minutes(integer, text, text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_minutes(integer, text, text, uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.refund_ai_minutes(integer, text, text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_minutes(integer, text, text, uuid) TO service_role;

-- Internal SECURITY DEFINER functions should not be exposed via REST RPC.
REVOKE EXECUTE ON FUNCTION public.acquire_payment_webhook_event(text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_payment_webhook_event(text, text, jsonb) TO service_role;
REVOKE EXECUTE ON FUNCTION public.mark_payment_webhook_processed(text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_webhook_processed(text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.mark_payment_webhook_failed(text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_webhook_failed(text, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.reserve_event_checkout_purchase(uuid, text, uuid, text, numeric, text, text, uuid, uuid, jsonb, jsonb, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_event_checkout_purchase(uuid, text, uuid, text, numeric, text, text, uuid, uuid, jsonb, jsonb, boolean) TO service_role;
REVOKE EXECUTE ON FUNCTION public.validate_invite_code(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE EXECUTE ON FUNCTION public.handle_ponente_speaker_profile() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_ponente_speaker_profile() TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_invite_use_count() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_invite_use_count() TO service_role;
REVOKE EXECUTE ON FUNCTION public.log_clinical_mutation() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_clinical_mutation() TO service_role;
REVOKE EXECUTE ON FUNCTION public.prevent_appointment_sensitive_changes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_appointment_sensitive_changes() TO service_role;
REVOKE EXECUTE ON FUNCTION public.prevent_message_tampering() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_message_tampering() TO service_role;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_self_sensitive_changes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_profile_self_sensitive_changes() TO service_role;
REVOKE EXECUTE ON FUNCTION public.prevent_task_sensitive_changes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_task_sensitive_changes() TO service_role;
REVOKE EXECUTE ON FUNCTION public.prevent_tool_assignment_sensitive_changes() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_tool_assignment_sensitive_changes() TO service_role;
DO $$
BEGIN
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
    END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.release_mature_earnings() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_mature_earnings() TO service_role;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_email() TO service_role;

-- Pin search_path on helper and trigger functions flagged by the advisor.
ALTER FUNCTION public.are_public_referrals_enabled() SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_membership_earning(numeric, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_invite_code(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_minimum_membership_level(uuid, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_event_views(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_invite_use_count() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_resource_downloads(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.log_clinical_mutation() SET search_path = public, pg_temp;
ALTER FUNCTION public.set_recording_expiration() SET search_path = public, pg_temp;
ALTER FUNCTION public.slugify_catalog_text(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_profile_email() SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_user_notification_state() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_growth_campaign_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_growth_reward_grants_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.validate_invite_code(text) SET search_path = public, pg_temp;

-- Cover foreign keys reported by Supabase performance advisor.
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_actor_user_id ON public.admin_operation_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_notes_created_by ON public.admin_operation_notes (created_by);
CREATE INDEX IF NOT EXISTS idx_admin_operation_notes_updated_by ON public.admin_operation_notes (updated_by);
CREATE INDEX IF NOT EXISTS idx_arco_requests_resolved_by ON public.arco_requests (resolved_by);
CREATE INDEX IF NOT EXISTS idx_certificate_rules_created_by ON public.certificate_rules (created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_patient_id ON public.clinical_audit_log (patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_log_psychologist_id ON public.clinical_audit_log (psychologist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_deleted_by ON public.clinical_documents (deleted_by);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_psychologist_id ON public.clinical_documents (psychologist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_deleted_by ON public.clinical_records (deleted_by);
CREATE INDEX IF NOT EXISTS idx_event_interest_leads_event_id ON public.event_interest_leads (event_id);
CREATE INDEX IF NOT EXISTS idx_event_interest_leads_user_id ON public.event_interest_leads (user_id);
CREATE INDEX IF NOT EXISTS idx_exclusive_agreements_created_by ON public.exclusive_agreements (created_by);
CREATE INDEX IF NOT EXISTS idx_formation_certificates_event_id ON public.formation_certificates (event_id);
CREATE INDEX IF NOT EXISTS idx_formation_certificates_issued_by ON public.formation_certificates (issued_by);
CREATE INDEX IF NOT EXISTS idx_formation_certificates_user_id ON public.formation_certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_formation_progress_event_id ON public.formation_progress (event_id);
CREATE INDEX IF NOT EXISTS idx_formations_created_by ON public.formations (created_by);
CREATE INDEX IF NOT EXISTS idx_group_pack_members_user_id ON public.group_pack_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_packs_growth_profile_id ON public.group_packs (growth_profile_id);
CREATE INDEX IF NOT EXISTS idx_group_packs_organization_id ON public.group_packs (organization_id);
CREATE INDEX IF NOT EXISTS idx_group_packs_unlocked_reward_id ON public.group_packs (unlocked_reward_id);
CREATE INDEX IF NOT EXISTS idx_growth_attributions_organization_id ON public.growth_attributions (organization_id);
CREATE INDEX IF NOT EXISTS idx_growth_attributions_owner_user_id ON public.growth_attributions (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_growth_campaigns_created_by ON public.growth_campaigns (created_by);
CREATE INDEX IF NOT EXISTS idx_growth_conversions_attribution_id ON public.growth_conversions (attribution_id);
CREATE INDEX IF NOT EXISTS idx_growth_conversions_invitee_user_id ON public.growth_conversions (invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_growth_conversions_membership_id ON public.growth_conversions (membership_id);
CREATE INDEX IF NOT EXISTS idx_growth_conversions_owner_user_id ON public.growth_conversions (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_growth_fraud_flags_growth_attribution_id ON public.growth_fraud_flags (growth_attribution_id);
CREATE INDEX IF NOT EXISTS idx_growth_fraud_flags_growth_conversion_id ON public.growth_fraud_flags (growth_conversion_id);
CREATE INDEX IF NOT EXISTS idx_growth_fraud_flags_related_user_id ON public.growth_fraud_flags (related_user_id);
CREATE INDEX IF NOT EXISTS idx_growth_fraud_flags_user_id ON public.growth_fraud_flags (user_id);
CREATE INDEX IF NOT EXISTS idx_growth_profiles_created_from_invite_code_id ON public.growth_profiles (created_from_invite_code_id);
CREATE INDEX IF NOT EXISTS idx_growth_program_configs_updated_by ON public.growth_program_configs (updated_by);
CREATE INDEX IF NOT EXISTS idx_growth_program_enrollments_approved_by ON public.growth_program_enrollments (approved_by);
CREATE INDEX IF NOT EXISTS idx_growth_program_enrollments_growth_profile_id ON public.growth_program_enrollments (growth_profile_id);
CREATE INDEX IF NOT EXISTS idx_growth_program_enrollments_organization_id ON public.growth_program_enrollments (organization_id);
CREATE INDEX IF NOT EXISTS idx_growth_rewards_approved_by ON public.growth_rewards (approved_by);
CREATE INDEX IF NOT EXISTS idx_growth_rewards_attribution_id ON public.growth_rewards (attribution_id);
CREATE INDEX IF NOT EXISTS idx_growth_rewards_conversion_id ON public.growth_rewards (conversion_id);
CREATE INDEX IF NOT EXISTS idx_manual_deals_created_by ON public.manual_deals (created_by);
CREATE INDEX IF NOT EXISTS idx_manual_deals_user_id ON public.manual_deals (user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_cost_entries_created_by ON public.marketing_cost_entries (created_by);
CREATE INDEX IF NOT EXISTS idx_membership_entitlement_rules_created_by ON public.membership_entitlement_rules (created_by);
CREATE INDEX IF NOT EXISTS idx_membership_entitlement_rules_event_id ON public.membership_entitlement_rules (event_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_by ON public.newsletters (created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations (created_by);
CREATE INDEX IF NOT EXISTS idx_patient_documents_deleted_by ON public.patient_documents (deleted_by);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON public.patient_documents (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_resources_assigned_by ON public.patient_resources (assigned_by);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_analytics_session_id ON public.payment_transactions (analytics_session_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings (updated_by);
CREATE INDEX IF NOT EXISTS idx_referrals_assigned_by ON public.referrals (assigned_by);
CREATE INDEX IF NOT EXISTS idx_session_summaries_appointment_id ON public.session_summaries (appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_summaries_deleted_by ON public.session_summaries (deleted_by);
CREATE INDEX IF NOT EXISTS idx_session_summaries_psychologist_id ON public.session_summaries (psychologist_id);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_attendance_log_id ON public.speaker_earnings (attendance_log_id);
CREATE INDEX IF NOT EXISTS idx_speaker_earnings_source_transaction_id ON public.speaker_earnings (source_transaction_id);
CREATE INDEX IF NOT EXISTS idx_speaker_month_close_closed_by ON public.speaker_month_close (closed_by);
CREATE INDEX IF NOT EXISTS idx_specialization_waitlist_user_id ON public.specialization_waitlist (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_analytics_session_id ON public.subscriptions (analytics_session_id);
