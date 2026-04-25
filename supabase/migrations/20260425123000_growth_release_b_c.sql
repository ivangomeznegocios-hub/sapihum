-- ============================================
-- Growth Release B/C hardening
-- Organizations, group packs and non-user reward beneficiaries.
-- Non-destructive: adds nullable columns and safe defaults only.
-- ============================================

ALTER TABLE public.growth_rewards
    ALTER COLUMN beneficiary_user_id DROP NOT NULL;

ALTER TABLE public.growth_rewards
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS group_pack_id UUID REFERENCES public.group_packs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_growth_rewards_organization
    ON public.growth_rewards(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_growth_rewards_group_pack
    ON public.growth_rewards(group_pack_id, status);

ALTER TABLE public.group_packs
    ADD COLUMN IF NOT EXISTS pack_code TEXT,
    ADD COLUMN IF NOT EXISTS active_members_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS benefit_unlocked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS unlocked_reward_id UUID REFERENCES public.growth_rewards(id) ON DELETE SET NULL;

UPDATE public.group_packs
SET pack_code = public.generate_invite_code(8)
WHERE pack_code IS NULL;

ALTER TABLE public.group_packs
    ALTER COLUMN pack_code SET NOT NULL;

ALTER TABLE public.group_packs
    ALTER COLUMN pack_code SET DEFAULT public.generate_invite_code(8);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_packs_pack_code
    ON public.group_packs(pack_code);

CREATE INDEX IF NOT EXISTS idx_group_packs_leader_status
    ON public.group_packs(leader_user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_pack_members_user_pack
    ON public.group_pack_members(group_pack_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_group_pack_members_email
    ON public.group_pack_members(group_pack_id, invited_email)
    WHERE invited_email IS NOT NULL;

INSERT INTO public.growth_program_configs (program_key, config_json, is_active)
VALUES
(
    'host_program',
    '{
        "attribution_window_days": 30,
        "consolidation_days": 30,
        "consolidation_rule": "first_renewal_paid",
        "fallback_consolidation_rule": "billing_cycle_end",
        "owner_priority": ["organization", "host", "ambassador", "member", "organic"],
        "monthly_goal": 5,
        "leaderboard_metric": "qualified_then_revenue",
        "tiers": [
            { "tier": "base", "monthly_qualified_goal": 5, "label": "Base" },
            { "tier": "pro", "monthly_qualified_goal": 10, "label": "Pro" },
            { "tier": "elite", "monthly_qualified_goal": 20, "label": "Elite" }
        ],
        "automatic_reward_types": ["badge"],
        "manual_reward_types": ["commission", "revenue_share", "manual_bonus", "level2_free_month", "upgrade_temp"],
        "reward_rules": [
            {
                "threshold": 5,
                "reward_type": "commission",
                "reward_value": { "label": "Comision host base", "amount": 0, "currency": "MXN" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "host_goal_monthly"
            },
            {
                "threshold": 10,
                "reward_type": "commission",
                "reward_value": { "label": "Comision host pro", "amount": 0, "currency": "MXN" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "host_goal_monthly"
            }
        ]
    }'::jsonb,
    true
),
(
    'ambassador_program',
    '{
        "attribution_window_days": 30,
        "consolidation_days": 30,
        "consolidation_rule": "first_renewal_paid",
        "fallback_consolidation_rule": "billing_cycle_end",
        "owner_priority": ["organization", "host", "ambassador", "member", "organic"],
        "monthly_goal": 3,
        "leaderboard_metric": "qualified_then_revenue",
        "tiers": [
            { "tier": "base", "monthly_qualified_goal": 3, "label": "Base" },
            { "tier": "pro", "monthly_qualified_goal": 6, "label": "Pro" },
            { "tier": "elite", "monthly_qualified_goal": 12, "label": "Elite" }
        ],
        "automatic_reward_types": ["extra_days", "badge"],
        "manual_reward_types": ["level2_free_month", "upgrade_temp", "manual_bonus"],
        "reward_rules": [
            {
                "threshold": 3,
                "reward_type": "badge",
                "reward_value": { "badge": "ambassador_base", "label": "Badge embajador base" },
                "automatic": true,
                "requires_manual_review": false,
                "reason_type": "ambassador_goal_monthly"
            },
            {
                "threshold": 6,
                "reward_type": "level2_free_month",
                "reward_value": { "months": 1, "membership_level": 2, "label": "1 mes Nivel 2 para embajador" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "ambassador_goal_monthly"
            }
        ]
    }'::jsonb,
    true
),
(
    'organization_program',
    '{
        "attribution_window_days": 30,
        "consolidation_days": 30,
        "consolidation_rule": "first_renewal_paid",
        "fallback_consolidation_rule": "billing_cycle_end",
        "owner_priority": ["organization", "host", "ambassador", "member", "organic"],
        "leaderboard_metric": "qualified_then_revenue",
        "automatic_reward_types": [],
        "manual_reward_types": ["revenue_share", "manual_bonus"],
        "reward_rules": [
            {
                "threshold": 1,
                "reward_type": "revenue_share",
                "reward_value": { "percentage": 0, "label": "Revenue share institucional pendiente" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "organization_revenue_share"
            }
        ]
    }'::jsonb,
    true
),
(
    'group_pack_program',
    '{
        "is_active": true,
        "leaderboard_metric": "completed_packs",
        "automatic_reward_types": [],
        "manual_reward_types": ["manual_bonus", "custom", "level2_free_month"],
        "pack_defaults": {
            "pack_3": { "required_members": 3, "label": "Pack 3" },
            "pack_5": { "required_members": 5, "label": "Pack 5" },
            "pack_10": { "required_members": 10, "label": "Pack 10" }
        },
        "reward_rules": [
            {
                "threshold": 1,
                "reward_type": "manual_bonus",
                "reward_value": { "label": "Beneficio grupal desbloqueado" },
                "automatic": false,
                "requires_manual_review": true,
                "reason_type": "group_pack_completed"
            }
        ]
    }'::jsonb,
    true
)
ON CONFLICT (program_key) DO NOTHING;
