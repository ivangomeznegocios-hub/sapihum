-- ============================================================================================================
-- COMUNIDAD DE PSICOLOGÍA - COMPLETE DATABASE SCHEMA
-- ============================================================================================================
-- Este archivo contiene TODO el SQL necesario para configurar la base de datos en Supabase desde cero.
-- Incluye: Tipos (ENUMS), Tablas, Políticas RLS, Funciones, Triggers e Índices
-- 
-- INSTRUCCIONES DE USO:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar y pegar todo el contenido de este archivo
-- 3. Ejecutar el script
-- ============================================================================================================


-- ============================================================================================================
-- PARTE 1: TIPOS DE DATOS (ENUMS)
-- ============================================================================================================

-- Rol de usuario en la plataforma
CREATE TYPE user_role AS ENUM ('admin', 'psychologist', 'patient');

-- Estado de suscripción del usuario
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'inactive');

-- Tipo de registro clínico
CREATE TYPE record_type AS ENUM ('nota', 'historia_clinica');

-- Estado de una cita
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Tipo de recurso educativo
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'link', 'document');

-- Visibilidad de recursos
CREATE TYPE visibility_type AS ENUM ('public', 'private', 'members_only');

-- Estado de un evento
CREATE TYPE event_status AS ENUM ('upcoming', 'live', 'completed', 'cancelled');


-- ============================================================================================================
-- PARTE 2: FUNCIONES AUXILIARES (se crean primero porque las tablas las referencian en triggers)
-- ============================================================================================================

-- Función para auto-actualizar el campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Función para auto-crear perfil cuando un usuario se registra
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


-- ============================================================================================================
-- PARTE 3: TABLAS
-- ============================================================================================================

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: profiles (Extiende auth.users con datos adicionales)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'patient',
    full_name TEXT,
    avatar_url TEXT,
    subscription_status subscription_status DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendiendo auth.users con control de acceso basado en roles';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: patient_psychologist_relationships (Relación paciente-psicólogo)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.patient_psychologist_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Asegurar relación única
    UNIQUE(patient_id, psychologist_id)
);

COMMENT ON TABLE public.patient_psychologist_relationships IS 'Registra qué pacientes están asignados a qué psicólogos';

ALTER TABLE public.patient_psychologist_relationships ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: clinical_records (Expediente Clínico / Notas SOAP)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    type record_type NOT NULL DEFAULT 'nota',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.clinical_records IS 'Notas clínicas y SOAP. El campo content tiene estructura: {subjective, objective, assessment, plan}';
COMMENT ON COLUMN public.clinical_records.content IS 'Estructura de notas SOAP: {subjective: string, objective: string, assessment: string, plan: string}';

ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: appointments (Citas)
-- ------------------------------------------------------------------------------------------------------------
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
    -- Validar que end_time sea después de start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.appointments IS 'Programación de citas con soporte para videollamadas Jitsi';
COMMENT ON COLUMN public.appointments.meeting_link IS 'URL de reunión Jitsi para consultas por video';

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: resources (Recursos Educativos)
-- ------------------------------------------------------------------------------------------------------------
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

COMMENT ON TABLE public.resources IS 'Recursos educativos: PDFs, videos, documentos para pacientes';

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: patient_resources (Asignaciones de recursos a pacientes)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.patient_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    -- Prevenir asignaciones duplicadas
    UNIQUE(resource_id, patient_id)
);

COMMENT ON TABLE public.patient_resources IS 'Registra recursos asignados a pacientes específicos por psicólogos';

ALTER TABLE public.patient_resources ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: events (Eventos/Talleres)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status event_status NOT NULL DEFAULT 'upcoming',
    location TEXT, -- Puede ser 'online' o dirección física
    meeting_link TEXT, -- Para eventos en vivo
    recording_url TEXT, -- Para eventos completados
    max_attendees INTEGER,
    price DECIMAL(10, 2) DEFAULT 0, -- Eventos gratuitos = 0
    is_members_only BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'Talleres, workshops y eventos de la comunidad';

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------------------------------------
-- TABLA: event_registrations (Inscripciones a eventos)
-- ------------------------------------------------------------------------------------------------------------
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    attended_at TIMESTAMPTZ,
    -- Prevenir inscripciones duplicadas
    UNIQUE(event_id, user_id)
);

COMMENT ON TABLE public.event_registrations IS 'Inscripciones de usuarios a eventos';

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;


-- ============================================================================================================
-- PARTE 4: POLÍTICAS RLS (Row Level Security)
-- ============================================================================================================

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: profiles
-- ------------------------------------------------------------------------------------------------------------

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los administradores pueden actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los psicólogos pueden ver los perfiles de sus pacientes asignados
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

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: patient_psychologist_relationships
-- ------------------------------------------------------------------------------------------------------------

-- Los psicólogos pueden ver sus propias relaciones
CREATE POLICY "Psychologists can view own relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (psychologist_id = auth.uid());

-- Los pacientes pueden ver sus propias relaciones
CREATE POLICY "Patients can view own relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (patient_id = auth.uid());

-- Los administradores pueden ver todas las relaciones
CREATE POLICY "Admins can view all relationships"
ON public.patient_psychologist_relationships FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los administradores pueden gestionar todas las relaciones
CREATE POLICY "Admins can manage all relationships"
ON public.patient_psychologist_relationships FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los psicólogos pueden crear relaciones (invitar pacientes)
CREATE POLICY "Psychologists can create relationships"
ON public.patient_psychologist_relationships FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

-- Los psicólogos pueden actualizar sus propias relaciones
CREATE POLICY "Psychologists can update own relationships"
ON public.patient_psychologist_relationships FOR UPDATE
USING (psychologist_id = auth.uid());

-- Los psicólogos pueden eliminar sus propias relaciones
CREATE POLICY "Psychologists can delete own relationships"
ON public.patient_psychologist_relationships FOR DELETE
USING (psychologist_id = auth.uid());

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: clinical_records (ESTRICTAS - Solo el psicólogo asignado puede leer/escribir)
-- ------------------------------------------------------------------------------------------------------------

-- Los psicólogos pueden ver sus propios registros clínicos
CREATE POLICY "Psychologists can view own clinical records"
ON public.clinical_records FOR SELECT
USING (psychologist_id = auth.uid());

-- Los psicólogos pueden crear registros clínicos para sus pacientes
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

-- Los psicólogos pueden actualizar sus propios registros clínicos
CREATE POLICY "Psychologists can update own clinical records"
ON public.clinical_records FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

-- Los psicólogos pueden eliminar sus propios registros clínicos
CREATE POLICY "Psychologists can delete own clinical records"
ON public.clinical_records FOR DELETE
USING (psychologist_id = auth.uid());

-- Los administradores pueden ver todos los registros clínicos
CREATE POLICY "Admins can view all clinical records"
ON public.clinical_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: appointments
-- ------------------------------------------------------------------------------------------------------------

-- Los psicólogos pueden ver sus citas
CREATE POLICY "Psychologists can view own appointments"
ON public.appointments FOR SELECT
USING (psychologist_id = auth.uid());

-- Los pacientes pueden ver sus citas
CREATE POLICY "Patients can view own appointments"
ON public.appointments FOR SELECT
USING (patient_id = auth.uid());

-- Los psicólogos pueden crear citas
CREATE POLICY "Psychologists can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'psychologist'
    )
);

-- Los psicólogos pueden actualizar sus citas
CREATE POLICY "Psychologists can update own appointments"
ON public.appointments FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

-- Los psicólogos pueden eliminar sus citas
CREATE POLICY "Psychologists can delete own appointments"
ON public.appointments FOR DELETE
USING (psychologist_id = auth.uid());

-- Los administradores pueden ver todas las citas
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los administradores pueden gestionar todas las citas
CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: resources
-- ------------------------------------------------------------------------------------------------------------

-- Los recursos públicos son visibles para todos
CREATE POLICY "Public resources visible to all"
ON public.resources FOR SELECT
USING (visibility = 'public');

-- Los miembros pueden ver recursos solo para miembros
CREATE POLICY "Members can see members_only resources"
ON public.resources FOR SELECT
USING (
    visibility = 'members_only'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND subscription_status IN ('trial', 'active')
    )
);

-- Los usuarios pueden ver sus recursos privados asignados
CREATE POLICY "Users see assigned private resources"
ON public.resources FOR SELECT
USING (
    visibility = 'private'
    AND EXISTS (
        SELECT 1 FROM public.patient_resources pr
        WHERE pr.resource_id = resources.id
        AND pr.patient_id = auth.uid()
    )
);

-- Los creadores pueden ver sus propios recursos
CREATE POLICY "Creators can see own resources"
ON public.resources FOR SELECT
USING (created_by = auth.uid());

-- Los psicólogos pueden crear recursos
CREATE POLICY "Psychologists can create resources"
ON public.resources FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('psychologist', 'admin')
    )
);

-- Los creadores pueden actualizar sus recursos
CREATE POLICY "Creators can update own resources"
ON public.resources FOR UPDATE
USING (created_by = auth.uid());

-- Los creadores pueden eliminar sus recursos
CREATE POLICY "Creators can delete own resources"
ON public.resources FOR DELETE
USING (created_by = auth.uid());

-- Los administradores tienen acceso completo a recursos
CREATE POLICY "Admins full access to resources"
ON public.resources FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: patient_resources
-- ------------------------------------------------------------------------------------------------------------

-- Los pacientes pueden ver sus asignaciones
CREATE POLICY "Patients see own resource assignments"
ON public.patient_resources FOR SELECT
USING (patient_id = auth.uid());

-- Los psicólogos pueden ver las asignaciones que hicieron
CREATE POLICY "Psychologists see own assignments"
ON public.patient_resources FOR SELECT
USING (assigned_by = auth.uid());

-- Los psicólogos pueden asignar recursos a sus pacientes
CREATE POLICY "Psychologists can assign resources"
ON public.patient_resources FOR INSERT
WITH CHECK (
    assigned_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = patient_resources.patient_id
        AND ppr.status = 'active'
    )
);

-- Los psicólogos pueden eliminar sus asignaciones
CREATE POLICY "Psychologists can remove assignments"
ON public.patient_resources FOR DELETE
USING (assigned_by = auth.uid());

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: events
-- ------------------------------------------------------------------------------------------------------------

-- Cualquiera puede ver eventos públicos
CREATE POLICY "Anyone can see public events"
ON public.events FOR SELECT
USING (NOT is_members_only OR is_members_only = false);

-- Los miembros pueden ver eventos solo para miembros
CREATE POLICY "Members can see members_only events"
ON public.events FOR SELECT
USING (
    is_members_only = true
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND subscription_status IN ('trial', 'active')
    )
);

-- Los administradores y psicólogos pueden gestionar eventos
CREATE POLICY "Staff can manage events"
ON public.events FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('psychologist', 'admin')
    )
);

-- ------------------------------------------------------------------------------------------------------------
-- POLÍTICAS PARA: event_registrations
-- ------------------------------------------------------------------------------------------------------------

-- Los usuarios pueden ver sus propias inscripciones
CREATE POLICY "Users see own registrations"
ON public.event_registrations FOR SELECT
USING (user_id = auth.uid());

-- Los creadores de eventos y admins pueden ver inscripciones de sus eventos
CREATE POLICY "Staff see event registrations"
ON public.event_registrations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.profiles p ON p.id = auth.uid()
        WHERE e.id = event_registrations.event_id
        AND (e.created_by = auth.uid() OR p.role = 'admin')
    )
);

-- Los usuarios pueden inscribirse a eventos
CREATE POLICY "Users can register for events"
ON public.event_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden cancelar su inscripción
CREATE POLICY "Users can cancel registration"
ON public.event_registrations FOR UPDATE
USING (user_id = auth.uid());

-- Los usuarios pueden eliminar su inscripción
CREATE POLICY "Users can delete registration"
ON public.event_registrations FOR DELETE
USING (user_id = auth.uid());


-- ============================================================================================================
-- PARTE 5: TRIGGERS
-- ============================================================================================================

-- Trigger: Auto-crear perfil cuando un usuario se registra
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers: Auto-actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
    BEFORE UPDATE ON public.patient_psychologist_relationships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_records_updated_at
    BEFORE UPDATE ON public.clinical_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================================================
-- PARTE 6: ÍNDICES PARA RENDIMIENTO
-- ============================================================================================================

-- Índices para profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_status);

-- Índices para patient_psychologist_relationships
CREATE INDEX idx_relationships_psychologist ON public.patient_psychologist_relationships(psychologist_id);
CREATE INDEX idx_relationships_patient ON public.patient_psychologist_relationships(patient_id);
CREATE INDEX idx_relationships_status ON public.patient_psychologist_relationships(status);

-- Índices para clinical_records
CREATE INDEX idx_clinical_records_patient ON public.clinical_records(patient_id);
CREATE INDEX idx_clinical_records_psychologist ON public.clinical_records(psychologist_id);
CREATE INDEX idx_clinical_records_type ON public.clinical_records(type);
CREATE INDEX idx_clinical_records_created ON public.clinical_records(created_at DESC);

-- Índices para appointments
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_psychologist ON public.appointments(psychologist_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_psychologist_time ON public.appointments(psychologist_id, start_time);

-- Índices para resources
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_visibility ON public.resources(visibility);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);

-- Índices para patient_resources
CREATE INDEX idx_patient_resources_patient ON public.patient_resources(patient_id);
CREATE INDEX idx_patient_resources_resource ON public.patient_resources(resource_id);

-- Índices para events
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_members_only ON public.events(is_members_only);

-- Índices para event_registrations
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);


-- ============================================================================================================
-- FIN DEL SCRIPT
-- ============================================================================================================
-- ¡Tu base de datos está lista! 
-- 
-- PRÓXIMOS PASOS:
-- 1. Verifica que todas las tablas se crearon correctamente en Supabase > Table Editor
-- 2. Puedes crear usuarios de prueba y asignarles roles modificando el campo 'role' en profiles
-- 3. Para dar permisos de admin: UPDATE public.profiles SET role = 'admin' WHERE id = 'USER_UUID';
-- ============================================================================================================
