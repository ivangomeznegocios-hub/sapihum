-- ============================================
-- COMUNIDAD DE PSICOLOGÍA - DATABASE SCHEMA
-- Migration: 039_consent_records
-- Description: Consent management system for LFPDPPP (México) and GDPR (EU)
-- Tracks all user consents, ARCO requests, and data deletion requests
-- ============================================

-- 1. Consent Records Table
-- Tracks when users accept/reject specific consent types
CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'privacy_policy',        -- Aviso de Privacidad
        'terms_of_service',      -- Términos de Servicio
        'clinical_data',         -- Consentimiento para datos clínicos sensibles
        'ai_processing',         -- Consentimiento para procesamiento con IA
        'marketing',             -- Consentimiento para comunicaciones de marketing
        'cookies_analytics',     -- Cookies analíticas
        'cookies_functional',    -- Cookies funcionales
        'international_transfer' -- Transferencia internacional de datos (LFPDPPP Art. 36)
    )),
    version TEXT NOT NULL DEFAULT '1.0',  -- Version of the policy accepted
    granted BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT,                       -- IP from which consent was given
    user_agent TEXT,                        -- Browser/device info
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,                -- NULL if still active
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.consent_records IS 'Immutable log of all user consents for LFPDPPP and GDPR compliance';

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
ON public.consent_records FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own consents (grant or revoke)
CREATE POLICY "Users can create own consents"
ON public.consent_records FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can view all consents
CREATE POLICY "Admins can view all consents"
ON public.consent_records FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- No UPDATE or DELETE — consent records are immutable (revocation = new record with revoked_at)

CREATE INDEX IF NOT EXISTS idx_consent_user ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON public.consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_granted ON public.consent_records(granted_at DESC);

-- 2. ARCO Requests Table (Acceso, Rectificación, Cancelación, Oposición)
-- Required by LFPDPPP Art. 28-35 and GDPR Art. 15-21
CREATE TABLE IF NOT EXISTS public.arco_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'access',        -- Derecho de Acceso (ver mis datos)
        'rectification', -- Derecho de Rectificación (corregir mis datos)
        'cancellation',  -- Derecho de Cancelación / Olvido (eliminar mis datos)
        'opposition',    -- Derecho de Oposición (no procesar mis datos)
        'portability'    -- Derecho de Portabilidad (exportar mis datos) - GDPR
    )),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    description TEXT,                    -- User's request description  
    admin_notes TEXT,                    -- Admin response/notes
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.arco_requests IS 'ARCO/GDPR data rights requests from users. Must be resolved within 20 days (LFPDPPP) or 30 days (GDPR)';

ALTER TABLE public.arco_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own ARCO requests"
ON public.arco_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can create requests
CREATE POLICY "Users can create ARCO requests"
ON public.arco_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can manage all ARCO requests
CREATE POLICY "Admins can manage ARCO requests"
ON public.arco_requests FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE INDEX IF NOT EXISTS idx_arco_user ON public.arco_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_arco_status ON public.arco_requests(status);
CREATE INDEX IF NOT EXISTS idx_arco_type ON public.arco_requests(request_type);

-- Trigger for updated_at
CREATE TRIGGER update_arco_requests_updated_at
    BEFORE UPDATE ON public.arco_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
