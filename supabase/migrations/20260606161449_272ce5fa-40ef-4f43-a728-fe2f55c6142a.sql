ALTER TABLE public.relogio_projetos
  ADD COLUMN IF NOT EXISTS data_fotos date,
  ADD COLUMN IF NOT EXISTS data_previa date,
  ADD COLUMN IF NOT EXISTS data_selecao date,
  ADD COLUMN IF NOT EXISTS data_prazo date,
  ADD COLUMN IF NOT EXISTS data_entrega date;