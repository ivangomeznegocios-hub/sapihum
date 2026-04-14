-- ============================================================================
-- Internal notification center for the dashboard bell
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'system'
        CHECK (category IN ('system', 'messages', 'calendar', 'events', 'payments')),
    level TEXT NOT NULL DEFAULT 'info'
        CHECK (level IN ('info', 'success', 'warning', 'error')),
    kind TEXT NOT NULL DEFAULT 'generic',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    dedupe_key TEXT UNIQUE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT user_notifications_action_url_check CHECK (
        action_url IS NULL OR action_url LIKE '/%'
    )
);

COMMENT ON TABLE public.user_notifications IS 'Internal notification inbox for authenticated dashboard users';
COMMENT ON COLUMN public.user_notifications.dedupe_key IS 'Optional idempotency key to avoid duplicate notifications from retried background jobs';

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
    ON public.user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
    ON public.user_notifications(user_id, is_read, created_at DESC);

DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
CREATE POLICY "Users can read own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_user_notification_state()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_read = true AND COALESCE(OLD.is_read, false) = false THEN
        NEW.read_at = COALESCE(NEW.read_at, timezone('utc', now()));
    ELSIF NEW.is_read = false THEN
        NEW.read_at = NULL;
    END IF;

    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_notification_state ON public.user_notifications;
CREATE TRIGGER trg_sync_user_notification_state
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_notification_state();

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
