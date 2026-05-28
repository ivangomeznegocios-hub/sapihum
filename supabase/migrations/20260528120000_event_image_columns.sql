ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS image_public_id TEXT,
    ADD COLUMN IF NOT EXISTS image_alt_text TEXT,
    ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.events.image_public_id IS 'Cloudinary public_id for the current event image.';
COMMENT ON COLUMN public.events.image_alt_text IS 'Accessible alt text for the current event image.';
COMMENT ON COLUMN public.events.image_updated_at IS 'Timestamp when the current event image metadata was last updated.';
