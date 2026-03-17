
-- Tabela de fechamentos mensais
CREATE TABLE public.fechamentos_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL CHECK (ano >= 2000),
  data_fechamento timestamptz NOT NULL DEFAULT now(),
  fechado_por uuid,
  fechado_por_nome text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, mes, ano)
);

-- RLS
ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fechamentos from their company"
ON public.fechamentos_mensais FOR SELECT
TO authenticated
USING (empresa_id = get_user_company_id());

CREATE POLICY "Users can insert fechamentos for their company"
ON public.fechamentos_mensais FOR INSERT
TO authenticated
WITH CHECK (empresa_id = get_user_company_id());

CREATE POLICY "Users can delete fechamentos from their company"
ON public.fechamentos_mensais FOR DELETE
TO authenticated
USING (empresa_id = get_user_company_id());

-- Função de verificação
CREATE OR REPLACE FUNCTION public.is_periodo_fechado(p_empresa_id uuid, p_data date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fechamentos_mensais
    WHERE empresa_id = p_empresa_id
      AND mes = EXTRACT(MONTH FROM p_data)::integer
      AND ano = EXTRACT(YEAR FROM p_data)::integer
  )
$$;
