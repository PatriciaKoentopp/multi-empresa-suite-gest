
CREATE TABLE public.ia_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  usuario_id uuid NOT NULL,
  titulo text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ia_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.ia_conversas(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN ('user','assistant')),
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ia_mensagens_conversa ON public.ia_mensagens(conversa_id, created_at);
CREATE INDEX idx_ia_conversas_usuario ON public.ia_conversas(usuario_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_conversas TO authenticated;
GRANT ALL ON public.ia_conversas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ia_mensagens TO authenticated;
GRANT ALL ON public.ia_mensagens TO service_role;

ALTER TABLE public.ia_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia suas conversas" ON public.ia_conversas
  FOR ALL TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuario gerencia mensagens das suas conversas" ON public.ia_mensagens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ia_conversas c WHERE c.id = conversa_id AND c.usuario_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ia_conversas c WHERE c.id = conversa_id AND c.usuario_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.ia_executar_consulta(p_empresa_id uuid, p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text := btrim(regexp_replace(p_sql, ';\s*$', ''));
  v_result jsonb;
BEGIN
  IF v_sql !~* '^(select|with)\s' THEN
    RAISE EXCEPTION 'Somente consultas SELECT sao permitidas.';
  END IF;

  IF v_sql ~* '(;|\minsert\M|\mupdate\M|\mdelete\M|\mdrop\M|\malter\M|\mcreate\M|\mgrant\M|\mrevoke\M|\mtruncate\M|\mcopy\M|\mvacuum\M|\mmerge\M|\mcall\M|\mexecute\M|\mpg_|\mauth\.|\mstorage\.|\mvault\.|\minformation_schema\.|\mset\s+role\M|\mdblink|\mia_executar_consulta\M)' THEN
    RAISE EXCEPTION 'Consulta contem comandos nao permitidos.';
  END IF;

  IF position(p_empresa_id::text in v_sql) = 0 THEN
    RAISE EXCEPTION 'A consulta precisa filtrar pela empresa %.', p_empresa_id;
  END IF;

  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (%s) t', v_sql) INTO v_result;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.ia_executar_consulta(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.ia_executar_consulta(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.ia_listar_schema()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(t ORDER BY t->>'tabela'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'tabela', c.table_name,
      'colunas', string_agg(c.column_name || ' (' || c.data_type || ')', ', ' ORDER BY c.ordinal_position)
    ) AS t
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.table_name NOT IN ('ia_conversas','ia_mensagens')
    GROUP BY c.table_name
  ) s;
$$;

REVOKE ALL ON FUNCTION public.ia_listar_schema() FROM public;
GRANT EXECUTE ON FUNCTION public.ia_listar_schema() TO service_role;
