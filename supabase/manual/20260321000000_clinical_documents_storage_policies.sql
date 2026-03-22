-- Run this manually in the Supabase Dashboard SQL Editor for staging / production.
-- Do not run it through `supabase db push`.

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-documents', 'clinical-documents', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

DROP POLICY IF EXISTS "Psychologists can upload clinical documents" ON storage.objects;
DROP POLICY IF EXISTS "Psychologists can view own clinical documents" ON storage.objects;
DROP POLICY IF EXISTS "Psychologists can update own clinical documents" ON storage.objects;
DROP POLICY IF EXISTS "Psychologists can delete own clinical documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to clinical documents" ON storage.objects;

CREATE POLICY "Psychologists can upload clinical documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'clinical-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
);

CREATE POLICY "Psychologists can view own clinical documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
);

CREATE POLICY "Psychologists can update own clinical documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
)
WITH CHECK (
    bucket_id = 'clinical-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
);

CREATE POLICY "Psychologists can delete own clinical documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'psychologist'
    )
);

CREATE POLICY "Admins have full access to clinical documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'clinical-documents'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'clinical-documents'
    AND EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
);
