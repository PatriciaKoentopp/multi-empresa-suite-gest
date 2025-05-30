
CREATE OR REPLACE FUNCTION public.get_yearly_sales_comparison()
 RETURNS TABLE(year integer, total numeric, variacao_total numeric, media_mensal numeric, variacao_media numeric, num_meses integer, qtde_vendas integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  primeira_venda_ano INTEGER;
  ano_atual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  mes_atual INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
BEGIN
  -- Buscar o ano da primeira venda registrada
  SELECT EXTRACT(YEAR FROM MIN(o.data_venda))::INT INTO primeira_venda_ano
  FROM orcamentos o
  JOIN orcamentos_itens oi ON o.id = oi.orcamento_id
  WHERE o.tipo = 'venda' AND o.status = 'ativo' AND o.data_venda IS NOT NULL;

  -- Se não há vendas, retornar vazio
  IF primeira_venda_ano IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY 
  WITH annual_data AS (
    SELECT 
      EXTRACT(YEAR FROM o.data_venda)::INT AS year,
      SUM(oi.valor) AS total,
      -- Contar apenas orçamentos que têm itens (mesmo critério do valor total)
      COUNT(DISTINCT o.id)::INT AS qtde_vendas,
      COUNT(DISTINCT EXTRACT(MONTH FROM o.data_venda))::INT AS meses_com_vendas
    FROM orcamentos o
    JOIN orcamentos_itens oi ON o.id = oi.orcamento_id
    WHERE o.tipo = 'venda' AND o.status = 'ativo' AND o.data_venda IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM o.data_venda)
    ORDER BY EXTRACT(YEAR FROM o.data_venda) DESC
  ),
  with_media AS (
    SELECT 
      ad.year,
      ad.total,
      ad.qtde_vendas,
      ad.meses_com_vendas,
      -- Calcular o número total de meses do ano considerando:
      -- - Para anos anteriores ao atual: 12 meses
      -- - Para o ano atual: meses até o mês atual
      -- - Para o primeiro ano: meses desde a primeira venda até dezembro
      CASE 
        WHEN ad.year = ano_atual THEN mes_atual
        WHEN ad.year = primeira_venda_ano AND ad.year < ano_atual THEN 
          12 - (SELECT EXTRACT(MONTH FROM MIN(o.data_venda))::INT - 1 
                FROM orcamentos o 
                JOIN orcamentos_itens oi ON o.id = oi.orcamento_id
                WHERE EXTRACT(YEAR FROM o.data_venda) = primeira_venda_ano 
                AND o.tipo = 'venda' AND o.status = 'ativo') + 1
        WHEN ad.year = primeira_venda_ano AND ad.year = ano_atual THEN
          mes_atual - (SELECT EXTRACT(MONTH FROM MIN(o.data_venda))::INT - 1 
                       FROM orcamentos o 
                       JOIN orcamentos_itens oi ON o.id = oi.orcamento_id
                       WHERE EXTRACT(YEAR FROM o.data_venda) = primeira_venda_ano 
                       AND o.tipo = 'venda' AND o.status = 'ativo') + 1
        ELSE 12
      END AS total_meses_periodo
    FROM annual_data ad
  ),
  with_correct_media AS (
    SELECT 
      wm.year,
      wm.total,
      wm.qtde_vendas,
      wm.total_meses_periodo AS num_meses,
      CASE 
        WHEN wm.total_meses_periodo > 0 THEN wm.total / wm.total_meses_periodo
        ELSE 0
      END AS media_mensal
    FROM with_media wm
  ),
  with_variation AS (
    SELECT 
      a.year,
      a.total,
      a.qtde_vendas,
      a.num_meses,
      a.media_mensal,
      CASE 
        WHEN b.total IS NOT NULL AND b.total > 0 
        THEN ((a.total - b.total) / b.total) * 100
        ELSE NULL
      END AS variacao_total,
      CASE 
        WHEN b.media_mensal IS NOT NULL AND b.media_mensal > 0 
        THEN ((a.media_mensal - b.media_mensal) / b.media_mensal) * 100
        ELSE NULL
      END AS variacao_media
    FROM with_correct_media a
    LEFT JOIN with_correct_media b ON a.year = b.year + 1
  )
  SELECT 
    wv.year, 
    wv.total, 
    wv.variacao_total, 
    wv.media_mensal,
    wv.variacao_media,
    wv.num_meses,
    wv.qtde_vendas
  FROM with_variation wv
  ORDER BY wv.year DESC;
END;
$function$
