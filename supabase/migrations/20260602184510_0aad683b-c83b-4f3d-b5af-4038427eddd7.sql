
CREATE TABLE public.relogio_tipos_projeto (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  nome varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relogio_tipos_projeto TO authenticated;
GRANT ALL ON public.relogio_tipos_projeto TO service_role;

ALTER TABLE public.relogio_tipos_projeto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só veem tipos de projeto da sua empresa"
  ON public.relogio_tipos_projeto FOR SELECT
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só inserem tipos de projeto na sua empresa"
  ON public.relogio_tipos_projeto FOR INSERT
  WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só atualizam tipos de projeto da sua empresa"
  ON public.relogio_tipos_projeto FOR UPDATE
  USING (empresa_id = get_user_company_id());

CREATE POLICY "Usuários só excluem tipos de projeto da sua empresa"
  ON public.relogio_tipos_projeto FOR DELETE
  USING (empresa_id = get_user_company_id());

CREATE TRIGGER set_updated_at_relogio_tipos_projeto
  BEFORE UPDATE ON public.relogio_tipos_projeto
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.relogio_tarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_projeto_id uuid NOT NULL REFERENCES public.relogio_tipos_projeto(id) ON DELETE CASCADE,
  nome varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'ativo',
  percentual_tempo_estimado numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_relogio_tarefas_tipo_projeto ON public.relogio_tarefas(tipo_projeto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relogio_tarefas TO authenticated;
GRANT ALL ON public.relogio_tarefas TO service_role;

ALTER TABLE public.relogio_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários só veem tarefas da sua empresa"
  ON public.relogio_tarefas FOR SELECT
  USING (tipo_projeto_id IN (
    SELECT id FROM public.relogio_tipos_projeto
    WHERE empresa_id = get_user_company_id()
  ));

CREATE POLICY "Usuários só inserem tarefas na sua empresa"
  ON public.relogio_tarefas FOR INSERT
  WITH CHECK (tipo_projeto_id IN (
    SELECT id FROM public.relogio_tipos_projeto
    WHERE empresa_id = get_user_company_id()
  ));

CREATE POLICY "Usuários só atualizam tarefas da sua empresa"
  ON public.relogio_tarefas FOR UPDATE
  USING (tipo_projeto_id IN (
    SELECT id FROM public.relogio_tipos_projeto
    WHERE empresa_id = get_user_company_id()
  ));

CREATE POLICY "Usuários só excluem tarefas da sua empresa"
  ON public.relogio_tarefas FOR DELETE
  USING (tipo_projeto_id IN (
    SELECT id FROM public.relogio_tipos_projeto
    WHERE empresa_id = get_user_company_id()
  ));

CREATE TRIGGER set_updated_at_relogio_tarefas
  BEFORE UPDATE ON public.relogio_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
