-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 001_profiles_and_relationships
-- ============================================

-- ============================================
-- 1. CREATE ENUM FOR USER ROLES
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'psychologist', 'patient');

-- ============================================
-- 2. CREATE ENUM FOR SUBSCRIPTION STATUS
-- ============================================
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'inactive');

-- ============================================
-- 3. CREATE PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT,
    avatar_url TEXT,
    subscription_status subscription_status DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with role-based access control';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE PATIENT-PSYCHOLOGIST RELATIONSHIPS TABLE
-- ============================================
CREATE TABLE public.patient_psychologist_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique relationship
    UNIQUE(patient_id, psychologist_id)
);

-- Add comment for documentation
COMMENT ON TABLE public.patient_psychologist_relationships IS 'Tracks which patients are assigned to which psychologists';

-- Enable RLS
ALTER TABLE public.patient_psychologist_relationships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR PROFILES
-- ============================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Psychologists can view their assigned patients' profiles
CREATE POLICY "Psychologists can view assigned patients"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = profiles.id
        AND ppr.status = 'active'
    )
);

-- ============================================
-- 6. RLS POLICIES FOR RELATIONSHIPS
-- ============================================

-- Policy: Psychologists can view their own relationships
CREATE POLICY "Psychologists can view own relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (psychologist_id = auth.uid());

-- Policy: Patients can view their own relationships
CREATE POLICY "Patients can view own relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (patient_id = auth.uid());

-- Policy: Admins can view all relationships
CREATE POLICY "Admins can view all relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can manage all relationships
CREATE POLICY "Admins can manage all relationships"
ON public.patient_psychologist_relationships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Psychologists can create relationships (invite patients)
CREATE POLICY "Psychologists can create relationships"
ON public.patient_psychologist_relationships FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

-- Policy: Psychologists can update their own relationships
CREATE POLICY "Psychologists can update own relationships"
ON public.patient_psychologist_relationships FOR UPDATE
USING (psychologist_id = auth.uid());

-- Policy: Psychologists can delete their own relationships
CREATE POLICY "Psychologists can delete own relationships"
ON public.patient_psychologist_relationships FOR DELETE
USING (psychologist_id = auth.uid());

-- ============================================
-- 7. FUNCTION: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
    BEFORE UPDATE ON public.patient_psychologist_relationships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_status);
CREATE INDEX idx_relationships_psychologist ON public.patient_psychologist_relationships(psychologist_id);
CREATE INDEX idx_relationships_patient ON public.patient_psychologist_relationships(patient_id);
CREATE INDEX idx_relationships_status ON public.patient_psychologist_relationships(status);
