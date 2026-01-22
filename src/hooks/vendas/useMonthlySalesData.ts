
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMonthlySalesData = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const fetchMonthlySalesData = async (year: number) => {
    try {
      setIsLoading(true);
      console.log(`Buscando dados mensais para o ano ${year}`);
      
      // Buscar dados mensais do ano atual
      const { data: currentYearData, error: currentError } = await supabase
        .rpc('get_monthly_sales_chart_data', { year_param: year });

      if (currentError) {
        console.error(`Erro ao buscar dados mensais de ${year}:`, currentError);
        throw currentError;
      }

      // Buscar dados mensais do ano anterior para comparação
      const { data: previousYearData, error: previousError } = await supabase
        .rpc('get_monthly_sales_chart_data', { year_param: year - 1 });

      if (previousError) {
        console.error(`Erro ao buscar dados mensais de ${year - 1}:`, previousError);
        // Se não há dados do ano anterior, continuar sem comparação
      }

      console.log(`Dados mensais ${year}:`, currentYearData);
      console.log(`Dados mensais ${year - 1}:`, previousYearData);

      // Criar mapa dos dados do ano anterior para facilitar comparação
      const previousYearMap = new Map();
      if (previousYearData) {
        previousYearData.forEach((item: any) => {
          previousYearMap.set(item.name, item.faturado);
        });
      }

      // Buscar dados de quantidade de vendas para o ano atual
      const { data: orcamentosCurrentYear, error: orcamentosError } = await supabase
        .from('orcamentos')
        .select(`
          id, 
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', `${year}-01-01`)
        .lte('data_venda', `${year}-12-31`);

      if (orcamentosError) {
        console.error(`Erro ao buscar orçamentos de ${year}:`, orcamentosError);
        throw orcamentosError;
      }

      // Processar dados com variações e quantidade
      const processedData = currentYearData?.map((currentMonth: any, index: number) => {
        const previousMonthValue = previousYearMap.get(currentMonth.name) || 0;
        const currentValue = currentMonth.faturado || 0;
        
        // Calcular variação percentual em relação ao ano anterior
        let variacao_ano_anterior = null;
        if (previousMonthValue > 0) {
          variacao_ano_anterior = ((currentValue - previousMonthValue) / previousMonthValue) * 100;
        } else if (currentValue > 0) {
          variacao_ano_anterior = 100; // Se não havia venda no ano anterior e agora há, é 100% de crescimento
        }

        // Calcular variação percentual em relação ao mês anterior
        let variacao_percentual = null;
        
        if (index === 0) {
          // Para Janeiro, comparar com Dezembro do ano anterior
          const dezembroAnterior = previousYearMap.get('Dezembro') || 0;
          if (dezembroAnterior > 0) {
            variacao_percentual = ((currentValue - dezembroAnterior) / dezembroAnterior) * 100;
          } else if (currentValue > 0) {
            variacao_percentual = 100; // Se não havia venda em dezembro e agora há em janeiro
          }
        } else if (currentYearData[index - 1]) {
          // Para os demais meses, comparar com o mês anterior do mesmo ano
          const previousValue = currentYearData[index - 1].faturado || 0;
          if (previousValue > 0) {
            variacao_percentual = ((currentValue - previousValue) / previousValue) * 100;
          } else if (currentValue > 0) {
            variacao_percentual = 100;
          }
        }

        // Calcular quantidade de vendas para este mês usando substring para extrair o mês
        const mesNumero = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
                          .indexOf(currentMonth.name) + 1;

        let qtde_vendas = 0;
        if (orcamentosCurrentYear) {
          orcamentosCurrentYear.forEach(orcamento => {
            if (orcamento.data_venda) {
              // Usar substring para extrair mês da data (formato YYYY-MM-DD) - mesma lógica do hook anual
              const mesVenda = parseInt(orcamento.data_venda.substring(5, 7), 10);
              
              if (mesVenda === mesNumero) {
                // Verificar se tem itens com valor > 0 (mesma lógica do hook anual)
                const temValor = orcamento.orcamentos_itens.some((item: any) => 
                  Number(item.valor) > 0
                );
                if (temValor) {
                  qtde_vendas++;
                }
              }
            }
          });
        }

        return {
          name: currentMonth.name,
          faturado: currentValue,
          qtde_vendas,
          variacao_percentual,
          variacao_ano_anterior
        };
      }) || [];

      console.log(`Dados mensais processados para ${year}:`, processedData);
      return processedData;

    } catch (error: any) {
      console.error(`Erro ao buscar dados mensais de ${year}:`, error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados mensais",
        description: error.message || `Não foi possível carregar os dados mensais de ${year}`
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchMonthlySalesData,
    isLoading
  };
};
