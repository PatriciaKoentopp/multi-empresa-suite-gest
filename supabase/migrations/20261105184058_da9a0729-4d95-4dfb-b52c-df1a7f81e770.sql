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
  SELECT * FROM jsonb_populate_record(NULL::public.empresas, dados) r
  RETURNING * INTO v_emp;
  RETURN v_emp;
END;
$$;