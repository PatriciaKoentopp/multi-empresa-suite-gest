CREATE TABLE public.logs_transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  usuario_id uuid,
  usuario_nome text,
  acao character varying NOT NULL,
  modulo character varying NOT NULL,
  entidade character varying NOT NULL,
  entidade_id uuid,
  descricao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.logs_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs from their company"
  ON public.logs_transacoes
  FOR SELECT
  TO public
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can insert logs for their company"
  ON public.logs_transacoes
  FOR INSERT
  TO public
  WITH CHECK (empresa_id = get_user_company_id());

CREATE INDEX idx_logs_transacoes_empresa_created ON public.logs_transacoes (empresa_id, created_at DESC);
CREATE INDEX idx_logs_transacoes_modulo ON public.logs_transacoes (modulo);
CREATE INDEX idx_logs_transacoes_acao ON public.logs_transacoes (acao);