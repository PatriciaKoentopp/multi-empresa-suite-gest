
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  clientes_ativos: number;
}

export const useVendasDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Formato de data correto para o Supabase: YYYY-MM-DD
      const currentYear = new Date().getFullYear();
      
      // Buscar dados de comparação anual diretamente do Supabase usando a função criada
      const { data: yearlyComparisonData, error: comparisonError } = await supabase
        .rpc('get_yearly_sales_comparison');

      if (comparisonError) throw comparisonError;
      console.log("Dados de comparação anual:", yearlyComparisonData);
      setYearlyComparisonData(yearlyComparisonData);
      
      // Definir datas para mês atual e anterior
      const startCurrentMonth = startOfMonth(new Date());
      const endCurrentMonth = endOfMonth(new Date());
      
      const startCurrentMonthFormatted = format(startCurrentMonth, 'yyyy-MM-dd');
      const endCurrentMonthFormatted = format(endCurrentMonth, 'yyyy-MM-dd');
      
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
      
      // Buscar vendas do mês anterior - usando formato de data correto
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

      // Buscar total anual de vendas do ano atual
      const { data: totalAnualData, error: totalAnualError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .like('data_venda', `${currentYear}-%`);

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

      // Buscar dados para o gráfico de barras (vendas mensais) usando a função Supabase
      const { data: monthlyChartData, error: monthlyChartError } = await supabase
        .rpc('get_monthly_sales_chart_data', {
          year_param: currentYear
        });

      if (monthlyChartError) throw monthlyChartError;
      console.log("Dados mensais:", monthlyChartData);
      setBarChartData(monthlyChartData);

      // Buscar dados para gráficos trimestrais usando a função Supabase
      const { data: quarterlyData, error: quarterlyError } = await supabase
        .rpc('get_quarterly_sales_data', {
          year_param: currentYear
        });

      if (quarterlyError) throw quarterlyError;
      console.log("Dados trimestrais:", quarterlyData);
      setQuarterlyChartData(quarterlyData);

      // Buscar dados para gráficos anuais usando a função Supabase
      const { data: yearlyData, error: yearlyError } = await supabase
        .rpc('get_yearly_sales_data');

      if (yearlyError) throw yearlyError;
      console.log("Dados anuais:", yearlyData);
      setYearlyChartData(yearlyData);

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
