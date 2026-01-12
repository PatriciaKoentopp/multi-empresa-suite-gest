-- Adicionar campo data_aniversario na tabela leads
ALTER TABLE leads ADD COLUMN data_aniversario DATE;

COMMENT ON COLUMN leads.data_aniversario IS 'Data de aniversário do favorecido vinculado (usado para controle de exibição em funis de aniversário)';