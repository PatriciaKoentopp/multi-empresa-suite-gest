-- Adicionar colunas para rastreamento de origem dos lançamentos
ALTER TABLE lancamentos_contabeis
ADD COLUMN IF NOT EXISTS movimentacao_id uuid REFERENCES movimentacoes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS parcela_id uuid REFERENCES movimentacoes_parcelas(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tipo_lancamento varchar NOT NULL DEFAULT 'principal';

-- Adicionar constraint para validar tipo_lancamento
ALTER TABLE lancamentos_contabeis
ADD CONSTRAINT check_tipo_lancamento CHECK (tipo_lancamento IN ('principal', 'juros', 'multa', 'desconto'));

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_movimentacao ON lancamentos_contabeis(movimentacao_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_parcela ON lancamentos_contabeis(parcela_id);

-- Alterar as colunas para permitir NULL (débito OU crédito)
ALTER TABLE lancamentos_contabeis
ALTER COLUMN conta_debito_id DROP NOT NULL,
ALTER COLUMN conta_credito_id DROP NOT NULL;

-- Adicionar constraint para garantir que pelo menos uma das duas existe
ALTER TABLE lancamentos_contabeis
ADD CONSTRAINT check_debito_ou_credito CHECK (
  conta_debito_id IS NOT NULL OR conta_credito_id IS NOT NULL
);

-- Adicionar comentários para documentação
COMMENT ON COLUMN lancamentos_contabeis.movimentacao_id IS 'ID da movimentação que originou este lançamento';
COMMENT ON COLUMN lancamentos_contabeis.parcela_id IS 'ID da parcela que originou este lançamento';
COMMENT ON COLUMN lancamentos_contabeis.tipo_lancamento IS 'Tipo do lançamento: principal, juros, multa ou desconto';