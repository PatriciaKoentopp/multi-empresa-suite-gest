ALTER TABLE public.agenda_metas
  ADD COLUMN IF NOT EXISTS tipo_medicao text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS valor_alvo numeric,
  ADD COLUMN IF NOT EXISTS unidade text;
ALTER TABLE public.agenda_metas ADD CONSTRAINT agenda_metas_tipo_medicao_chk CHECK (tipo_medicao IN ('manual','quantidade','tempo'));