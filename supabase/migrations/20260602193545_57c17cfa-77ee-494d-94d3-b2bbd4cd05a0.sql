CREATE TABLE public.relogio_projetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  codigo varchar NOT NULL,
  nome varchar NOT NULL,
  favorecido_id uuid NOT NULL,
  fotos_tiradas integer NOT NULL DEFAULT 0,
  fotos_enviadas integer NOT NULL DEFAULT 0,
  fotos_vendidas integer NOT NULL DEFAULT 0,
  status varchar NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX relogio_projetos_empresa_codigo_uk ON public.relogio_projetos(empresa_id, codigo);
CREATE INDEX relogio_projetos_favorecido_idx ON public.relogio_projetos(favorecido_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relogio_projetos TO authenticated;
GRANT ALL ON public.relogio_projetos TO service_role;

ALTER TABLE public.relogio_projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projetos of their company"
  ON public.relogio_projetos FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_company_id());

CREATE POLICY "Users can insert projetos of their company"
  ON public.relogio_projetos FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_company_id());

CREATE POLICY "Users can update projetos of their company"
  ON public.relogio_projetos FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_company_id());

CREATE POLICY "Users can delete projetos of their company"
  ON public.relogio_projetos FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_company_id());

CREATE TRIGGER set_relogio_projetos_updated_at
  BEFORE UPDATE ON public.relogio_projetos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();