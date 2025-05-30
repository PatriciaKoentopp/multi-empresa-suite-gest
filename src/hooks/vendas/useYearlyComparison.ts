
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { YearlyComparison } from "@/types";

export const useYearlyComparison = () => {
  const { toast } = useToast();
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);

  const fetchYearlyComparison = async () => {
    try {
      console.log("Iniciando busca de dados de comparação anual");
      
      // Buscar dados anuais usando a função RPC existente
      const { data: yearComparisonData, error: comparisonError } = await supabase
        .rpc('get_yearly_sales_comparison');

      if (comparisonError) {
        console.error("Erro ao buscar comparação anual:", comparisonError);
        throw comparisonError;
      }
      
      console.log("Dados de comparação anual brutos:", yearComparisonData);
      
      // Buscar todos os orçamentos de venda para calcular quantidades
      const { data: salesData, error: salesError } = await supabase
        .from('orcamentos')
        .select(`
          data_venda,
          orcamentos_itens!inner(valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .not('data_venda', 'is', null);

      if (salesError) {
        console.error("Erro ao buscar dados de vendas:", salesError);
        throw salesError;
      }

      // Processar contagem por ano e mês usando a mesma lógica
      const salesCountByYear: Record<number, number> = {};
      const salesCountByYearMonth: Record<string, number> = {};
      
      if (salesData) {
        salesData.forEach(orcamento => {
          if (orcamento.data_venda) {
            // Usar substring para extrair ano e mês da data (formato YYYY-MM-DD)
            const year = parseInt(orcamento.data_venda.substring(0, 4), 10);
            const month = parseInt(orcamento.data_venda.substring(5, 7), 10);
            const yearMonthKey = `${year}-${month}`;
            
            // Verificar se tem itens com valor > 0 (mesmo critério usado nos dados mensais)
            const temValor = orcamento.orcamentos_itens.some((item: any) => 
              Number(item.valor) > 0
            );
            
            if (temValor) {
              // Contar para o ano
              salesCountByYear[year] = (salesCountByYear[year] || 0) + 1;
              // Contar para o mês específico do ano
              salesCountByYearMonth[yearMonthKey] = (salesCountByYearMonth[yearMonthKey] || 0) + 1;
            }
          }
        });
      }

      console.log("Contagem de vendas por ano:", salesCountByYear);
      console.log("Contagem de vendas por ano-mês:", salesCountByYearMonth);
      
      // Garantir que todos os campos numéricos sejam números e não nulos
      const processedYearlyData = Array.isArray(yearComparisonData) ? yearComparisonData.map((item: any) => ({
        year: Number(item.year || 0),
        total: Number(item.total || 0),
        qtde_vendas: salesCountByYear[Number(item.year)] || 0,
        variacao_total: item.variacao_total !== null ? Number(item.variacao_total) : null,
        media_mensal: Number(item.media_mensal || 0),
        variacao_media: item.variacao_media !== null ? Number(item.variacao_media) : null,
        num_meses: Number(item.num_meses || 0)
      })) : [];

      console.log("Dados de comparação anual processados:", processedYearlyData);
      setYearlyComparisonData(processedYearlyData);
      
      return processedYearlyData;
    } catch (error: any) {
      console.error("Erro ao processar dados de comparação anual:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados de comparação anual",
        description: error.message || "Não foi possível processar os dados de comparação anual"
      });
      return [];
    }
  };

  return {
    yearlyComparisonData,
    fetchYearlyComparison,
    setYearlyComparisonData
  };
};
