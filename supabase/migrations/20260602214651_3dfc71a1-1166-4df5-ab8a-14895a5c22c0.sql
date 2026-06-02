CREATE TABLE public.relogio_apontamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  projeto_id uuid NOT NULL,
  tarefa_id uuid,
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time,
  duracao_decimal numeric(10,4) NOT NULL DEFAULT 0,
  origem varchar NOT NULL DEFAULT 'manual',
  status varchar NOT NULL DEFAULT 'concluido',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relogio_apontamentos TO authenticated;
GRANT ALL ON public.relogio_apontamentos TO service_role;

ALTER TABLE public.relogio_apontamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view apontamentos from their company"
ON public.relogio_apontamentos FOR SELECT
USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can insert apontamentos for their company"
ON public.relogio_apontamentos FOR INSERT
WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Users can update apontamentos from their company"
ON public.relogio_apontamentos FOR UPDATE
USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can delete apontamentos from their company"
ON public.relogio_apontamentos FOR DELETE
USING (empresa_id = get_user_company_id());

CREATE TRIGGER update_relogio_apontamentos_updated_at
BEFORE UPDATE ON public.relogio_apontamentos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_relogio_apontamentos_empresa_data ON public.relogio_apontamentos(empresa_id, data DESC);
CREATE INDEX idx_relogio_apontamentos_projeto ON public.relogio_apontamentos(projeto_id);
CREATE INDEX idx_relogio_apontamentos_status ON public.relogio_apontamentos(empresa_id, status);