-- ============================================
-- Private calendar feed tokens
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calendar_feed_token TEXT;

UPDATE public.profiles
SET calendar_feed_token = replace(gen_random_uuid()::text, '-', '')
WHERE calendar_feed_token IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN calendar_feed_token
SET DEFAULT replace(gen_random_uuid()::text, '-', '');

ALTER TABLE public.profiles
ALTER COLUMN calendar_feed_token
SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_calendar_feed_token
    ON public.profiles (calendar_feed_token);

COMMENT ON COLUMN public.profiles.calendar_feed_token IS
    'Private token used for subscribed ICS calendar feeds.';
