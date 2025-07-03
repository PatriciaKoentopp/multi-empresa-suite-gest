
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
      
      // Obter ano e mês atual
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() retorna 0-11, então somamos 1
      
      console.log("Data atual:", { currentYear, currentMonth });
      
      // Buscar todos os orçamentos de venda para calcular tudo do zero, aplicando o filtro correto
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

      // Processar dados aplicando filtro para excluir mês atual
      const salesByYear: Record<number, { total: number; count: number; months: Set<number> }> = {};
      
      if (salesData) {
        salesData.forEach(orcamento => {
          if (orcamento.data_venda) {
            const year = parseInt(orcamento.data_venda.substring(0, 4), 10);
            const month = parseInt(orcamento.data_venda.substring(5, 7), 10);
            
            // Para o ano corrente, só incluir se o mês for menor que o mês atual
            const shouldInclude = year < currentYear || (year === currentYear && month < currentMonth);
            
            console.log(`Processando venda: ${orcamento.data_venda}, year: ${year}, month: ${month}, shouldInclude: ${shouldInclude}`);
            
            if (shouldInclude) {
              // Verificar se tem itens com valor > 0
              const temValor = orcamento.orcamentos_itens.some((item: any) => 
                Number(item.valor) > 0
              );
              
              if (temValor) {
                if (!salesByYear[year]) {
                  salesByYear[year] = { total: 0, count: 0, months: new Set() };
                }
                
                // Somar valores
                orcamento.orcamentos_itens.forEach((item: any) => {
                  salesByYear[year].total += Number(item.valor);
                });
                
                // Contar venda
                salesByYear[year].count += 1;
                
                // Adicionar mês ao conjunto
                salesByYear[year].months.add(month);
              }
            }
          }
        });
      }

      console.log("Dados processados por ano:", salesByYear);
      
      // Converter para formato de comparação anual
      const yearsWithData = Object.keys(salesByYear).map(Number).sort((a, b) => b - a);
      const processedYearlyData: YearlyComparison[] = [];
      
      yearsWithData.forEach((year, index) => {
        const yearData = salesByYear[year];
        const numMeses = yearData.months.size;
        const mediaMenusal = numMeses > 0 ? yearData.total / numMeses : 0;
        
        // Calcular variações se há ano anterior
        let variacaoTotal: number | null = null;
        let variacaoMedia: number | null = null;
        
        if (index < yearsWithData.length - 1) {
          const previousYear = yearsWithData[index + 1];
          const previousYearData = salesByYear[previousYear];
          
          if (previousYearData && previousYearData.total > 0) {
            variacaoTotal = ((yearData.total - previousYearData.total) / previousYearData.total) * 100;
          }
          
          const previousMediaMensal = previousYearData.months.size > 0 ? previousYearData.total / previousYearData.months.size : 0;
          if (previousMediaMensal > 0) {
            variacaoMedia = ((mediaMenusal - previousMediaMensal) / previousMediaMensal) * 100;
          }
        }
        
        processedYearlyData.push({
          year: year,
          total: yearData.total,
          qtde_vendas: yearData.count,
          variacao_total: variacaoTotal,
          media_mensal: mediaMenusal,
          variacao_media: variacaoMedia,
          num_meses: numMeses
        });
      });

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
