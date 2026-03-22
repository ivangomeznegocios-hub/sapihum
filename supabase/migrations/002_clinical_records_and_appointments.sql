-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 002_clinical_records_and_appointments
-- ============================================

-- ============================================
-- 1. CREATE ENUMS FOR RECORD AND APPOINTMENT TYPES
-- ============================================
CREATE TYPE record_type AS ENUM ('nota', 'historia_clinica');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ============================================
-- 2. CREATE CLINICAL_RECORDS TABLE (Expediente Clínico)
-- ============================================
CREATE TABLE public.clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    type record_type NOT NULL DEFAULT 'nota',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.clinical_records IS 'Clinical records and SOAP notes. Content is JSONB with structure: {subjective, objective, assessment, plan}';
COMMENT ON COLUMN public.clinical_records.content IS 'SOAP notes structure: {subjective: string, objective: string, assessment: string, plan: string}';

-- Enable RLS
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE APPOINTMENTS TABLE (Citas)
-- ============================================
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    meeting_link TEXT,
    price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Validate end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Add comment for documentation
COMMENT ON TABLE public.appointments IS 'Appointment scheduling with Jitsi video call support';
COMMENT ON COLUMN public.appointments.meeting_link IS 'Jitsi meeting URL for video consultations';

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR CLINICAL_RECORDS (STRICT)
-- Only the assigned psychologist can read/write
-- ============================================

-- Policy: Psychologists can view their own clinical records
CREATE POLICY "Psychologists can view own clinical records"
ON public.clinical_records FOR SELECT
USING (psychologist_id = auth.uid());

-- Policy: Psychologists can create clinical records for their patients
CREATE POLICY "Psychologists can create clinical records"
ON public.clinical_records FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
    AND EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = clinical_records.patient_id
        AND ppr.status = 'active'
    )
);

-- Policy: Psychologists can update their own clinical records
CREATE POLICY "Psychologists can update own clinical records"
ON public.clinical_records FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

-- Policy: Psychologists can delete their own clinical records
CREATE POLICY "Psychologists can delete own clinical records"
ON public.clinical_records FOR DELETE
USING (psychologist_id = auth.uid());

-- Policy: Admins can view all clinical records
CREATE POLICY "Admins can view all clinical records"
ON public.clinical_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 5. RLS POLICIES FOR APPOINTMENTS
-- ============================================

-- Policy: Psychologists can view their appointments
CREATE POLICY "Psychologists can view own appointments"
ON public.appointments FOR SELECT
USING (psychologist_id = auth.uid());

-- Policy: Patients can view their appointments
CREATE POLICY "Patients can view own appointments"
ON public.appointments FOR SELECT
USING (patient_id = auth.uid());

-- Policy: Psychologists can create appointments
CREATE POLICY "Psychologists can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

-- Policy: Psychologists can update their appointments
CREATE POLICY "Psychologists can update own appointments"
ON public.appointments FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

-- Policy: Psychologists can delete their appointments
CREATE POLICY "Psychologists can delete own appointments"
ON public.appointments FOR DELETE
USING (psychologist_id = auth.uid());

-- Policy: Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can manage all appointments
CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 6. TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_clinical_records_updated_at
    BEFORE UPDATE ON public.clinical_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_clinical_records_patient ON public.clinical_records(patient_id);
CREATE INDEX idx_clinical_records_psychologist ON public.clinical_records(psychologist_id);
CREATE INDEX idx_clinical_records_type ON public.clinical_records(type);
CREATE INDEX idx_clinical_records_created ON public.clinical_records(created_at DESC);

CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_psychologist ON public.appointments(psychologist_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_psychologist_time ON public.appointments(psychologist_id, start_time);
