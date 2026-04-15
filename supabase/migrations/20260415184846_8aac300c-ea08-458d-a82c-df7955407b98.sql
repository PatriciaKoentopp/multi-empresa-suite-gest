CREATE TABLE public.movimentacoes_impostos_retidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id UUID NOT NULL REFERENCES public.movimentacoes(id) ON DELETE CASCADE,
  imposto_retido_id UUID NOT NULL REFERENCES public.impostos_retidos(id),
  valor NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_impostos_retidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view" ON public.movimentacoes_impostos_retidos FOR SELECT USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can insert" ON public.movimentacoes_impostos_retidos FOR INSERT WITH CHECK (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can update" ON public.movimentacoes_impostos_retidos FOR UPDATE USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);
CREATE POLICY "Users can delete" ON public.movimentacoes_impostos_retidos FOR DELETE USING (
  movimentacao_id IN (SELECT id FROM movimentacoes WHERE empresa_id = get_user_company_id())
);