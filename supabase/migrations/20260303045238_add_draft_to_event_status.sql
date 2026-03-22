-- Add 'draft' to event_status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'event_status' AND e.enumlabel = 'draft'
  ) THEN
    ALTER TYPE event_status ADD VALUE 'draft' BEFORE 'upcoming';
  END IF;
END $$;
