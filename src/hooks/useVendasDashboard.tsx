
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { YearlyComparison } from "@/types";

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  clientes_ativos: number;
}

// Função auxiliar para formatar dados do gráfico
const formatChartData = (data: any[] | null) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  return data.map((item) => ({
    name: String(item.name || ''),
    faturado: Number(item.faturado || 0)
  }));
};

export const useVendasDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Formato de data correto para o Supabase: YYYY-MM-DD
      const currentYear = new Date().getFullYear();
      
      // Buscar dados de comparação anual - Função corrigida
      console.log("Iniciando busca de dados de comparação anual");
      const { data: yearComparisonData, error: comparisonError } = await supabase
        .rpc('get_yearly_sales_comparison');

      if (comparisonError) {
        console.error("Erro ao buscar comparação anual:", comparisonError);
        throw comparisonError;
      }
      
      console.log("Dados de comparação anual brutos:", yearComparisonData);
      
      // Garantir que todos os campos numéricos sejam números e não nulos
      const processedYearlyData = Array.isArray(yearComparisonData) ? yearComparisonData.map((item: any) => ({
        year: Number(item.year || 0),
        total: Number(item.total || 0),
        variacao_total: item.variacao_total !== null ? Number(item.variacao_total) : null,
        media_mensal: Number(item.media_mensal || 0),
        variacao_media: item.variacao_media !== null ? Number(item.variacao_media) : null,
        num_meses: Number(item.num_meses || 0)
      })) : [];

      console.log("Dados de comparação anual processados:", processedYearlyData);
      setYearlyComparisonData(processedYearlyData);
      
      // Definir datas para mês atual e anterior
      const startCurrentMonth = startOfMonth(new Date());
      const endCurrentMonth = endOfMonth(new Date());
      
      const startCurrentMonthFormatted = format(startCurrentMonth, 'yyyy-MM-dd');
      const endCurrentMonthFormatted = format(endCurrentMonth, 'yyyy-MM-dd');
      
      // Buscar vendas do mês atual - usando formato de data e operadores corretos
      const { data: currentMonthData, error: currentMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startCurrentMonthFormatted)
        .lte('data_venda', endCurrentMonthFormatted);

      if (currentMonthError) throw currentMonthError;

      const vendasMesAtual = currentMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      // Buscar vendas do mês anterior - usando formato de data e operadores corretos
      const startLastMonth = startOfMonth(subMonths(new Date(), 1));
      const endLastMonth = endOfMonth(subMonths(new Date(), 1));
      
      const startLastMonthFormatted = format(startLastMonth, 'yyyy-MM-dd');
      const endLastMonthFormatted = format(endLastMonth, 'yyyy-MM-dd');
      
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startLastMonthFormatted)
        .lte('data_venda', endLastMonthFormatted);

      if (lastMonthError) throw lastMonthError;

      const vendasMesAnterior = lastMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;

      // Calcular variação percentual
      const variacaoPercentual = vendasMesAnterior === 0 ? 100 : ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;

      // Buscar total anual de vendas do ano atual - usando formato de data correto com datas específicas
      const startOfYear = format(new Date(currentYear, 0, 1), 'yyyy-MM-dd');
      const endOfYear = format(new Date(currentYear, 11, 31), 'yyyy-MM-dd');
      
      const { data: totalAnualData, error: totalAnualError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', startOfYear)
        .lte('data_venda', endOfYear);

      if (totalAnualError) throw totalAnualError;

      const totalVendas = totalAnualData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      // Buscar média de ticket - últimos 90 dias
      const ninetyDaysAgo = subDays(new Date(), 90);
      const ninetyDaysAgoFormatted = format(ninetyDaysAgo, 'yyyy-MM-dd');

      const { data: ticketData, error: ticketError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', ninetyDaysAgoFormatted);

      if (ticketError) throw ticketError;

      const totalVendasPeriodo = ticketData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;

      const mediaTicket = ticketData?.length ? totalVendasPeriodo / ticketData.length : 0;
      
      // Buscar clientes ativos (com vendas nos últimos 90 dias)
      const { data: clientesData, error: clientesError } = await supabase
        .from('orcamentos')
        .select('favorecido_id')
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', ninetyDaysAgoFormatted);

      if (clientesError) throw clientesError;
      
      // Contar clientes únicos
      const clientesUnicos = new Set();
      clientesData?.forEach(orcamento => {
        if (orcamento.favorecido_id) {
          clientesUnicos.add(orcamento.favorecido_id);
        }
      });
      
      const clientesAtivos = clientesUnicos.size;

      setSalesData({
        total_vendas: totalVendas,
        vendas_mes_atual: vendasMesAtual,
        vendas_mes_anterior: vendasMesAnterior,
        variacao_percentual: variacaoPercentual,
        media_ticket: mediaTicket,
        clientes_ativos: clientesAtivos
      });

      // Buscar dados para o gráfico de barras (vendas mensais)
      // AQUI ESTÁ O PROBLEMA - Vamos usar uma SQL Query direta em vez de RPC
      try {
        console.log("Iniciando busca de dados para gráfico de barras mensais");
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', `${currentYear}-01-01`)
          .lte('data_venda', `${currentYear}-12-31`);
  
        if (monthlyError) {
          console.error("Erro ao buscar dados mensais:", monthlyError);
          throw monthlyError;
        }
  
        // Processar dados mensais manualmente
        const monthlyResults = Array(12).fill(0).map((_, i) => ({
          name: format(new Date(currentYear, i, 1), 'MMM', { locale: require('date-fns/locale/pt-BR') }),
          faturado: 0
        }));
  
        monthlyData?.forEach(orcamento => {
          if (orcamento.data_venda) {
            const dataVenda = new Date(orcamento.data_venda);
            const mes = dataVenda.getMonth();
            
            const orcamentoTotal = orcamento.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            
            monthlyResults[mes].faturado += orcamentoTotal;
          }
        });
  
        console.log("Dados mensais processados:", monthlyResults);
        setBarChartData(monthlyResults);
      } catch (monthlyError) {
        console.error("Erro ao processar dados mensais:", monthlyError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados mensais",
          description: "Não foi possível processar os dados mensais"
        });
      }

      // Buscar dados para gráficos trimestrais
      try {
        console.log("Iniciando busca de dados trimestrais");
        
        // Processar dados trimestrais manualmente a partir dos dados mensais
        const quarterlyResults = [
          { name: '1º Trimestre', faturado: 0 },
          { name: '2º Trimestre', faturado: 0 },
          { name: '3º Trimestre', faturado: 0 },
          { name: '4º Trimestre', faturado: 0 }
        ];
        
        // Usar os dados mensais já calculados para agregar em trimestres
        if (Array.isArray(monthlyResults)) {
          for (let i = 0; i < 12; i++) {
            const trimestre = Math.floor(i / 3);
            quarterlyResults[trimestre].faturado += monthlyResults[i].faturado;
          }
        }
        
        console.log("Dados trimestrais processados:", quarterlyResults);
        setQuarterlyChartData(quarterlyResults);
      } catch (quarterlyError) {
        console.error("Erro ao processar dados trimestrais:", quarterlyError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados trimestrais",
          description: "Não foi possível processar os dados trimestrais"
        });
      }

      // Buscar dados para gráficos anuais
      try {
        console.log("Iniciando busca de dados anuais");
        
        // Vamos buscar dados dos últimos 3 anos
        const yearsToShow = 3;
        const currentYear = new Date().getFullYear();
        const yearlyResults = [];
        
        // Buscar vendas por ano para os últimos 3 anos
        for (let i = 0; i < yearsToShow; i++) {
          const year = currentYear - i;
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          
          const { data: yearData, error: yearError } = await supabase
            .from('orcamentos')
            .select(`
              id,
              data_venda,
              orcamentos_itens (valor)
            `)
            .eq('tipo', 'venda')
            .eq('status', 'ativo')
            .gte('data_venda', startDate)
            .lte('data_venda', endDate);
          
          if (yearError) throw yearError;
          
          const totalYearSales = yearData?.reduce((acc, orcamento) => {
            const orcamentoTotal = orcamento.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            return acc + orcamentoTotal;
          }, 0) || 0;
          
          yearlyResults.push({
            name: year.toString(),
            faturado: totalYearSales
          });
        }
        
        console.log("Dados anuais processados:", yearlyResults);
        setYearlyChartData(yearlyResults);
      } catch (yearlyError) {
        console.error("Erro ao processar dados anuais:", yearlyError);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados anuais",
          description: "Não foi possível processar os dados anuais"
        });
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message || "Não foi possível carregar os dados de vendas"
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData
  };
};
