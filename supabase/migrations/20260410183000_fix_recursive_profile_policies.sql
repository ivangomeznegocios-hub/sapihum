-- Fix recursive RLS references between profiles and patient relationships.

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'::public.user_role
  );
$$;

ALTER FUNCTION public.is_current_user_admin() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.current_user_has_role(target_role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = target_role
  );
$$;

ALTER FUNCTION public.current_user_has_role(public.user_role) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.user_role) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view all relationships" ON public.patient_psychologist_relationships;
DROP POLICY IF EXISTS "Admins can manage all relationships" ON public.patient_psychologist_relationships;
DROP POLICY IF EXISTS "Psychologists can create relationships" ON public.patient_psychologist_relationships;

CREATE POLICY "Admins can view all relationships"
ON public.patient_psychologist_relationships
FOR SELECT
TO authenticated
USING (public.current_user_has_role('admin'::public.user_role));

CREATE POLICY "Admins can manage all relationships"
ON public.patient_psychologist_relationships
FOR ALL
TO authenticated
USING (public.current_user_has_role('admin'::public.user_role))
WITH CHECK (public.current_user_has_role('admin'::public.user_role));

CREATE POLICY "Psychologists can create relationships"
ON public.patient_psychologist_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  psychologist_id = auth.uid()
  AND public.current_user_has_role('psychologist'::public.user_role)
);

NOTIFY pgrst, 'reload schema';
