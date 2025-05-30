
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

      // Processar dados com variações
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
        if (index > 0 && currentYearData[index - 1]) {
          const previousValue = currentYearData[index - 1].faturado || 0;
          if (previousValue > 0) {
            variacao_percentual = ((currentValue - previousValue) / previousValue) * 100;
          } else if (currentValue > 0) {
            variacao_percentual = 100;
          }
        }

        return {
          name: currentMonth.name,
          faturado: currentValue,
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
