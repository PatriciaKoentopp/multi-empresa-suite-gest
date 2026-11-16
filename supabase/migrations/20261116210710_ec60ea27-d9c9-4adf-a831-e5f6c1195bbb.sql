ALTER TABLE public.relogio_tipos_projeto ADD COLUMN IF NOT EXISTS papel_id uuid REFERENCES public.agenda_papeis(id) ON DELETE SET NULL;
ALTER TABLE public.relogio_apontamentos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.agenda_tarefas ADD COLUMN IF NOT EXISTS relogio_apontamento_id uuid UNIQUE REFERENCES public.relogio_apontamentos(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.sync_apontamento_agenda()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_papel uuid; v_desc text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.agenda_tarefas WHERE relogio_apontamento_id = OLD.id;
    RETURN OLD;
  END IF;
  IF NEW.user_id IS NULL THEN
    DELETE FROM public.agenda_tarefas WHERE relogio_apontamento_id = NEW.id;
    RETURN NEW;
  END IF;
  SELECT tp.papel_id INTO v_papel
    FROM public.relogio_projetos p
    JOIN public.relogio_tipos_projeto tp ON tp.id = p.tipo_projeto_id
    JOIN public.agenda_papeis ap ON ap.id = tp.papel_id AND ap.user_id = NEW.user_id
   WHERE p.id = NEW.projeto_id;
  SELECT concat_ws(' / ', NULLIF(concat_ws(' - ', p.codigo, p.nome), ''), t.nome, NEW.observacao) INTO v_desc
    FROM public.relogio_projetos p LEFT JOIN public.relogio_tarefas t ON t.id = NEW.tarefa_id
   WHERE p.id = NEW.projeto_id;
  INSERT INTO public.agenda_tarefas (user_id, papel_id, titulo, descricao, data, hora_inicio, hora_fim, duracao_min, triade, status, concluida_em, relogio_apontamento_id)
  VALUES (NEW.user_id, v_papel, 'Horas Apontadas', v_desc, NEW.data, NEW.hora_inicio, NEW.hora_fim,
          round(coalesce(NEW.duracao_decimal,0)*60)::int, 'importante', 'concluida', now(), NEW.id)
  ON CONFLICT (relogio_apontamento_id) DO UPDATE SET
    user_id = EXCLUDED.user_id, papel_id = EXCLUDED.papel_id, descricao = EXCLUDED.descricao,
    data = EXCLUDED.data, hora_inicio = EXCLUDED.hora_inicio, hora_fim = EXCLUDED.hora_fim,
    duracao_min = EXCLUDED.duracao_min;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_apontamento_agenda() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_sync_apontamento_agenda AFTER INSERT OR UPDATE OR DELETE ON public.relogio_apontamentos
FOR EACH ROW EXECUTE FUNCTION public.sync_apontamento_agenda();

CREATE OR REPLACE FUNCTION public.sync_tipo_projeto_papel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.papel_id IS DISTINCT FROM OLD.papel_id THEN
    UPDATE public.agenda_tarefas at SET papel_id =
      (SELECT ap.id FROM public.agenda_papeis ap WHERE ap.id = NEW.papel_id AND ap.user_id = at.user_id)
    FROM public.relogio_apontamentos a JOIN public.relogio_projetos p ON p.id = a.projeto_id
    WHERE at.relogio_apontamento_id = a.id AND p.tipo_projeto_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_tipo_projeto_papel() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_sync_tipo_projeto_papel AFTER UPDATE ON public.relogio_tipos_projeto
FOR EACH ROW EXECUTE FUNCTION public.sync_tipo_projeto_papel();

-- carga inicial: apontamentos antigos ficam com o administrador da empresa
UPDATE public.relogio_apontamentos a SET user_id = (
  SELECT u.id FROM public.usuarios u WHERE u.empresa_id = a.empresa_id AND u.tipo = 'Administrador' ORDER BY u.created_at LIMIT 1)
WHERE a.user_id IS NULL;