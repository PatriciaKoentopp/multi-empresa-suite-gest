-- Adicionar coluna valor_devolvido na tabela antecipacoes
ALTER TABLE public.antecipacoes ADD COLUMN IF NOT EXISTS valor_devolvido NUMERIC DEFAULT 0;