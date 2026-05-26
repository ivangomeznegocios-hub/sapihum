-- Flexible event programs: reusable parent/child event bundles.

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS program_mode TEXT NOT NULL DEFAULT 'individual',
    ADD COLUMN IF NOT EXISTS program_name TEXT,
    ADD COLUMN IF NOT EXISTS program_type_label TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'events_program_mode_check'
          AND conrelid = 'public.events'::regclass
    ) THEN
        ALTER TABLE public.events
            ADD CONSTRAINT events_program_mode_check
            CHECK (program_mode IN ('individual', 'program'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.event_program_items (
    parent_event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    child_event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (parent_event_id, child_event_id),
    CONSTRAINT event_program_items_no_self_link CHECK (parent_event_id <> child_event_id)
);

COMMENT ON COLUMN public.events.program_mode IS 'individual for regular events, program for reusable parent programming pages.';
COMMENT ON COLUMN public.events.program_name IS 'Free-form public/internal name for the programming parent.';
COMMENT ON COLUMN public.events.program_type_label IS 'Optional free-form visible type label, e.g. Foro, Congreso, Ciclo mensual.';
COMMENT ON TABLE public.event_program_items IS 'Explicit parent-child links for flexible event programming bundles.';

CREATE INDEX IF NOT EXISTS idx_events_program_mode ON public.events(program_mode);
CREATE INDEX IF NOT EXISTS idx_event_program_items_child ON public.event_program_items(child_event_id);
CREATE INDEX IF NOT EXISTS idx_event_program_items_order ON public.event_program_items(parent_event_id, display_order);

ALTER TABLE public.event_program_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_program_items TO authenticated;

DROP POLICY IF EXISTS "Admins and event managers manage event programs" ON public.event_program_items;
CREATE POLICY "Admins and event managers manage event programs"
ON public.event_program_items
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'event_manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'event_manager')
    )
);

DROP POLICY IF EXISTS "Users can view visible event program links" ON public.event_program_items;
CREATE POLICY "Users can view visible event program links"
ON public.event_program_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.events parent
        WHERE parent.id = event_program_items.parent_event_id
          AND parent.status NOT IN ('draft', 'cancelled')
    )
    OR EXISTS (
        SELECT 1
        FROM public.events child
        WHERE child.id = event_program_items.child_event_id
          AND child.status NOT IN ('draft', 'cancelled')
    )
);
