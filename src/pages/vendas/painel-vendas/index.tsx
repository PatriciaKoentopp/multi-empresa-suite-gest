
import { useEffect, useState } from "react";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { SalesBarChart } from "@/components/vendas/SalesBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { YearlyComparison, MonthlyComparison } from "@/types";

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  clientes_ativos: number;
}

// Componente para exibir a variação com seta e cor
const VariationDisplay = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="text-gray-400">-</span>;
  
  const isPositive = value > 0;
  const color = isPositive ? "text-green-600" : "text-red-500";
  const Icon = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div className={`flex items-center justify-end gap-1 ${color} font-medium`}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  );
};

const PainelVendasPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<MonthlyComparison[]>([]);
  const [yearlyComparisonData, setYearlyComparisonData] = useState<YearlyComparison[]>([]);

  useEffect(() => {
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

        // Primeiro, extraímos todos os meses únicos dos dados
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
        
        yearsSorted.forEach((yearData, index) => {
          // Calcular média mensal
          const numMonths = yearData.months.length;
          yearData.mediaMensal = numMonths > 0 ? yearData.total / numMonths : 0;
          
          if (index < yearsSorted.length - 1) {
            const prevYearTotal = yearsSorted[index + 1].total;
            const prevYearMedia = yearsSorted[index + 1].mediaMensal || 0;
            
            // Variação do total anual
            if (prevYearTotal > 0 && yearData.total > 0) {
              yearData.yearlyVariation = ((yearData.total - prevYearTotal) / prevYearTotal) * 100;
            }
            
            // Correção do cálculo da variação da média mensal
            // Verificamos se os valores das médias são válidos antes de calcular
            if (prevYearMedia > 0 && yearData.mediaMensal > 0) {
              yearData.mediaVariacao = ((yearData.mediaMensal - prevYearMedia) / prevYearMedia) * 100;
            } else {
              yearData.mediaVariacao = null; // Se não for possível calcular, usamos null
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

    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full py-24">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Carregando dados de vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel de Vendas</h2>
        <p className="text-muted-foreground">
          Visão geral dos dados de vendas atualizados até {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
        </p>
      </div>

      {/* Cards com estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SalesDashboardCard
          title="Total de Vendas no Ano"
          value={formatCurrency(salesData?.total_vendas || 0)}
          description="Total acumulado no ano"
          icon="money"
        />
        <SalesDashboardCard
          title={`Vendas (${format(new Date(), 'MMMM', { locale: ptBR })})`}
          value={formatCurrency(salesData?.vendas_mes_atual || 0)}
          description={`vs. ${formatCurrency(salesData?.vendas_mes_anterior || 0)} mês anterior`}
          trend={salesData?.variacao_percentual && salesData.variacao_percentual > 0 ? "up" : "down"}
          trendValue={`${Math.abs(salesData?.variacao_percentual || 0).toFixed(1)}%`}
          icon="chart"
        />
        <SalesDashboardCard
          title="Ticket Médio"
          value={formatCurrency(salesData?.media_ticket || 0)}
          description="Por venda realizada"
          icon="sales"
        />
        <SalesDashboardCard
          title="Clientes Ativos"
          value={String(salesData?.clientes_ativos || 0)}
          description="Com vendas nos últimos 90 dias"
          icon="users"
        />
      </div>

      {/* Gráficos de desempenho de vendas com abas */}
      <div className="space-y-4">
        <Tabs defaultValue="monthly">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Desempenho de Vendas</h3>
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
              <TabsTrigger value="yearly">Anual</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesBarChart data={barChartData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="quarterly">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Trimestre</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesBarChart data={quarterlyChartData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesBarChart data={yearlyChartData} isYearly={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Tabela de Comparativo de Vendas com melhor UI/UX */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Comparativo de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[130px] text-left">Período</TableHead>
                  <TableHead className="text-right w-[170px]">Total de Vendas</TableHead>
                  <TableHead className="text-right w-[100px]">Variação</TableHead>
                  <TableHead className="text-right w-[170px]">Média Mensal</TableHead>
                  <TableHead className="text-right w-[100px]">Variação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyComparisonData.map((yearData) => (
                  <Accordion type="single" collapsible key={yearData.year}>
                    <AccordionItem value={`year-${yearData.year}`} className="border-0">
                      <TableRow className={yearData.year % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                        <TableCell className="py-0 pl-4">
                          <AccordionTrigger className="py-4 hover:no-underline font-semibold">
                            <span>{yearData.year}</span>
                          </AccordionTrigger>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(yearData.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {yearData.yearlyVariation !== null && (
                            <VariationDisplay value={yearData.yearlyVariation} />
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(yearData.mediaMensal || 0)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {yearData.mediaVariacao !== null && (
                            <VariationDisplay value={yearData.mediaVariacao} />
                          )}
                        </TableCell>
                      </TableRow>
                      <AccordionContent>
                        <div className="pl-4 pr-2 pb-2 bg-muted/5">
                          <Table>
                            <TableHeader className="bg-muted/20">
                              <TableRow className="border-0">
                                <TableHead className="pl-6 py-2 font-medium text-left">Mês</TableHead>
                                <TableHead className="text-right py-2 font-medium w-[170px]">Total de Vendas</TableHead>
                                <TableHead className="text-right py-2 font-medium w-[100px]">Var. Mensal</TableHead>
                                <TableHead className="text-right py-2 font-medium pr-6 w-[100px]">Var. Anual</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {yearData.months.map((monthData, index) => (
                                <TableRow 
                                  key={`${yearData.year}-${monthData.month}`} 
                                  className={`border-0 ${index % 2 === 0 ? "bg-white/40" : "bg-muted/10"} hover:bg-muted/20`}
                                >
                                  <TableCell className="py-3 pl-6">
                                    <span className="font-medium capitalize">{monthData.month}</span>
                                  </TableCell>
                                  <TableCell className="text-right py-3">
                                    {formatCurrency(monthData.total)}
                                  </TableCell>
                                  <TableCell className="text-right py-3">
                                    <VariationDisplay value={monthData.monthlyVariation} />
                                  </TableCell>
                                  <TableCell className="text-right py-3 pr-6">
                                    <VariationDisplay value={monthData.yearlyVariation} />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PainelVendasPage;
