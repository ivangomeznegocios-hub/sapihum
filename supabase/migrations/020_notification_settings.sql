-- Add notification preference fields to profiles
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS session_reminders BOOLEAN DEFAULT true;

-- Ensure RLS policies still allow updates (they usually apply to the whole row, so typically no change needed)
