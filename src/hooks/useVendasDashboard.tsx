
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthlyComparison, YearlyComparison } from "@/types";

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
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<MonthlyComparison[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log("Iniciando busca de dados");
      
      // Buscar total de vendas do ano
      const currentYear = new Date().getFullYear();
      console.log("Ano atual:", currentYear);

      // Formato de data correto para o Supabase: YYYY-MM-DD
      const startYearDate = `${currentYear}-01-01`;
      const endYearDate = `${currentYear}-12-31`;
      console.log("Período do ano:", startYearDate, "até", endYearDate);

      const { data: yearData, error: yearError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
        .gte('data_venda', startYearDate)
        .lte('data_venda', endYearDate);

      if (yearError) throw yearError;
      console.log("Dados do ano:", yearData);

      // Calcular total de vendas do ano
      const totalVendas = yearData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      console.log("Total de vendas do ano:", totalVendas);

      // Buscar dados para comparativo mensal desde 2023
      const start2023 = '2023-01-01';
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: salesHistoryData, error: salesHistoryError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo')
        .gte('data_venda', start2023)
        .lte('data_venda', today);

      if (salesHistoryError) throw salesHistoryError;
      console.log("Dados históricos de vendas:", salesHistoryData);

      // Processar dados para comparativo mensal
      const monthlyComparisonMap: Record<string, { total: number, date: Date }> = {};

      salesHistoryData?.forEach(orcamento => {
        if (orcamento.data_venda) {
          // Verificar se há uma data de venda válida
          if (!orcamento.data_venda) {
            console.warn("Data de venda ausente");
            return; // Pular este orçamento
          }
          
          try {
            // Extrair o ano e mês diretamente da string de data no formato YYYY-MM-DD
            // Isso evita problemas de timezone
            const [year, month] = orcamento.data_venda.split('-').map(Number);
            
            if (!year || !month) {
              console.warn("Formato de data inválido:", orcamento.data_venda);
              return; // Pular este orçamento
            }
            
            // Criar chave para o mapa no formato YYYY-MM
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
            
            // Criar data para ordenação (sem converter timezone)
            const sortDate = new Date(year, month - 1, 1); // Mês em JavaScript é 0-indexed
            
            if (!monthlyComparisonMap[monthKey]) {
              monthlyComparisonMap[monthKey] = { 
                total: 0,
                date: sortDate
              };
            }
            
            // Calcular o total dos itens do orçamento
            const total = orcamento.orcamentos_itens.reduce(
              (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
            );
            
            monthlyComparisonMap[monthKey].total += total;
            
          } catch (error) {
            console.error("Erro ao processar data:", orcamento.data_venda, error);
          }
        }
      });
      
      // Verificar se há alguma anomalia nos dados (meses futuros, etc)
      const currentDate = new Date();
      const currentYear_month = currentDate.getFullYear();
      const currentMonth_month = currentDate.getMonth() + 1; // getMonth é 0-indexed
      const currentMonthKey = `${currentYear_month}-${currentMonth_month.toString().padStart(2, '0')}`;
      
      // Filtrar meses futuros (não deveriam ter dados)
      Object.keys(monthlyComparisonMap).forEach(key => {
        const [yearStr, monthStr] = key.split('-').map(Number);
        const year = Number(yearStr);
        const month = Number(monthStr);
        
        // Verificar se é um mês futuro
        if (year > currentYear_month || (year === currentYear_month && month > currentMonth_month)) {
          console.warn(`Detectado dados para um período futuro: ${key}. Verificando valores.`);
          
          // Verificar se os dados são reais ou erros
          if (monthlyComparisonMap[key].total > 0) {
            console.warn(`Dados para período futuro ${key} com total ${monthlyComparisonMap[key].total}. Excluindo.`);
            delete monthlyComparisonMap[key];
          }
        }
      });
      
      // Calcular variações e formatar dados para a tabela
      const sortedMonths = Object.entries(monthlyComparisonMap)
        .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
        .map(([key, data], index, array) => {
          // Extrair ano e mês do key (yyyy-MM)
          const [year, month] = key.split('-').map(Number);
          
          // Formatar nome do mês diretamente do número do mês
          // Usamos new Date(year, month-1) para criar a data correta
          const monthName = format(new Date(year, month - 1, 1), 'MMMM', { locale: ptBR });
          
          // Calcular variação mensal (comparado com o mês anterior)
          let monthlyVariation: number | null = null;
          if (index < array.length - 1) {
            const prevMonthTotal = array[index + 1][1].total;
            if (prevMonthTotal > 0 && data.total > 0) {
              monthlyVariation = ((data.total - prevMonthTotal) / prevMonthTotal) * 100;
            }
          }
          
          // Calcular variação anual (mesmo mês do ano anterior)
          let yearlyVariation: number | null = null;
          const lastYearMonthKey = `${year - 1}-${month.toString().padStart(2, '0')}`;
          
          if (monthlyComparisonMap[lastYearMonthKey]) {
            const lastYearTotal = monthlyComparisonMap[lastYearMonthKey].total;
            
            if (lastYearTotal > 0 && data.total > 0) {
              yearlyVariation = ((data.total - lastYearTotal) / lastYearTotal) * 100;
            }
          }
          
          return {
            month: monthName,
            year,
            total: data.total,
            monthlyVariation,
            yearlyVariation,
            sortDate: data.date
          };
        });
        
      setMonthlyComparisonData(sortedMonths);
      
      // Agrupar dados mensais por ano para a nova visualização
      const yearlyDataComparison: Record<number, YearlyComparison> = {};
      
      sortedMonths.forEach(monthData => {
        if (!yearlyDataComparison[monthData.year]) {
          yearlyDataComparison[monthData.year] = {
            year: monthData.year,
            total: 0,
            yearlyVariation: null,
            months: [],
            mediaMensal: 0,
            mediaVariacao: null
          };
        }
        
        yearlyDataComparison[monthData.year].total += monthData.total;
        yearlyDataComparison[monthData.year].months.push(monthData);
      });
      
      // Calcular variação entre anos e média mensal
      const yearsSorted = Object.values(yearlyDataComparison).sort((a, b) => b.year - a.year);
      
      yearsSorted.forEach((yearData, index, array) => {
        // Calcular média mensal
        const numMonths = yearData.months.length;
        yearData.mediaMensal = numMonths > 0 ? yearData.total / numMonths : 0;
        
        // Verifica se há um ano anterior para comparar
        if (index < array.length - 1) {
          const prevYearData = array[index + 1];
          const prevYearTotal = prevYearData.total;
          const prevYearMedia = prevYearData.mediaMensal;
          
          // Cálculo da variação do total anual
          if (prevYearTotal > 0) {
            yearData.yearlyVariation = ((yearData.total - prevYearTotal) / prevYearTotal) * 100;
          }
          
          // Cálculo da variação da média mensal
          if (prevYearMedia > 0) {
            yearData.mediaVariacao = ((yearData.mediaMensal - prevYearMedia) / prevYearMedia) * 100;
          }
        }
        
        // Ordenar os meses dentro de cada ano do mais recente para o mais antigo
        yearData.months.sort((a, b) => {
          // Extrair mês numérico do nome do mês
          const monthsOrder = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                              'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
          const monthA = monthsOrder.findIndex(m => m.startsWith(a.month.toLowerCase()));
          const monthB = monthsOrder.findIndex(m => m.startsWith(b.month.toLowerCase()));
          return monthB - monthA; // Ordem decrescente
        });
      });
      
      setYearlyComparisonData(yearsSorted);

      // Definir datas para mês atual e anterior
      const startCurrentMonth = startOfMonth(new Date());
      const endCurrentMonth = endOfMonth(new Date());
      
      const startCurrentMonthFormatted = format(startCurrentMonth, 'yyyy-MM-dd');
      const endCurrentMonthFormatted = format(endCurrentMonth, 'yyyy-MM-dd');
      
      console.log("Período mês atual:", startCurrentMonthFormatted, "até", endCurrentMonthFormatted);
      
      const { data: currentMonthData, error: currentMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
        .gte('data_venda', startCurrentMonthFormatted)
        .lte('data_venda', endCurrentMonthFormatted);

      if (currentMonthError) throw currentMonthError;
      console.log("Dados do mês atual:", currentMonthData);

      const vendasMesAtual = currentMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      console.log("Vendas mês atual:", vendasMesAtual);

      // Buscar vendas do mês anterior - usando formato de data correto
      const startLastMonth = startOfMonth(subMonths(new Date(), 1));
      const endLastMonth = endOfMonth(subMonths(new Date(), 1));
      
      const startLastMonthFormatted = format(startLastMonth, 'yyyy-MM-dd');
      const endLastMonthFormatted = format(endLastMonth, 'yyyy-MM-dd');
      
      console.log("Período mês anterior:", startLastMonthFormatted, "até", endLastMonthFormatted);
      
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
        .gte('data_venda', startLastMonthFormatted)
        .lte('data_venda', endLastMonthFormatted);

      if (lastMonthError) throw lastMonthError;
      console.log("Dados do mês anterior:", lastMonthData);

      const vendasMesAnterior = lastMonthData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;
      
      console.log("Vendas mês anterior:", vendasMesAnterior);

      // Calcular variação percentual
      const variacaoPercentual = vendasMesAnterior === 0 ? 100 : ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;

      // Buscar média de ticket - usando formato de data correto para os últimos 90 dias
      const ninetyDaysAgo = subDays(new Date(), 90);
      const ninetyDaysAgoFormatted = format(ninetyDaysAgo, 'yyyy-MM-dd');
      console.log("90 dias atrás:", ninetyDaysAgoFormatted);

      const { data: ticketData, error: ticketError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
        .gte('data_venda', ninetyDaysAgoFormatted);

      if (ticketError) throw ticketError;
      console.log("Dados para cálculo de ticket médio:", ticketData);

      const totalVendasPeriodo = ticketData?.reduce((acc, orcamento) => {
        const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        return acc + orcamentoTotal;
      }, 0) || 0;

      const mediaTicket = ticketData?.length ? totalVendasPeriodo / ticketData.length : 0;
      
      console.log("Média de ticket:", mediaTicket, "com", ticketData?.length || 0, "vendas");

      // Buscar clientes ativos (com vendas nos últimos 90 dias)
      const { data: clientesData, error: clientesError } = await supabase
        .from('orcamentos')
        .select('favorecido_id')
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
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
      console.log("Clientes ativos:", clientesAtivos);

      setSalesData({
        total_vendas: totalVendas,
        vendas_mes_atual: vendasMesAtual,
        vendas_mes_anterior: vendasMesAnterior,
        variacao_percentual: variacaoPercentual,
        media_ticket: mediaTicket,
        clientes_ativos: clientesAtivos
      });

      // Buscar dados para o gráfico de barras (vendas mensais)
      const { data: chartMonthlyData, error: chartMonthlyError } = await supabase
        .from('orcamentos')
        .select(`
          data_venda,
          orcamentos_itens (valor)
        `)
        .eq('tipo', 'venda')
        .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
        .gte('data_venda', startYearDate)
        .order('data_venda');

      if (chartMonthlyError) throw chartMonthlyError;
      console.log("Dados mensais para gráfico:", chartMonthlyData);

      const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = chartMonthlyData?.filter(
          (item) => {
            if (!item.data_venda) return false;
            
            // Extrair mês diretamente da string de data
            const monthFromDate = Number(item.data_venda.split('-')[1]);
            return monthFromDate === month;
          }
        );
        
        const faturado = monthData?.reduce((acc, orcamento) => {
          return acc + orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        }, 0) || 0;

        return {
          name: format(new Date(currentYear, i), 'MMM', { locale: ptBR }),
          faturado
        };
      });

      setBarChartData(monthlyChartData);
      console.log("Dados do gráfico de barras processados:", monthlyChartData);

      // Buscar dados para gráficos trimestrais
      // Define os intervalos para cada trimestre do ano atual
      const quarters = [
        { start: `${currentYear}-01-01`, end: `${currentYear}-03-31`, name: 'T1' },
        { start: `${currentYear}-04-01`, end: `${currentYear}-06-30`, name: 'T2' },
        { start: `${currentYear}-07-01`, end: `${currentYear}-09-30`, name: 'T3' },
        { start: `${currentYear}-10-01`, end: `${currentYear}-12-31`, name: 'T4' }
      ];

      const quarterlyData = [];

      for (const quarter of quarters) {
        const { data: qData, error: qError } = await supabase
          .from('orcamentos')
          .select(`
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
          .gte('data_venda', quarter.start)
          .lte('data_venda', quarter.end);

        if (qError) throw qError;

        const faturado = qData?.reduce((acc, orcamento) => {
          return acc + orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        }, 0) || 0;

        quarterlyData.push({
          name: quarter.name,
          faturado
        });
      }

      setQuarterlyChartData(quarterlyData);
      console.log("Dados do gráfico trimestral processados:", quarterlyData);

      // Buscar dados para gráficos anuais
      const chartYearlyData = [];
      const currentYearNum = currentYear;
      
      for (let i = 3; i >= 0; i--) {
        const year = currentYearNum - i;
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;

        const { data: yData, error: yError } = await supabase
          .from('orcamentos')
          .select(`
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo') // Garantir que apenas vendas ativas sejam contabilizadas
          .gte('data_venda', yearStart)
          .lte('data_venda', yearEnd);

        if (yError) throw yError;

        const faturado = yData?.reduce((acc, orcamento) => {
          return acc + orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
        }, 0) || 0;

        chartYearlyData.push({
          name: year.toString(),
          faturado
        });
      }

      setYearlyChartData(chartYearlyData);
      console.log("Dados do gráfico anual processados:", chartYearlyData);

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
    monthlyComparisonData,
    yearlyComparisonData
  };
};
