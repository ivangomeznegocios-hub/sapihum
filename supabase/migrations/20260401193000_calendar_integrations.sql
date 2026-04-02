CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'error', 'disconnected')),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    selected_calendar_ids TEXT[] NOT NULL DEFAULT ARRAY['primary']::TEXT[],
    provider_account_email TEXT,
    provider_account_label TEXT,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

COMMENT ON TABLE public.calendar_integrations IS 'OAuth connections for external calendar providers used to detect busy slots outside the platform.';

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id
    ON public.calendar_integrations(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider
    ON public.calendar_integrations(provider);

ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar integrations"
ON public.calendar_integrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar integrations"
ON public.calendar_integrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar integrations"
ON public.calendar_integrations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar integrations"
ON public.calendar_integrations FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_calendar_integrations_updated_at
    BEFORE UPDATE ON public.calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
