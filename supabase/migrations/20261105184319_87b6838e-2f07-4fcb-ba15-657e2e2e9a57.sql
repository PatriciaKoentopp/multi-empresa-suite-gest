CREATE OR REPLACE FUNCTION public.criar_empresa_inicial(dados jsonb)
RETURNS public.empresas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_emp public.empresas;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = v_uid AND empresa_id IS NULL) THEN
    RAISE EXCEPTION 'Usuário já possui empresa vinculada ou não está cadastrado';
  END IF;

  INSERT INTO public.empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual, inscricao_municipal,
    email, telefone, site, cnae, regime_tributacao, logo, cep, logradouro, numero, complemento, bairro, cidade, estado, pais)
  SELECT r.razao_social, r.nome_fantasia, r.cnpj, r.inscricao_estadual, r.inscricao_municipal,
    r.email, r.telefone, r.site, r.cnae, r.regime_tributacao, r.logo, r.cep, r.logradouro, r.numero, r.complemento, r.bairro, r.cidade, r.estado, COALESCE(r.pais,'Brasil')
  FROM jsonb_populate_record(NULL::public.empresas, dados) r
  RETURNING * INTO v_emp;

  UPDATE public.usuarios SET empresa_id = v_emp.id, tipo = 'Administrador' WHERE id = v_uid;
  RETURN v_emp;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.criar_empresa_inicial(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_empresa_inicial(jsonb) TO authenticated;