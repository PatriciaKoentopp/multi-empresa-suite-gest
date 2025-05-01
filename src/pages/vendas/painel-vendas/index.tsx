
import { useEffect, useState } from "react";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { SalesBarChart } from "@/components/vendas/SalesBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears, getYear } from "date-fns";
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

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  clientes_ativos: number;
}

interface MonthlyComparison {
  month: string; // Nome do mês
  year: number; // Ano
  total: number; // Total de vendas
  monthlyVariation: number | null; // Variação percentual mensal
  yearlyVariation: number | null; // Variação percentual anual
  sortDate: Date; // Data para ordenação
}

const PainelVendasPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<MonthlyComparison[]>([]);

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
          .eq('status', 'ativo')
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

        // Buscar dados para comparativo mensal dos últimos 12 meses
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const lastYearFormatted = format(lastYear, 'yyyy-MM-dd');

        const { data: lastTwelveMonthsData, error: lastTwelveMonthsError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', lastYearFormatted);

        if (lastTwelveMonthsError) throw lastTwelveMonthsError;
        console.log("Dados dos últimos 12 meses:", lastTwelveMonthsData);

        // Processar dados para comparativo mensal
        const monthlyData: { [key: string]: { total: number, date: Date } } = {};
        const currentDate = new Date();
        
        // Inicializar os últimos 12 meses com valores zero
        for (let i = 0; i < 12; i++) {
          const date = subMonths(currentDate, i);
          const monthKey = format(date, 'yyyy-MM');
          monthlyData[monthKey] = { total: 0, date: new Date(date) };
        }
        
        // Preencher com dados reais
        lastTwelveMonthsData?.forEach(orcamento => {
          if (orcamento.data_venda) {
            const date = new Date(orcamento.data_venda);
            const monthKey = format(date, 'yyyy-MM');
            
            if (monthlyData[monthKey]) {
              const total = orcamento.orcamentos_itens.reduce(
                (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
              );
              monthlyData[monthKey].total += total;
            }
          }
        });
        
        // Calcular variações e formatar dados para a tabela
        const sortedMonths = Object.entries(monthlyData)
          .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
          .map(([key, data], index, array) => {
            // Extrair ano e mês do key (yyyy-MM)
            const [year, month] = key.split('-').map(Number);
            
            // Formatar nome do mês
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
            const lastYearMonthKey = `${year - 1}-${month < 10 ? '0' : ''}${month}`;
            const lastYearMonth = lastTwelveMonthsData?.filter(orcamento => {
              if (!orcamento.data_venda) return false;
              return format(new Date(orcamento.data_venda), 'yyyy-MM') === lastYearMonthKey;
            });
            
            if (lastYearMonth && lastYearMonth.length > 0) {
              const lastYearTotal = lastYearMonth.reduce((sum, orcamento) => {
                return sum + orcamento.orcamentos_itens.reduce(
                  (itemSum: number, item: any) => itemSum + (Number(item.valor) || 0), 0
                );
              }, 0);
              
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
          .eq('status', 'ativo')
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
          .eq('status', 'ativo')
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
          .eq('status', 'ativo')
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
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('orcamentos')
          .select(`
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', startYearDate)
          .order('data_venda');

        if (monthlyError) throw monthlyError;
        console.log("Dados mensais para gráfico:", monthlyData);

        const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthData = monthlyData?.filter(
            (item) => {
              if (!item.data_venda) return false;
              const date = new Date(item.data_venda);
              return date.getMonth() === i;
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
            .eq('status', 'ativo')
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
        const yearlyData = [];
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
            .eq('status', 'ativo')
            .gte('data_venda', yearStart)
            .lte('data_venda', yearEnd);

          if (yError) throw yError;

          const faturado = yData?.reduce((acc, orcamento) => {
            return acc + orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          }, 0) || 0;

          yearlyData.push({
            name: year.toString(),
            faturado
          });
        }

        setYearlyChartData(yearlyData);
        console.log("Dados do gráfico anual processados:", yearlyData);

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

      {/* Tabela de Comparativo de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead className="text-right">Total de Vendas</TableHead>
                <TableHead className="text-right">Variação Mensal</TableHead>
                <TableHead className="text-right">Variação Anual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyComparisonData.map((item, index) => (
                <TableRow key={`${item.month}-${item.year}`}>
                  <TableCell className="font-medium">
                    {item.month.charAt(0).toUpperCase() + item.month.slice(1)} {item.year}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  <TableCell className="text-right">
                    {item.monthlyVariation !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {item.monthlyVariation > 0 ? (
                          <ArrowUp className="text-green-600 h-4 w-4" />
                        ) : item.monthlyVariation < 0 ? (
                          <ArrowDown className="text-red-600 h-4 w-4" />
                        ) : null}
                        <span className={
                          item.monthlyVariation > 0 ? 'text-green-600' : 
                          item.monthlyVariation < 0 ? 'text-red-600' : ''
                        }>
                          {Math.abs(item.monthlyVariation).toFixed(1)}%
                        </span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.yearlyVariation !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {item.yearlyVariation > 0 ? (
                          <ArrowUp className="text-green-600 h-4 w-4" />
                        ) : item.yearlyVariation < 0 ? (
                          <ArrowDown className="text-red-600 h-4 w-4" />
                        ) : null}
                        <span className={
                          item.yearlyVariation > 0 ? 'text-green-600' : 
                          item.yearlyVariation < 0 ? 'text-red-600' : ''
                        }>
                          {Math.abs(item.yearlyVariation).toFixed(1)}%
                        </span>
                      </div>
                    ) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                <SalesBarChart data={yearlyChartData} multiColor={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PainelVendasPage;
