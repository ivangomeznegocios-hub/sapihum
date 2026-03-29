-- Adicionando metadata académica a la tabla de eventos para Marketing

ALTER TABLE public.events
ADD COLUMN ideal_for text[] DEFAULT NULL,
ADD COLUMN learning_outcomes text[] DEFAULT NULL,
ADD COLUMN included_resources text[] DEFAULT NULL,
ADD COLUMN certificate_type text DEFAULT 'none' CHECK (certificate_type IN ('none', 'participation', 'completion', 'specialized')),
ADD COLUMN formation_track text DEFAULT NULL;

-- Notificar a postgrest que purgue su esquema en caché
NOTIFY pgrst, 'reload schema';
