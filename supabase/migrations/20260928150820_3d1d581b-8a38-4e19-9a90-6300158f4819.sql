CREATE TABLE public.whatsapp_numeros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT 'WhatsApp',
  telefone text,
  phone_number_id text NOT NULL UNIQUE,
  secret_name text NOT NULL DEFAULT 'WHATSAPP_API_KEY',
  funil_id uuid REFERENCES public.funis(id) ON DELETE SET NULL,
  etapa_id uuid REFERENCES public.funil_etapas(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_numeros TO authenticated;
GRANT ALL ON public.whatsapp_numeros TO service_role;
ALTER TABLE public.whatsapp_numeros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_numeros empresa" ON public.whatsapp_numeros FOR ALL TO authenticated
  USING (empresa_id = get_user_company_id()) WITH CHECK (empresa_id = get_user_company_id());

CREATE TABLE public.whatsapp_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_id uuid NOT NULL REFERENCES public.whatsapp_numeros(id) ON DELETE CASCADE,
  wa_id text NOT NULL,
  nome text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'crm',
  ultima_mensagem_em timestamptz,
  nao_lidas integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (numero_id, wa_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_contatos TO authenticated;
GRANT ALL ON public.whatsapp_contatos TO service_role;
ALTER TABLE public.whatsapp_contatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_contatos empresa" ON public.whatsapp_contatos FOR ALL TO authenticated
  USING (empresa_id = get_user_company_id()) WITH CHECK (empresa_id = get_user_company_id());

CREATE TABLE public.whatsapp_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero_id uuid NOT NULL REFERENCES public.whatsapp_numeros(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.whatsapp_contatos(id) ON DELETE CASCADE,
  direcao text NOT NULL,
  wa_message_id text UNIQUE,
  tipo text NOT NULL DEFAULT 'text',
  conteudo text,
  status text NOT NULL DEFAULT 'accepted',
  erro text,
  enviado_por uuid,
  provider_timestamp timestamptz,
  status_timestamps jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_mensagens_contato_idx ON public.whatsapp_mensagens(contato_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_mensagens TO authenticated;
GRANT ALL ON public.whatsapp_mensagens TO service_role;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_mensagens empresa" ON public.whatsapp_mensagens FOR ALL TO authenticated
  USING (empresa_id = get_user_company_id()) WITH CHECK (empresa_id = get_user_company_id());

CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX whatsapp_webhook_pending_idx ON public.whatsapp_webhook_events(processed_at, attempts, received_at);
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER wa_numeros_upd BEFORE UPDATE ON public.whatsapp_numeros FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER wa_contatos_upd BEFORE UPDATE ON public.whatsapp_contatos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER wa_mensagens_upd BEFORE UPDATE ON public.whatsapp_mensagens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contatos;