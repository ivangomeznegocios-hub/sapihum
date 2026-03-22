-- Create is_test column on profiles to exclude from analytics
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_test IS 'Flag to mark profile as a test account, excluding it from analytics';

-- Create an index to quickly filter out test users in queries
CREATE INDEX IF NOT EXISTS idx_profiles_istest ON public.profiles(is_test);
