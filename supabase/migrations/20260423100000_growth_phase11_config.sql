-- Phase 1.1 defaults for the growth engine.
-- Keeps the existing schema and updates member referral config so consolidation
-- prefers the first paid renewal, with explicit fallback rules.

INSERT INTO public.growth_program_configs (
    program_key,
    config_json,
    is_active,
    updated_at
)
VALUES (
    'member_referral',
    jsonb_build_object(
        'attribution_window_days', 30,
        'consolidation_days', 30,
        'consolidation_rule', 'first_renewal_paid',
        'fallback_consolidation_rule', 'billing_cycle_end'
    ),
    true,
    NOW()
)
ON CONFLICT (program_key) DO UPDATE
SET
    config_json = COALESCE(public.growth_program_configs.config_json, '{}'::jsonb)
        || jsonb_build_object(
            'consolidation_rule', 'first_renewal_paid',
            'fallback_consolidation_rule', COALESCE(
                public.growth_program_configs.config_json->>'fallback_consolidation_rule',
                'billing_cycle_end'
            ),
            'consolidation_days', COALESCE(
                NULLIF(public.growth_program_configs.config_json->>'consolidation_days', '')::integer,
                30
            ),
            'attribution_window_days', COALESCE(
                NULLIF(public.growth_program_configs.config_json->>'attribution_window_days', '')::integer,
                30
            )
        ),
    is_active = true,
    updated_at = NOW();
