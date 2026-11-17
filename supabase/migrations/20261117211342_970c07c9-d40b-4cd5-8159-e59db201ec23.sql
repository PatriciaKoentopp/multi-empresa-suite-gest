CREATE OR REPLACE FUNCTION public.ia_executar_consulta(p_empresa_id uuid, p_sql text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sql text := btrim(regexp_replace(p_sql, ';\s*$', ''));
  v_result jsonb;
BEGIN
  IF p_empresa_id IS DISTINCT FROM public.get_user_company_id() THEN
    RAISE EXCEPTION 'Empresa inválida.';
  END IF;
  IF v_sql !~* '^(select|with)\s' THEN
    RAISE EXCEPTION 'Somente consultas SELECT sao permitidas.';
  END IF;
  IF v_sql ~* '(;|\minsert\M|\mupdate\M|\mdelete\M|\mdrop\M|\malter\M|\mcreate\M|\mgrant\M|\mrevoke\M|\mtruncate\M|\mcopy\M|\mvacuum\M|\mmerge\M|\mcall\M|\mexecute\M|\mpg_|\mauth\.|\mstorage\.|\mvault\.|\minformation_schema\.|\mset\s+role\M|\mdblink|\mia_executar_consulta\M)' THEN
    RAISE EXCEPTION 'Consulta contem comandos nao permitidos.';
  END IF;
  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', v_sql) INTO v_result;
  RETURN v_result;
END;
$function$;
REVOKE ALL ON FUNCTION public.ia_executar_consulta(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ia_executar_consulta(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.gerar_proximo_numero_orcamento(empresa_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  novo_numero INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND empresa_id_param IS DISTINCT FROM public.get_user_company_id() THEN
    RAISE EXCEPTION 'Empresa inválida.';
  END IF;
  UPDATE public.numeracao_orcamentos
  SET proximo_numero = proximo_numero + 1, updated_at = now()
  WHERE empresa_id = empresa_id_param
  RETURNING proximo_numero - 1 INTO novo_numero;
  IF novo_numero IS NULL THEN
    INSERT INTO public.numeracao_orcamentos (empresa_id, proximo_numero)
    VALUES (empresa_id_param, 2)
    ON CONFLICT (empresa_id) DO UPDATE SET proximo_numero = EXCLUDED.proximo_numero, updated_at = now()
    RETURNING proximo_numero - 1 INTO novo_numero;
  END IF;
  RETURN novo_numero;
END;
$function$;
REVOKE ALL ON FUNCTION public.gerar_proximo_numero_orcamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gerar_proximo_numero_orcamento(uuid) TO authenticated, service_role;