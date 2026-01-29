-- Remover a constraint existente
ALTER TABLE fluxo_caixa DROP CONSTRAINT IF EXISTS fluxo_caixa_origem_check;

-- Criar nova constraint com o valor adicional
ALTER TABLE fluxo_caixa ADD CONSTRAINT fluxo_caixa_origem_check 
CHECK (origem IN (
  'movimentacao', 
  'contas_pagar', 
  'contas_receber', 
  'antecipacao', 
  'transferencia',
  'antecipacao_baixa'
));