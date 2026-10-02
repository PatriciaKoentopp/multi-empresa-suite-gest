-- Funções com search_path fixo
ALTER FUNCTION public.gerar_proximo_numero_orcamento(uuid) SET search_path = '';
ALTER FUNCTION public.get_user_company_id() SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo = 'Administrador' AND empresa_id IS NOT NULL)
$$;
REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated;

-- usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT TO authenticated
  USING (id = auth.uid() OR empresa_id = public.get_user_company_id());
CREATE POLICY "usuarios_insert_admin" ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin() AND empresa_id = public.get_user_company_id());
CREATE POLICY "usuarios_insert_self" ON public.usuarios FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND empresa_id IS NULL);
CREATE POLICY "usuarios_update_admin" ON public.usuarios FOR UPDATE TO authenticated
  USING (public.is_company_admin() AND empresa_id = public.get_user_company_id())
  WITH CHECK (empresa_id = public.get_user_company_id());
CREATE POLICY "usuarios_delete_admin" ON public.usuarios FOR DELETE TO authenticated
  USING (public.is_company_admin() AND empresa_id = public.get_user_company_id());

-- contratos
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_empresa" ON public.contratos FOR ALL TO authenticated
  USING (empresa_id = public.get_user_company_id()) WITH CHECK (empresa_id = public.get_user_company_id());

ALTER TABLE public.contratos_parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_parcelas_empresa" ON public.contratos_parcelas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.empresa_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contratos c WHERE c.id = contrato_id AND c.empresa_id = public.get_user_company_id()));

-- modulos_parametros
DROP POLICY IF EXISTS "Users can update their company modules" ON public.modulos_parametros;
DROP POLICY IF EXISTS "Users can insert their company modules" ON public.modulos_parametros;
DROP POLICY IF EXISTS "Users can view their company modules" ON public.modulos_parametros;
CREATE POLICY "modulos_select" ON public.modulos_parametros FOR SELECT TO authenticated USING (empresa_id = public.get_user_company_id());
CREATE POLICY "modulos_insert" ON public.modulos_parametros FOR INSERT TO authenticated WITH CHECK (empresa_id = public.get_user_company_id());
CREATE POLICY "modulos_update" ON public.modulos_parametros FOR UPDATE TO authenticated USING (empresa_id = public.get_user_company_id()) WITH CHECK (empresa_id = public.get_user_company_id());

-- notas_fiscais: só logados alteram
DROP POLICY IF EXISTS "Permitir inserções para usuários autenticados para notas_fis" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizações para o próprio usuário para notas_fis" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleções para o próprio usuário para notas_fiscais" ON storage.objects;
CREATE POLICY "notas_fiscais_insert_auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'notas_fiscais' AND owner_id = (select auth.uid()::text));
CREATE POLICY "notas_fiscais_update_auth" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'notas_fiscais' AND owner_id = (select auth.uid()::text));
CREATE POLICY "notas_fiscais_delete_auth" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'notas_fiscais' AND owner_id = (select auth.uid()::text));