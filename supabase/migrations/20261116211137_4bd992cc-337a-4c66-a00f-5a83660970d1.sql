REVOKE EXECUTE ON FUNCTION public.ia_executar_consulta(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ia_executar_consulta(uuid, text) TO service_role;