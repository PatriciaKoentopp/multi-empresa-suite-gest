DROP INDEX IF EXISTS public.relogio_projetos_empresa_codigo_uk;
CREATE UNIQUE INDEX relogio_projetos_empresa_codigo_nome_uk ON public.relogio_projetos(empresa_id, codigo, nome);