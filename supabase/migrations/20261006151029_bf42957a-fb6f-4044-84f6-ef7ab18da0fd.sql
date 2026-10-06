CREATE TABLE public.meta_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  canal text NOT NULL CHECK (canal IN ('instagram','facebook')),
  nome text NOT NULL DEFAULT 'Conta',
  page_id text NOT NULL UNIQUE,
  secret_name text NOT NULL DEFAULT 'META_PAGE_TOKEN',
  funil_id uuid REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa_id uuid REFERENCES public.funil_etapas(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_contas TO authenticated;
GRANT ALL ON public.meta_contas TO service_role;
ALTER TABLE public.meta_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_contas empresa" ON public.meta_contas FOR ALL TO authenticated
  USING (empresa_id = public.get_user_company_id()) WITH CHECK (empresa_id = public.get_user_company_id());

CREATE TABLE public.meta_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  conta_id uuid NOT NULL REFERENCES public.meta_contas(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  nome text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  nao_lidas integer NOT NULL DEFAULT 0,
  ultima_mensagem_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_id, sender_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_contatos TO authenticated;
GRANT ALL ON public.meta_contatos TO service_role;
ALTER TABLE public.meta_contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_contatos empresa" ON public.meta_contatos FOR ALL TO authenticated
  USING (empresa_id = public.get_user_company_id()) WITH CHECK (empresa_id = public.get_user_company_id());

CREATE TABLE public.meta_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.meta_contatos(id) ON DELETE CASCADE,
  direcao text NOT NULL CHECK (direcao IN ('entrada','saida')),
  mid text UNIQUE,
  conteudo text,
  status text NOT NULL DEFAULT 'received',
  erro text,
  enviado_por uuid,
  provider_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_mensagens TO authenticated;
GRANT ALL ON public.meta_mensagens TO service_role;
ALTER TABLE public.meta_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_mensagens empresa" ON public.meta_mensagens FOR ALL TO authenticated
  USING (empresa_id = public.get_user_company_id()) WITH CHECK (empresa_id = public.get_user_company_id());
CREATE INDEX ON public.meta_mensagens(contato_id);
CREATE INDEX ON public.meta_contatos(lead_id);

CREATE TRIGGER meta_contas_updated BEFORE UPDATE ON public.meta_contas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER meta_contatos_updated BEFORE UPDATE ON public.meta_contatos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_mensagens;