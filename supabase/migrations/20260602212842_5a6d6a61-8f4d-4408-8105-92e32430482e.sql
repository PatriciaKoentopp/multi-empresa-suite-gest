
ALTER TABLE public.relogio_projetos ADD COLUMN IF NOT EXISTS tipo_projeto_id uuid REFERENCES public.relogio_tipos_projeto(id) ON DELETE SET NULL;

-- Garante que exista o tipo "Fotografia" para cada empresa que tenha projetos
INSERT INTO public.relogio_tipos_projeto (empresa_id, nome, status)
SELECT DISTINCT p.empresa_id, 'Fotografia', 'ativo'
FROM public.relogio_projetos p
WHERE NOT EXISTS (
  SELECT 1 FROM public.relogio_tipos_projeto t
  WHERE t.empresa_id = p.empresa_id AND lower(t.nome) = 'fotografia'
);

-- Atualiza projetos existentes sem tipo para "Fotografia"
UPDATE public.relogio_projetos p
SET tipo_projeto_id = t.id
FROM public.relogio_tipos_projeto t
WHERE p.tipo_projeto_id IS NULL
  AND t.empresa_id = p.empresa_id
  AND lower(t.nome) = 'fotografia';
