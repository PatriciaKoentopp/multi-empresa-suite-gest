
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
      
      // Obter ano e mês atual
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11, então somamos 1
      
      console.log("Data atual:", { currentYear, currentMonth });
      
      // Buscar todos os orçamentos de venda para calcular quantidades e filtrar por período
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

      // Processar contagem por ano e mês usando a mesma lógica, mas filtrando o ano corrente
      const salesCountByYear: Record<number, number> = {};
      const salesCountByYearMonth: Record<string, number> = {};
      
      if (salesData) {
        salesData.forEach(orcamento => {
          if (orcamento.data_venda) {
            // Usar substring para extrair ano e mês da data (formato YYYY-MM-DD)
            const year = parseInt(orcamento.data_venda.substring(0, 4), 10);
            const month = parseInt(orcamento.data_venda.substring(5, 7), 10);
            const yearMonthKey = `${year}-${month}`;
            
            // Para o ano corrente, considerar apenas meses anteriores ao mês atual (estritamente menor que)
            const shouldInclude = year < currentYear || (year === currentYear && month < currentMonth);
            
            console.log(`Processando venda: ${orcamento.data_venda}, year: ${year}, month: ${month}, shouldInclude: ${shouldInclude}`);
            
            if (shouldInclude) {
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
          }
        });
      }

      console.log("Contagem de vendas por ano (filtrado):", salesCountByYear);
      console.log("Contagem de vendas por ano-mês (filtrado):", salesCountByYearMonth);
      
      // Garantir que todos os campos numéricos sejam números e não nulos
      const processedYearlyData = Array.isArray(yearComparisonData) ? yearComparisonData.map((item: any) => {
        const year = Number(item.year || 0);
        
        // Para o ano corrente, recalcular o total e a média considerando apenas os meses até o mês anterior
        let adjustedTotal = Number(item.total || 0);
        let adjustedMedia = Number(item.media_mensal || 0);
        let adjustedNumMeses = Number(item.num_meses || 0);
        
        if (year === currentYear) {
          // Recalcular considerando apenas meses até o mês anterior ao atual (estritamente menor que)
          const monthsToConsider = currentMonth - 1; // Meses de janeiro até o mês anterior ao atual
          
          console.log(`Processando ano corrente ${year}: monthsToConsider = ${monthsToConsider}`);
          
          if (monthsToConsider > 0) {
            // Buscar valor total apenas dos meses que devemos considerar
            let totalForFilteredMonths = 0;
            
            if (salesData) {
              salesData.forEach(orcamento => {
                if (orcamento.data_venda) {
                  const saleYear = parseInt(orcamento.data_venda.substring(0, 4), 10);
                  const saleMonth = parseInt(orcamento.data_venda.substring(5, 7), 10);
                  
                  // Usar estritamente menor que (<) para excluir o mês atual
                  if (saleYear === currentYear && saleMonth < currentMonth) {
                    const temValor = orcamento.orcamentos_itens.some((item: any) => 
                      Number(item.valor) > 0
                    );
                    
                    if (temValor) {
                      orcamento.orcamentos_itens.forEach((item: any) => {
                        totalForFilteredMonths += Number(item.valor);
                      });
                    }
                  }
                }
              });
            }
            
            adjustedTotal = totalForFilteredMonths;
            adjustedNumMeses = monthsToConsider;
            adjustedMedia = adjustedNumMeses > 0 ? adjustedTotal / adjustedNumMeses : 0;
            
            console.log(`Ano corrente ajustado: total = ${adjustedTotal}, meses = ${adjustedNumMeses}, media = ${adjustedMedia}`);
          } else {
            // Se estivermos em janeiro, não há meses anteriores para mostrar
            adjustedTotal = 0;
            adjustedMedia = 0;
            adjustedNumMeses = 0;
            
            console.log("Janeiro ou sem meses anteriores, zerando dados");
          }
        }
        
        return {
          year: year,
          total: adjustedTotal,
          qtde_vendas: salesCountByYear[year] || 0,
          variacao_total: item.variacao_total !== null ? Number(item.variacao_total) : null,
          media_mensal: adjustedMedia,
          variacao_media: item.variacao_media !== null ? Number(item.variacao_media) : null,
          num_meses: adjustedNumMeses
        };
      }) : [];

      console.log("Dados de comparação anual processados (com filtro de meses):", processedYearlyData);
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
