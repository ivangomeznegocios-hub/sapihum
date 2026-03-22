-- ============================================================================================================
-- COMUNIDAD DE PSICOLOGÍA - RESET & COMPLETE SCHEMA
-- ============================================================================================================
-- Este archivo ELIMINA todo primero y luego recrea la base de datos completa.
-- 
-- ⚠️ ADVERTENCIA: Este script BORRARÁ todos los datos existentes. Úsalo solo si:
--    - Quieres empezar desde cero
--    - Es un ambiente de desarrollo/pruebas
-- ============================================================================================================


-- ============================================================================================================
-- PARTE 0: LIMPIAR TODO (DROP)
-- ============================================================================================================

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_relationships_updated_at ON public.patient_psychologist_relationships;
DROP TRIGGER IF EXISTS update_clinical_records_updated_at ON public.clinical_records;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;

-- Eliminar tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.patient_resources CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.clinical_records CASCADE;
DROP TABLE IF EXISTS public.patient_psychologist_relationships CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Eliminar tipos (enums)
DROP TYPE IF EXISTS event_status;
DROP TYPE IF EXISTS visibility_type;
DROP TYPE IF EXISTS resource_type;
DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS record_type;
DROP TYPE IF EXISTS subscription_status;
DROP TYPE IF EXISTS user_role;


-- ============================================================================================================
-- PARTE 1: TIPOS DE DATOS (ENUMS)
-- ============================================================================================================

CREATE TYPE user_role AS ENUM ('admin', 'psychologist', 'patient');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'inactive');
CREATE TYPE record_type AS ENUM ('nota', 'historia_clinica');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'link', 'document');
CREATE TYPE visibility_type AS ENUM ('public', 'private', 'members_only');
CREATE TYPE event_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');


-- ============================================================================================================
-- PARTE 2: FUNCIONES AUXILIARES
-- ============================================================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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


-- ============================================================================================================
-- PARTE 3: TABLAS
-- ============================================================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT,
    avatar_url TEXT,
    subscription_status subscription_status DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patient_psychologist_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, psychologist_id)
);
ALTER TABLE public.patient_psychologist_relationships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    type record_type NOT NULL DEFAULT 'nota',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

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
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type resource_type NOT NULL DEFAULT 'link',
    visibility visibility_type NOT NULL DEFAULT 'private',
    thumbnail_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patient_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    UNIQUE(resource_id, patient_id)
);
ALTER TABLE public.patient_resources ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status event_status NOT NULL DEFAULT 'upcoming',
    location TEXT,
    meeting_link TEXT,
    recording_url TEXT,
    max_attendees INTEGER,
    price DECIMAL(10, 2) DEFAULT 0,
    is_members_only BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;


-- ============================================================================================================
-- PARTE 4: POLÍTICAS RLS
-- ============================================================================================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Psychologists can view assigned patients" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.patient_psychologist_relationships ppr WHERE ppr.psychologist_id = auth.uid() AND ppr.patient_id = profiles.id AND ppr.status = 'active'));

-- RELATIONSHIPS
CREATE POLICY "Psychologists can view own relationships" ON public.patient_psychologist_relationships FOR SELECT USING (psychologist_id = auth.uid());
CREATE POLICY "Patients can view own relationships" ON public.patient_psychologist_relationships FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Admins can view all relationships" ON public.patient_psychologist_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage all relationships" ON public.patient_psychologist_relationships FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Psychologists can create relationships" ON public.patient_psychologist_relationships FOR INSERT WITH CHECK (psychologist_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'psychologist'));
CREATE POLICY "Psychologists can update own relationships" ON public.patient_psychologist_relationships FOR UPDATE USING (psychologist_id = auth.uid());
CREATE POLICY "Psychologists can delete own relationships" ON public.patient_psychologist_relationships FOR DELETE USING (psychologist_id = auth.uid());

-- CLINICAL RECORDS
CREATE POLICY "Psychologists can view own clinical records" ON public.clinical_records FOR SELECT USING (psychologist_id = auth.uid());
CREATE POLICY "Psychologists can create clinical records" ON public.clinical_records FOR INSERT WITH CHECK (psychologist_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'psychologist') AND EXISTS (SELECT 1 FROM public.patient_psychologist_relationships ppr WHERE ppr.psychologist_id = auth.uid() AND ppr.patient_id = clinical_records.patient_id AND ppr.status = 'active'));
CREATE POLICY "Psychologists can update own clinical records" ON public.clinical_records FOR UPDATE USING (psychologist_id = auth.uid()) WITH CHECK (psychologist_id = auth.uid());
CREATE POLICY "Psychologists can delete own clinical records" ON public.clinical_records FOR DELETE USING (psychologist_id = auth.uid());
CREATE POLICY "Admins can view all clinical records" ON public.clinical_records FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- APPOINTMENTS
CREATE POLICY "Psychologists can view own appointments" ON public.appointments FOR SELECT USING (psychologist_id = auth.uid());
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Psychologists can create appointments" ON public.appointments FOR INSERT WITH CHECK (psychologist_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'psychologist'));
CREATE POLICY "Psychologists can update own appointments" ON public.appointments FOR UPDATE USING (psychologist_id = auth.uid()) WITH CHECK (psychologist_id = auth.uid());
CREATE POLICY "Psychologists can delete own appointments" ON public.appointments FOR DELETE USING (psychologist_id = auth.uid());
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RESOURCES
CREATE POLICY "Public resources visible to all" ON public.resources FOR SELECT USING (visibility = 'public');
CREATE POLICY "Members can see members_only resources" ON public.resources FOR SELECT USING (visibility = 'members_only' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND subscription_status IN ('trial', 'active')));
CREATE POLICY "Users see assigned private resources" ON public.resources FOR SELECT USING (visibility = 'private' AND EXISTS (SELECT 1 FROM public.patient_resources pr WHERE pr.resource_id = resources.id AND pr.patient_id = auth.uid()));
CREATE POLICY "Creators can see own resources" ON public.resources FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Psychologists can create resources" ON public.resources FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('psychologist', 'admin')));
CREATE POLICY "Creators can update own resources" ON public.resources FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creators can delete own resources" ON public.resources FOR DELETE USING (created_by = auth.uid());
CREATE POLICY "Admins full access to resources" ON public.resources FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PATIENT RESOURCES
CREATE POLICY "Patients see own resource assignments" ON public.patient_resources FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Psychologists see own assignments" ON public.patient_resources FOR SELECT USING (assigned_by = auth.uid());
CREATE POLICY "Psychologists can assign resources" ON public.patient_resources FOR INSERT WITH CHECK (assigned_by = auth.uid() AND EXISTS (SELECT 1 FROM public.patient_psychologist_relationships ppr WHERE ppr.psychologist_id = auth.uid() AND ppr.patient_id = patient_resources.patient_id AND ppr.status = 'active'));
CREATE POLICY "Psychologists can remove assignments" ON public.patient_resources FOR DELETE USING (assigned_by = auth.uid());

-- EVENTS
CREATE POLICY "Anyone can see public events" ON public.events FOR SELECT USING (NOT is_members_only OR is_members_only = false);
CREATE POLICY "Members can see members_only events" ON public.events FOR SELECT USING (is_members_only = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND subscription_status IN ('trial', 'active')));
CREATE POLICY "Staff can manage events" ON public.events FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('psychologist', 'admin')));

-- EVENT REGISTRATIONS
CREATE POLICY "Users see own registrations" ON public.event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff see event registrations" ON public.event_registrations FOR SELECT USING (EXISTS (SELECT 1 FROM public.events e JOIN public.profiles p ON p.id = auth.uid() WHERE e.id = event_registrations.event_id AND (e.created_by = auth.uid() OR p.role = 'admin')));
CREATE POLICY "Users can register for events" ON public.event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can cancel registration" ON public.event_registrations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete registration" ON public.event_registrations FOR DELETE USING (user_id = auth.uid());


-- ============================================================================================================
-- PARTE 5: TRIGGERS
-- ============================================================================================================

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON public.patient_psychologist_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinical_records_updated_at BEFORE UPDATE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================================================
-- PARTE 6: ÍNDICES
-- ============================================================================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_status);
CREATE INDEX idx_relationships_psychologist ON public.patient_psychologist_relationships(psychologist_id);
CREATE INDEX idx_relationships_patient ON public.patient_psychologist_relationships(patient_id);
CREATE INDEX idx_relationships_status ON public.patient_psychologist_relationships(status);
CREATE INDEX idx_clinical_records_patient ON public.clinical_records(patient_id);
CREATE INDEX idx_clinical_records_psychologist ON public.clinical_records(psychologist_id);
CREATE INDEX idx_clinical_records_type ON public.clinical_records(type);
CREATE INDEX idx_clinical_records_created ON public.clinical_records(created_at DESC);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_psychologist ON public.appointments(psychologist_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_psychologist_time ON public.appointments(psychologist_id, start_time);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_visibility ON public.resources(visibility);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);
CREATE INDEX idx_patient_resources_patient ON public.patient_resources(patient_id);
CREATE INDEX idx_patient_resources_resource ON public.patient_resources(resource_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_members_only ON public.events(is_members_only);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);

-- ============================================================================================================
-- ✅ ESQUEMA COMPLETO CREADO EXITOSAMENTE
-- ============================================================================================================
