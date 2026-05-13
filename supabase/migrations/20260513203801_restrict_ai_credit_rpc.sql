-- AI credit balance mutations must only run through trusted server code.
REVOKE EXECUTE ON FUNCTION public.consume_ai_minutes(integer, text, text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_minutes(integer, text, text, uuid) TO service_role;
