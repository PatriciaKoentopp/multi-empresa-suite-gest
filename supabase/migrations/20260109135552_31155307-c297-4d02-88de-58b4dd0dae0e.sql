-- Remover a constraint existente
ALTER TABLE antecipacoes DROP CONSTRAINT IF EXISTS antecipacoes_status_check;

-- Recriar a constraint incluindo 'devolvida'
ALTER TABLE antecipacoes ADD CONSTRAINT antecipacoes_status_check 
CHECK (status IN ('ativa', 'utilizada', 'cancelada', 'devolvida'));