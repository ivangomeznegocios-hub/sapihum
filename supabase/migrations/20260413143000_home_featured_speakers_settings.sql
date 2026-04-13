INSERT INTO public.platform_settings (key, value, description)
VALUES (
    'home_featured_speakers',
    '{
        "mode": "ranked",
        "manualSpeakerIds": [],
        "rotationPoolSize": 8,
        "limit": 4
    }'::jsonb,
    'Controls how the marketing homepage selects featured speakers.'
)
ON CONFLICT (key) DO NOTHING;
