
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SalesByServiceData {
  name: string;
  total_vendas?: number; // Quantidade total de vendas do ano
  [key: string]: any; // Para permitir propriedades dinâmicas dos serviços
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

  const fetchSalesByService = async () => {
    try {
      setIsLoading(true);
      console.log("Buscando dados de vendas por serviço agrupados por ano");
      
      // Buscar ano da primeira venda
      const firstYear = await fetchFirstSaleYear();
      if (!firstYear) {
        console.log("Não há vendas registradas");
        setSalesByServiceData([]);
        return [];
      }

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
        .not('data_venda', 'is', null)
        .gte('data_venda', `${firstYear}-01-01`); // Filtrar a partir do primeiro ano

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar vendas por serviço:", error);
        throw error;
      }

      console.log("Dados brutos de vendas por serviço:", data);

      // Agrupar por ano e serviço
      const yearServiceMap: Record<string, Record<string, number>> = {};
      const yearVendasCount: Record<string, number> = {}; // Contador de vendas por ano
      const servicesSet = new Set<string>();
      
      if (data) {
        data.forEach(orcamento => {
          const year = orcamento.data_venda.substring(0, 4);
          
          // Contar vendas por ano (uma vez por orçamento)
          yearVendasCount[year] = (yearVendasCount[year] || 0) + 1;
          
          orcamento.orcamentos_itens.forEach((item: any) => {
            if (item.valor > 0 && item.servicos) {
              const serviceName = item.servicos.nome;
              servicesSet.add(serviceName);
              
              if (!yearServiceMap[year]) {
                yearServiceMap[year] = {};
              }
              
              yearServiceMap[year][serviceName] = (yearServiceMap[year][serviceName] || 0) + Number(item.valor);
            }
          });
        });
      }

      // Converter para formato do gráfico empilhado
      const years = Object.keys(yearServiceMap).sort();
      const services = Array.from(servicesSet);
      
      const processedData = years.map(year => {
        // Criar objeto base com nome do ano
        const yearData: SalesByServiceData = { 
          name: year,
          total_vendas: yearVendasCount[year] || 0 // Adicionar quantidade de vendas
        };
        
        services.forEach(service => {
          yearData[service] = yearServiceMap[year][service] || 0;
        });
        
        return yearData;
      });

      console.log("Dados processados de vendas por serviço (por ano):", processedData);
      setSalesByServiceData(processedData);
      return processedData;
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
