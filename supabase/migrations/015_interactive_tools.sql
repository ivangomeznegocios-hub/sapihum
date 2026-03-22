-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 015_interactive_tools
-- Hub de Recursos Interactivo — Motor de Herramientas Terapéuticas
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================
DO $$ BEGIN
    CREATE TYPE tool_category AS ENUM ('test', 'questionnaire', 'task', 'exercise', 'scale');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. THERAPEUTIC_TOOLS TABLE (Catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS public.therapeutic_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category tool_category NOT NULL DEFAULT 'test',
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    estimated_minutes INTEGER DEFAULT 10,
    is_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.therapeutic_tools IS 'Catalog of interactive therapeutic tools: tests, questionnaires, exercises, scales';

ALTER TABLE public.therapeutic_tools ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. TOOL_ASSIGNMENTS TABLE (Asignaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tool_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES public.therapeutic_tools(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    psychologist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status assignment_status NOT NULL DEFAULT 'pending',
    instructions TEXT,
    due_date TIMESTAMPTZ,
    results_visible BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tool_assignments IS 'Tracks tool assignments from psychologists to patients with privacy controls';

ALTER TABLE public.tool_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. TOOL_RESPONSES TABLE (Respuestas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tool_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.tool_assignments(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    scores JSONB DEFAULT '{}'::jsonb,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tool_responses IS 'Patient responses and calculated scores for assigned tools';

ALTER TABLE public.tool_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES — THERAPEUTIC_TOOLS
-- ============================================

-- Everyone can see template tools (system-wide)
CREATE POLICY "Anyone can see template tools"
ON public.therapeutic_tools FOR SELECT
USING (is_template = true);

-- Psychologists can see tools they created
CREATE POLICY "Psychologists see own tools"
ON public.therapeutic_tools FOR SELECT
USING (created_by = auth.uid());

-- Psychologists can create tools
CREATE POLICY "Psychologists can create tools"
ON public.therapeutic_tools FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('psychologist', 'admin')
    )
);

-- Creators can update their tools
CREATE POLICY "Creators can update own tools"
ON public.therapeutic_tools FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Creators can delete their tools (not templates)
CREATE POLICY "Creators can delete own tools"
ON public.therapeutic_tools FOR DELETE
USING (created_by = auth.uid() AND is_template = false);

-- Admins have full access
CREATE POLICY "Admins full access to tools"
ON public.therapeutic_tools FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 6. RLS POLICIES — TOOL_ASSIGNMENTS
-- ============================================

-- Psychologists see assignments they made
CREATE POLICY "Psychologists see own assignments"
ON public.tool_assignments FOR SELECT
USING (psychologist_id = auth.uid());

-- Patients see their own assignments
CREATE POLICY "Patients see own assignments"
ON public.tool_assignments FOR SELECT
USING (patient_id = auth.uid());

-- Psychologists can assign tools to their active patients
CREATE POLICY "Psychologists can assign tools"
ON public.tool_assignments FOR INSERT
WITH CHECK (
    psychologist_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.patient_psychologist_relationships ppr
        WHERE ppr.psychologist_id = auth.uid()
        AND ppr.patient_id = tool_assignments.patient_id
        AND ppr.status = 'active'
    )
);

-- Psychologists can update assignments (toggle visibility, etc.)
CREATE POLICY "Psychologists can update own assignments"
ON public.tool_assignments FOR UPDATE
USING (psychologist_id = auth.uid())
WITH CHECK (psychologist_id = auth.uid());

-- Patients can update their assignment status (in_progress, etc.)
CREATE POLICY "Patients can update own assignment status"
ON public.tool_assignments FOR UPDATE
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

-- Psychologists can delete their assignments
CREATE POLICY "Psychologists can delete own assignments"
ON public.tool_assignments FOR DELETE
USING (psychologist_id = auth.uid());

-- Admins full access
CREATE POLICY "Admins full access to assignments"
ON public.tool_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 7. RLS POLICIES — TOOL_RESPONSES
-- ============================================

-- Psychologists see responses for their patients
CREATE POLICY "Psychologists see patient responses"
ON public.tool_responses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tool_assignments ta
        WHERE ta.id = tool_responses.assignment_id
        AND ta.psychologist_id = auth.uid()
    )
);

-- Patients see own responses (only if results_visible = true OR own in-progress)
CREATE POLICY "Patients see own responses"
ON public.tool_responses FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.tool_assignments ta
        WHERE ta.id = tool_responses.assignment_id
        AND ta.patient_id = auth.uid()
        AND (ta.results_visible = true OR ta.status != 'completed')
    )
);

-- Patients can create responses (for their assignments)
CREATE POLICY "Patients can create responses"
ON public.tool_responses FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tool_assignments ta
        WHERE ta.id = tool_responses.assignment_id
        AND ta.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
);

-- Patients can update their own responses (save progress)
CREATE POLICY "Patients can update own responses"
ON public.tool_responses FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.tool_assignments ta
        WHERE ta.id = tool_responses.assignment_id
        AND ta.patient_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tool_assignments ta
        WHERE ta.id = tool_responses.assignment_id
        AND ta.patient_id = auth.uid()
    )
);

-- Admins full access
CREATE POLICY "Admins full access to responses"
ON public.tool_responses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 8. TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_therapeutic_tools_updated_at
    BEFORE UPDATE ON public.therapeutic_tools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tool_assignments_updated_at
    BEFORE UPDATE ON public.tool_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tool_responses_updated_at
    BEFORE UPDATE ON public.tool_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.therapeutic_tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_is_template ON public.therapeutic_tools(is_template);
CREATE INDEX IF NOT EXISTS idx_tools_created_by ON public.therapeutic_tools(created_by);
CREATE INDEX IF NOT EXISTS idx_tools_tags ON public.therapeutic_tools USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_assignments_tool ON public.tool_assignments(tool_id);
CREATE INDEX IF NOT EXISTS idx_assignments_patient ON public.tool_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_assignments_psychologist ON public.tool_assignments(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.tool_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.tool_assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_responses_assignment ON public.tool_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_responses_progress ON public.tool_responses(progress);

-- ============================================
-- 10. SEED TEMPLATE TOOLS (PSS-10, GAD-7, PHQ-9)
-- ============================================

-- PSS-10: Perceived Stress Scale
INSERT INTO public.therapeutic_tools (title, description, category, estimated_minutes, is_template, tags, schema)
VALUES (
    'Escala de Estrés Percibido (PSS-10)',
    'Mide el grado en que las situaciones de la vida se perciben como estresantes. 10 ítems, escala Likert de 5 puntos.',
    'scale',
    5,
    true,
    ARRAY['estrés', 'ansiedad', 'percepción', 'bienestar'],
    '{
        "version": "1.0",
        "metadata": {
            "name": "Escala de Estrés Percibido (PSS-10)",
            "author": "Cohen, Kamarck & Mermelstein (1983)",
            "reference": "Journal of Health and Social Behavior, 24, 385-396",
            "estimated_minutes": 5,
            "instructions": "Las preguntas de esta escala se refieren a tus sentimientos y pensamientos durante el ÚLTIMO MES. En cada caso, indica con qué frecuencia te has sentido o pensado de esa manera."
        },
        "sections": [
            {
                "id": "stress_perception",
                "title": "Percepción de Estrés",
                "description": "En el último mes, ¿con qué frecuencia...",
                "questions": [
                    {
                        "id": "q1",
                        "text": "¿Te has sentido afectado/a por algo que ocurrió inesperadamente?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q2",
                        "text": "¿Has sentido que eras incapaz de controlar las cosas importantes de tu vida?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q3",
                        "text": "¿Te has sentido nervioso/a o estresado/a?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q4",
                        "text": "¿Has manejado con éxito los pequeños problemas irritantes de la vida?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q5",
                        "text": "¿Has sentido que afrontabas efectivamente los cambios importantes que estaban ocurriendo en tu vida?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q6",
                        "text": "¿Has confiado en tu capacidad para manejar tus problemas personales?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q7",
                        "text": "¿Has sentido que las cosas te iban bien?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q8",
                        "text": "¿Has sentido que no podías afrontar todas las cosas que tenías que hacer?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q9",
                        "text": "¿Has podido controlar las dificultades de tu vida?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    },
                    {
                        "id": "q10",
                        "text": "¿Has sentido que tenías todo bajo control?",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Casi nunca"},
                            {"value": 2, "label": "A veces"},
                            {"value": 3, "label": "Frecuentemente"},
                            {"value": 4, "label": "Muy frecuentemente"}
                        ]
                    }
                ]
            }
        ],
        "scoring": {
            "method": "sum",
            "max_score": 40,
            "reverse_items": ["q4", "q5", "q6", "q7", "q9", "q10"],
            "reverse_max": 4,
            "ranges": [
                {"min": 0, "max": 13, "label": "Estrés bajo", "color": "#22c55e", "description": "Nivel de estrés dentro del rango normal. Buena capacidad de afrontamiento."},
                {"min": 14, "max": 26, "label": "Estrés moderado", "color": "#eab308", "description": "Nivel de estrés moderado. Se recomienda implementar estrategias de manejo del estrés."},
                {"min": 27, "max": 40, "label": "Estrés alto", "color": "#ef4444", "description": "Nivel de estrés elevado. Se recomienda intervención terapéutica para manejo del estrés."}
            ]
        }
    }'::jsonb
);

-- GAD-7: Generalized Anxiety Disorder
INSERT INTO public.therapeutic_tools (title, description, category, estimated_minutes, is_template, tags, schema)
VALUES (
    'Escala de Ansiedad Generalizada (GAD-7)',
    'Evalúa la severidad de la ansiedad generalizada. 7 ítems, ampliamente validada en contextos clínicos.',
    'scale',
    3,
    true,
    ARRAY['ansiedad', 'GAD', 'screening', 'severidad'],
    '{
        "version": "1.0",
        "metadata": {
            "name": "Escala de Ansiedad Generalizada (GAD-7)",
            "author": "Spitzer, Kroenke, Williams & Löwe (2006)",
            "reference": "Archives of Internal Medicine, 166(10), 1092-1097",
            "estimated_minutes": 3,
            "instructions": "Durante las ÚLTIMAS 2 SEMANAS, ¿con qué frecuencia te han molestado los siguientes problemas?"
        },
        "sections": [
            {
                "id": "anxiety_symptoms",
                "title": "Síntomas de Ansiedad",
                "description": "Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado los siguientes problemas?",
                "questions": [
                    {
                        "id": "q1",
                        "text": "Sentirse nervioso/a, ansioso/a o con los nervios de punta",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q2",
                        "text": "No poder parar o controlar las preocupaciones",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q3",
                        "text": "Preocuparse demasiado por diferentes cosas",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q4",
                        "text": "Dificultad para relajarse",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q5",
                        "text": "Estar tan inquieto/a que es difícil permanecer sentado/a",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q6",
                        "text": "Molestarse o irritarse fácilmente",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q7",
                        "text": "Sentir miedo como si algo terrible pudiera pasar",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    }
                ]
            }
        ],
        "scoring": {
            "method": "sum",
            "max_score": 21,
            "reverse_items": [],
            "reverse_max": 0,
            "ranges": [
                {"min": 0, "max": 4, "label": "Ansiedad mínima", "color": "#22c55e", "description": "Nivel mínimo de ansiedad. No requiere intervención inmediata."},
                {"min": 5, "max": 9, "label": "Ansiedad leve", "color": "#84cc16", "description": "Ansiedad leve. Se recomienda monitoreo y técnicas de relajación."},
                {"min": 10, "max": 14, "label": "Ansiedad moderada", "color": "#eab308", "description": "Ansiedad moderada. Se recomienda evaluación clínica e intervención terapéutica."},
                {"min": 15, "max": 21, "label": "Ansiedad severa", "color": "#ef4444", "description": "Ansiedad severa. Requiere intervención terapéutica inmediata."}
            ]
        }
    }'::jsonb
);

-- PHQ-9: Patient Health Questionnaire (Depression)
INSERT INTO public.therapeutic_tools (title, description, category, estimated_minutes, is_template, tags, schema)
VALUES (
    'Cuestionario de Salud del Paciente (PHQ-9)',
    'Evalúa la severidad de la depresión. 9 ítems basados en los criterios diagnósticos del DSM.',
    'questionnaire',
    4,
    true,
    ARRAY['depresión', 'PHQ', 'screening', 'ánimo'],
    '{
        "version": "1.0",
        "metadata": {
            "name": "Cuestionario de Salud del Paciente (PHQ-9)",
            "author": "Kroenke, Spitzer & Williams (2001)",
            "reference": "Journal of General Internal Medicine, 16(9), 606-613",
            "estimated_minutes": 4,
            "instructions": "Durante las ÚLTIMAS 2 SEMANAS, ¿con qué frecuencia te han molestado los siguientes problemas?"
        },
        "sections": [
            {
                "id": "depression_symptoms",
                "title": "Síntomas Depresivos",
                "description": "Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado los siguientes problemas?",
                "questions": [
                    {
                        "id": "q1",
                        "text": "Poco interés o placer en hacer las cosas",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q2",
                        "text": "Sentirse desanimado/a, deprimido/a o sin esperanza",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q3",
                        "text": "Dificultad para dormir, mantenerse dormido/a, o dormir demasiado",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q4",
                        "text": "Sentirse cansado/a o con poca energía",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q5",
                        "text": "Falta de apetito o comer en exceso",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q6",
                        "text": "Sentirse mal consigo mismo/a, o sentirse fracasado/a o que le ha fallado a su familia",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q7",
                        "text": "Dificultad para concentrarse en cosas como leer o ver televisión",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q8",
                        "text": "Moverse o hablar tan lento que otros lo notan, o lo contrario — estar tan inquieto/a que se mueve mucho más de lo normal",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    },
                    {
                        "id": "q9",
                        "text": "Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera",
                        "type": "likert",
                        "required": true,
                        "options": [
                            {"value": 0, "label": "Nunca"},
                            {"value": 1, "label": "Varios días"},
                            {"value": 2, "label": "Más de la mitad de los días"},
                            {"value": 3, "label": "Casi todos los días"}
                        ]
                    }
                ]
            }
        ],
        "scoring": {
            "method": "sum",
            "max_score": 27,
            "reverse_items": [],
            "reverse_max": 0,
            "ranges": [
                {"min": 0, "max": 4, "label": "Depresión mínima", "color": "#22c55e", "description": "Síntomas mínimos. No requiere intervención inmediata, pero mantener monitoreo."},
                {"min": 5, "max": 9, "label": "Depresión leve", "color": "#84cc16", "description": "Depresión leve. Se recomienda vigilancia y posible intervención psicológica."},
                {"min": 10, "max": 14, "label": "Depresión moderada", "color": "#eab308", "description": "Depresión moderada. Se recomienda plan de tratamiento terapéutico activo."},
                {"min": 15, "max": 19, "label": "Depresión moderada-severa", "color": "#f97316", "description": "Depresión moderada a severa. Requiere tratamiento activo, considerar farmacoterapia."},
                {"min": 20, "max": 27, "label": "Depresión severa", "color": "#ef4444", "description": "Depresión severa. Requiere intervención inmediata con posible derivación psiquiátrica."}
            ]
        }
    }'::jsonb
);
