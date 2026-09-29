CREATE TABLE public.agenda_papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3b82f6',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.agenda_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  papel_id uuid REFERENCES public.agenda_papeis(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  data_alvo date,
  progresso integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'em_andamento',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.agenda_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  papel_id uuid REFERENCES public.agenda_papeis(id) ON DELETE SET NULL,
  meta_id uuid REFERENCES public.agenda_metas(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  data date NOT NULL,
  hora_inicio time,
  hora_fim time,
  duracao_min integer NOT NULL DEFAULT 0,
  triade text NOT NULL DEFAULT 'importante',
  status text NOT NULL DEFAULT 'pendente',
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_papeis, public.agenda_metas, public.agenda_tarefas TO authenticated;
GRANT ALL ON public.agenda_papeis, public.agenda_metas, public.agenda_tarefas TO service_role;
ALTER TABLE public.agenda_papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own papeis" ON public.agenda_papeis FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own metas" ON public.agenda_metas FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tarefas" ON public.agenda_tarefas FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX agenda_tarefas_user_data_idx ON public.agenda_tarefas(user_id, data);
CREATE TRIGGER agenda_papeis_upd BEFORE UPDATE ON public.agenda_papeis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER agenda_metas_upd BEFORE UPDATE ON public.agenda_metas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER agenda_tarefas_upd BEFORE UPDATE ON public.agenda_tarefas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();