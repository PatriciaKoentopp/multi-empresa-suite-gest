
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SalesByServiceData {
  name: string;
  [key: string]: any; // Para permitir propriedades dinâmicas dos anos
}

export const useSalesByService = () => {
  const { toast } = useToast();
  const [salesByServiceData, setSalesByServiceData] = useState<SalesByServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [firstSaleYear, setFirstSaleYear] = useState<number | null>(null);

  const fetchFirstSaleYear = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('data_venda')
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .not('data_venda', 'is', null)
        .order('data_venda', { ascending: true })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar primeira venda:", error);
        return null;
      }

      if (data && data.length > 0) {
        const year = parseInt(data[0].data_venda.substring(0, 4));
        setFirstSaleYear(year);
        return year;
      }

      return null;
    } catch (error) {
      console.error("Erro ao processar primeira venda:", error);
      return null;
    }
  };

  const fetchSalesByService = async (year?: number) => {
    try {
      setIsLoading(true);
      console.log("Buscando dados de vendas por serviço para o ano:", year || "todos");
      
      let query = supabase
        .from('orcamentos')
        .select(`
          data_venda,
          orcamentos_itens!inner(
            valor,
            servico_id,
            servicos!inner(nome)
          )
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .not('data_venda', 'is', null);

      // Filtrar por ano se especificado
      if (year) {
        query = query
          .gte('data_venda', `${year}-01-01`)
          .lte('data_venda', `${year}-12-31`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar vendas por serviço:", error);
        throw error;
      }

      console.log("Dados brutos de vendas por serviço:", data);

      if (year) {
        // Para um ano específico, retornar formato simples para gráfico de barras
        const serviceMap: Record<string, number> = {};
        
        if (data) {
          data.forEach(orcamento => {
            orcamento.orcamentos_itens.forEach((item: any) => {
              if (item.valor > 0 && item.servicos) {
                const serviceName = item.servicos.nome;
                serviceMap[serviceName] = (serviceMap[serviceName] || 0) + Number(item.valor);
              }
            });
          });
        }

        const processedData = Object.entries(serviceMap)
          .map(([name, value]) => ({
            name,
            value
          }))
          .sort((a, b) => b.value - a.value);

        console.log("Dados processados de vendas por serviço (ano específico):", processedData);
        setSalesByServiceData(processedData);
        return processedData;
      } else {
        // Para todos os anos, agrupar por serviço e ano
        const serviceYearMap: Record<string, Record<string, number>> = {};
        const yearsSet = new Set<string>();
        
        if (data) {
          data.forEach(orcamento => {
            const year = orcamento.data_venda.substring(0, 4);
            yearsSet.add(year);
            
            orcamento.orcamentos_itens.forEach((item: any) => {
              if (item.valor > 0 && item.servicos) {
                const serviceName = item.servicos.nome;
                
                if (!serviceYearMap[serviceName]) {
                  serviceYearMap[serviceName] = {};
                }
                
                serviceYearMap[serviceName][year] = (serviceYearMap[serviceName][year] || 0) + Number(item.valor);
              }
            });
          });
        }

        // Converter para formato do gráfico empilhado
        const years = Array.from(yearsSet).sort();
        const processedData = Object.entries(serviceYearMap).map(([serviceName, yearValues]) => {
          const serviceData: SalesByServiceData = { name: serviceName };
          
          years.forEach(year => {
            serviceData[year] = yearValues[year] || 0;
          });
          
          return serviceData;
        }).sort((a, b) => {
          // Ordenar por total de vendas (soma de todos os anos)
          const totalA = years.reduce((sum, year) => sum + (a[year] || 0), 0);
          const totalB = years.reduce((sum, year) => sum + (b[year] || 0), 0);
          return totalB - totalA;
        });

        console.log("Dados processados de vendas por serviço (todos os anos):", processedData);
        setSalesByServiceData(processedData);
        return processedData;
      }
    } catch (error: any) {
      console.error("Erro ao processar dados de vendas por serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar vendas por serviço",
        description: error.message || "Não foi possível carregar os dados de vendas por serviço"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    salesByServiceData,
    fetchSalesByService,
    fetchFirstSaleYear,
    firstSaleYear,
    isLoading
  };
};
