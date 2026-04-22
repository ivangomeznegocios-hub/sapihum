-- ============================================
-- SAPIHUM Growth Engine
-- Canonical attribution, conversion, reward and program tables.
-- ============================================

-- 1. Partner / organization layer
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_type TEXT NOT NULL DEFAULT 'other'
        CHECK (organization_type IN ('university', 'association', 'college', 'community', 'other')),
    status TEXT NOT NULL DEFAULT 'lead'
        CHECK (status IN ('lead', 'prospect', 'active_partner', 'inactive_partner')),
    partner_code TEXT NOT NULL UNIQUE DEFAULT public.generate_invite_code(8),
    landing_slug TEXT UNIQUE,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    benefit_model TEXT NOT NULL DEFAULT 'custom'
        CHECK (benefit_model IN ('discount', 'revenue_share', 'bulk_access', 'custom')),
    benefit_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Canonical promoter profiles
CREATE TABLE IF NOT EXISTS public.growth_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    program_type TEXT NOT NULL DEFAULT 'member'
        CHECK (program_type IN ('member', 'host', 'ambassador', 'partner', 'group_leader', 'admin', 'organization')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'blocked')),
    referral_code TEXT NOT NULL UNIQUE DEFAULT public.generate_invite_code(8),
    referral_link_slug TEXT NOT NULL UNIQUE DEFAULT LOWER(public.generate_invite_code(10)),
    created_from_invite_code_id UUID REFERENCES public.invite_codes(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT growth_profiles_owner_required CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_profiles_user_program
    ON public.growth_profiles(user_id, program_type)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_profiles_org_program
    ON public.growth_profiles(organization_id, program_type)
    WHERE organization_id IS NOT NULL;

-- 3. Owner-of-acquisition attribution
CREATE TABLE IF NOT EXISTS public.growth_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID REFERENCES public.growth_profiles(id) ON DELETE SET NULL,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    invitee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invitee_email TEXT,
    invitee_phone TEXT,
    invitee_name TEXT,
    referral_code_used TEXT,
    source_type TEXT NOT NULL DEFAULT 'member'
        CHECK (source_type IN ('organization', 'host', 'ambassador', 'member', 'organic', 'admin')),
    source_channel TEXT NOT NULL DEFAULT 'unknown'
        CHECK (source_channel IN ('whatsapp', 'email', 'instagram', 'facebook', 'linkedin', 'direct', 'manual', 'landing', 'unknown', 'other')),
    capture_method TEXT NOT NULL DEFAULT 'manual_code'
        CHECK (capture_method IN ('url_param', 'cookie', 'local_storage', 'manual_code', 'admin', 'backfill')),
    campaign_code TEXT,
    status TEXT NOT NULL DEFAULT 'captured'
        CHECK (status IN ('captured', 'registered', 'paid', 'qualified', 'inactive', 'rejected')),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attribution_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    registered_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    qualified_at TIMESTAMPTZ,
    inactive_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_attributions_invitee_user
    ON public.growth_attributions(invitee_user_id)
    WHERE invitee_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_attributions_owner_profile
    ON public.growth_attributions(owner_profile_id);

CREATE INDEX IF NOT EXISTS idx_growth_attributions_status
    ON public.growth_attributions(status);

CREATE INDEX IF NOT EXISTS idx_growth_attributions_expires
    ON public.growth_attributions(attribution_expires_at);

-- 4. Economic conversions from Stripe / operational commerce
CREATE TABLE IF NOT EXISTS public.growth_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribution_id UUID REFERENCES public.growth_attributions(id) ON DELETE SET NULL,
    owner_profile_id UUID REFERENCES public.growth_profiles(id) ON DELETE SET NULL,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invitee_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    membership_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    conversion_type TEXT NOT NULL DEFAULT 'membership_activation'
        CHECK (conversion_type IN ('membership_activation', 'subscription_payment', 'event_purchase', 'formation_purchase', 'manual')),
    payment_provider TEXT NOT NULL DEFAULT 'stripe',
    provider_event_id TEXT,
    provider_subscription_id TEXT,
    provider_payment_id TEXT,
    provider_session_id TEXT,
    provider_invoice_id TEXT,
    membership_level_at_activation INTEGER,
    amount DECIMAL(10, 2),
    currency TEXT NOT NULL DEFAULT 'MXN',
    status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('pending', 'confirmed', 'qualified', 'cancelled', 'refunded', 'fraud_flagged')),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qualification_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    qualified_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    fraud_reason TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_conversions_payment_transaction
    ON public.growth_conversions(payment_transaction_id)
    WHERE payment_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_conversions_subscription
    ON public.growth_conversions(provider_subscription_id)
    WHERE provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_conversions_status_due
    ON public.growth_conversions(status, qualification_due_at);

CREATE INDEX IF NOT EXISTS idx_growth_conversions_owner
    ON public.growth_conversions(owner_profile_id, status);

-- 5. Reward ledger
CREATE TABLE IF NOT EXISTS public.growth_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribution_id UUID REFERENCES public.growth_attributions(id) ON DELETE SET NULL,
    conversion_id UUID REFERENCES public.growth_conversions(id) ON DELETE SET NULL,
    beneficiary_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    growth_profile_id UUID REFERENCES public.growth_profiles(id) ON DELETE SET NULL,
    reward_type TEXT NOT NULL
        CHECK (reward_type IN ('extra_days', 'level2_free_month', 'upgrade_temp', 'exclusive_session', 'badge', 'manual_bonus', 'commission', 'revenue_share', 'custom')),
    reward_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason_type TEXT NOT NULL DEFAULT 'manual',
    reason_reference_id UUID,
    status TEXT NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'approved', 'granted', 'revoked', 'expired')),
    automatic BOOLEAN NOT NULL DEFAULT false,
    requires_manual_review BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_rewards_beneficiary
    ON public.growth_rewards(beneficiary_user_id, status);

CREATE INDEX IF NOT EXISTS idx_growth_rewards_pending
    ON public.growth_rewards(status, created_at)
    WHERE status IN ('pending_review', 'approved');

CREATE INDEX IF NOT EXISTS idx_growth_rewards_profile
    ON public.growth_rewards(growth_profile_id);

-- 6. Internal membership benefits created by growth rewards
CREATE TABLE IF NOT EXISTS public.growth_membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL UNIQUE REFERENCES public.growth_rewards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    benefit_type TEXT NOT NULL
        CHECK (benefit_type IN ('extra_days', 'temporary_upgrade')),
    membership_level INTEGER NOT NULL DEFAULT 1,
    specialization_code TEXT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked', 'expired')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_membership_benefits_active
    ON public.growth_membership_benefits(user_id, status, starts_at, ends_at);

-- 7. Admin-editable program config
CREATE TABLE IF NOT EXISTS public.growth_program_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_key TEXT NOT NULL UNIQUE,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Program enrollments for hosts / ambassadors / partners
CREATE TABLE IF NOT EXISTS public.growth_program_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    growth_profile_id UUID REFERENCES public.growth_profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    program_type TEXT NOT NULL
        CHECK (program_type IN ('host', 'ambassador', 'partner_manager', 'group_leader')),
    status TEXT NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied', 'approved', 'rejected', 'paused', 'active', 'terminated')),
    tier TEXT CHECK (tier IN ('base', 'pro', 'elite')),
    approval_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_enrollments_user_program
    ON public.growth_program_enrollments(user_id, program_type)
    WHERE user_id IS NOT NULL;

-- 9. Basic fraud review queue
CREATE TABLE IF NOT EXISTS public.growth_fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    growth_attribution_id UUID REFERENCES public.growth_attributions(id) ON DELETE SET NULL,
    growth_conversion_id UUID REFERENCES public.growth_conversions(id) ON DELETE SET NULL,
    flag_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewed', 'dismissed', 'confirmed')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_fraud_flags_status
    ON public.growth_fraud_flags(status, severity);

-- 10. Group packs
CREATE TABLE IF NOT EXISTS public.group_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leader_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    growth_profile_id UUID REFERENCES public.growth_profiles(id) ON DELETE SET NULL,
    pack_type TEXT NOT NULL DEFAULT 'custom'
        CHECK (pack_type IN ('pack_3', 'pack_5', 'pack_10', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'inviting', 'partially_active', 'completed', 'cancelled')),
    required_members INTEGER NOT NULL DEFAULT 3 CHECK (required_members > 0),
    benefit_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_pack_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_pack_id UUID NOT NULL REFERENCES public.group_packs(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_phone TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'registered', 'activated', 'active', 'inactive')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_pack_members_pack
    ON public.group_pack_members(group_pack_id, status);

-- 11. Default member referral config
INSERT INTO public.growth_program_configs (program_key, config_json, is_active)
VALUES (
    'member_referral',
    '{
        "attribution_window_days": 30,
        "consolidation_days": 30,
        "owner_priority": ["organization", "host", "ambassador", "member", "organic"],
        "automatic_reward_types": ["extra_days", "badge"],
        "manual_reward_types": ["level2_free_month", "upgrade_temp", "commission", "revenue_share", "manual_bonus"],
        "reward_rules": [
            {
                "threshold": 1,
                "reward_type": "extra_days",
                "reward_value": { "days": 15, "label": "15 dias extra" },
                "automatic": true,
                "requires_manual_review": false,
                "reason_type": "referral_active_1"
            },
            {
                "threshold": 2,
                "reward_type": "extra_days",
                "reward_value": { "days": 15, "label": "15 dias extra" },
                "automatic": true,
                "requires_manual_review": false,
                "reason_type": "referral_active_2"
            },
            {
                "threshold": 4,
                "reward_type": "level2_free_month",
                "reward_value": { "months": 1, "membership_level": 2, "label": "1 mes de Nivel 2" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "referral_active_4"
            },
            {
                "threshold": 8,
                "reward_type": "level2_free_month",
                "reward_value": { "months": 2, "membership_level": 2, "label": "2 meses de Nivel 2" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "referral_active_8"
            },
            {
                "threshold": 12,
                "reward_type": "badge",
                "reward_value": { "badge": "ambassador_candidate", "label": "Badge de candidato embajador" },
                "automatic": true,
                "requires_manual_review": false,
                "reason_type": "referral_active_12"
            }
        ]
    }'::jsonb,
    true
)
ON CONFLICT (program_key) DO NOTHING;

-- 12. Backfill existing invite codes into canonical growth profiles.
INSERT INTO public.growth_profiles (
    user_id,
    program_type,
    status,
    referral_code,
    referral_link_slug,
    created_from_invite_code_id,
    metadata,
    created_at,
    updated_at
)
SELECT
    invite_codes.owner_id,
    'member',
    CASE WHEN invite_codes.is_active THEN 'active' ELSE 'paused' END,
    invite_codes.code,
    LOWER(invite_codes.code),
    invite_codes.id,
    jsonb_build_object('backfilled_from', 'invite_codes'),
    invite_codes.created_at,
    NOW()
FROM public.invite_codes AS invite_codes
WHERE NOT EXISTS (
    SELECT 1
    FROM public.growth_profiles AS profiles
    WHERE profiles.user_id = invite_codes.owner_id
      AND profiles.program_type = 'member'
);

-- 13. Backfill existing invite attributions into the canonical attribution table.
INSERT INTO public.growth_attributions (
    owner_profile_id,
    owner_user_id,
    invitee_user_id,
    invitee_email,
    referral_code_used,
    source_type,
    source_channel,
    capture_method,
    status,
    captured_at,
    attribution_expires_at,
    registered_at,
    metadata,
    created_at,
    updated_at
)
SELECT
    growth_profiles.id,
    invite_attributions.referrer_id,
    invite_attributions.referred_id,
    referred.email,
    invite_codes.code,
    'member',
    'unknown',
    'backfill',
    CASE
        WHEN invite_attributions.status IN ('completed', 'rewarded') THEN 'registered'
        ELSE 'captured'
    END,
    invite_attributions.attributed_at,
    invite_attributions.attributed_at + INTERVAL '30 days',
    CASE
        WHEN invite_attributions.status IN ('completed', 'rewarded') THEN COALESCE(invite_attributions.completed_at, invite_attributions.attributed_at)
        ELSE NULL
    END,
    jsonb_build_object(
        'backfilled_from', 'invite_attributions',
        'legacy_attribution_id', invite_attributions.id,
        'legacy_status', invite_attributions.status
    ),
    invite_attributions.attributed_at,
    NOW()
FROM public.invite_attributions AS invite_attributions
JOIN public.invite_codes AS invite_codes
    ON invite_codes.id = invite_attributions.invite_code_id
JOIN public.growth_profiles AS growth_profiles
    ON growth_profiles.user_id = invite_attributions.referrer_id
   AND growth_profiles.program_type = 'member'
LEFT JOIN public.profiles AS referred
    ON referred.id = invite_attributions.referred_id
WHERE invite_attributions.program_type = 'professional_invite'
  AND NOT EXISTS (
      SELECT 1
      FROM public.growth_attributions AS existing
      WHERE existing.invitee_user_id = invite_attributions.referred_id
  );

-- 14. Updated_at triggers
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'organizations',
        'growth_profiles',
        'growth_attributions',
        'growth_conversions',
        'growth_rewards',
        'growth_membership_benefits',
        'growth_program_configs',
        'growth_program_enrollments',
        'growth_fraud_flags',
        'group_packs',
        'group_pack_members'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', table_name, table_name);
        EXECUTE format(
            'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
            table_name,
            table_name
        );
    END LOOP;
END $$;

-- 15. RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_membership_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_program_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_pack_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to organizations" ON public.organizations;
CREATE POLICY "Admins full access to organizations"
    ON public.organizations FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view active organizations" ON public.organizations;
CREATE POLICY "Users can view active organizations"
    ON public.organizations FOR SELECT
    USING (status = 'active_partner');

DROP POLICY IF EXISTS "Admins full access to growth profiles" ON public.growth_profiles;
CREATE POLICY "Admins full access to growth profiles"
    ON public.growth_profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own growth profiles" ON public.growth_profiles;
CREATE POLICY "Users can view own growth profiles"
    ON public.growth_profiles FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth attributions" ON public.growth_attributions;
CREATE POLICY "Admins full access to growth attributions"
    ON public.growth_attributions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view relevant growth attributions" ON public.growth_attributions;
CREATE POLICY "Users can view relevant growth attributions"
    ON public.growth_attributions FOR SELECT
    USING (owner_user_id = auth.uid() OR invitee_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth conversions" ON public.growth_conversions;
CREATE POLICY "Admins full access to growth conversions"
    ON public.growth_conversions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view relevant growth conversions" ON public.growth_conversions;
CREATE POLICY "Users can view relevant growth conversions"
    ON public.growth_conversions FOR SELECT
    USING (owner_user_id = auth.uid() OR invitee_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth rewards" ON public.growth_rewards;
CREATE POLICY "Admins full access to growth rewards"
    ON public.growth_rewards FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own growth rewards" ON public.growth_rewards;
CREATE POLICY "Users can view own growth rewards"
    ON public.growth_rewards FOR SELECT
    USING (beneficiary_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth membership benefits" ON public.growth_membership_benefits;
CREATE POLICY "Admins full access to growth membership benefits"
    ON public.growth_membership_benefits FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own growth membership benefits" ON public.growth_membership_benefits;
CREATE POLICY "Users can view own growth membership benefits"
    ON public.growth_membership_benefits FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth configs" ON public.growth_program_configs;
CREATE POLICY "Admins full access to growth configs"
    ON public.growth_program_configs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view active growth configs" ON public.growth_program_configs;
CREATE POLICY "Authenticated users can view active growth configs"
    ON public.growth_program_configs FOR SELECT
    USING (is_active = true AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins full access to growth enrollments" ON public.growth_program_enrollments;
CREATE POLICY "Admins full access to growth enrollments"
    ON public.growth_program_enrollments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own growth enrollments" ON public.growth_program_enrollments;
CREATE POLICY "Users can view own growth enrollments"
    ON public.growth_program_enrollments FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to growth fraud flags" ON public.growth_fraud_flags;
CREATE POLICY "Admins full access to growth fraud flags"
    ON public.growth_fraud_flags FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins full access to group packs" ON public.group_packs;
CREATE POLICY "Admins full access to group packs"
    ON public.group_packs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Leaders can view own group packs" ON public.group_packs;
CREATE POLICY "Leaders can view own group packs"
    ON public.group_packs FOR SELECT
    USING (leader_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access to group pack members" ON public.group_pack_members;
CREATE POLICY "Admins full access to group pack members"
    ON public.group_pack_members FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own group pack member rows" ON public.group_pack_members;
CREATE POLICY "Users can view own group pack member rows"
    ON public.group_pack_members FOR SELECT
    USING (user_id = auth.uid());
