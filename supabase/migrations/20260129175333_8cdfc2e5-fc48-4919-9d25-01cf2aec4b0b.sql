-- 1. Habilitar RLS na tabela movimentacoes_parcelas_antecipacoes
ALTER TABLE movimentacoes_parcelas_antecipacoes ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas de acesso baseadas na parcela (que está vinculada à movimentação → empresa)
CREATE POLICY "Users can view relacionamentos from their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR SELECT 
  USING (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert relacionamentos for their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR INSERT 
  WITH CHECK (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can delete relacionamentos from their company" 
  ON movimentacoes_parcelas_antecipacoes 
  FOR DELETE 
  USING (
    movimentacao_parcela_id IN (
      SELECT mp.id FROM movimentacoes_parcelas mp
      JOIN movimentacoes m ON m.id = mp.movimentacao_id
      WHERE m.empresa_id = get_user_company_id()
    )
  );

-- 3. Corrigir antecipações com valor_utilizado duplicado (maior que valor_total)
UPDATE antecipacoes 
SET valor_utilizado = valor_total,
    status = 'utilizada'
WHERE valor_utilizado > valor_total;