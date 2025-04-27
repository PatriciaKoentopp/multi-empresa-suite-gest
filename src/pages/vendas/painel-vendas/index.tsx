import { useEffect, useState } from "react";
import { SalesCard } from "@/components/vendas/SalesCard";
import { SalesBarChart } from "@/components/vendas/SalesBarChart";
import { SalesPieChart } from "@/components/vendas/SalesPieChart";
import { SalesLineChart } from "@/components/vendas/SalesLineChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  clientes_ativos: number;
}

const PainelVendasPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [quarterlyChartData, setQuarterlyChartData] = useState<any[]>([]);
  const [yearlyChartData, setYearlyChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);

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

        // Buscar vendas do mês atual - usando formato de data correto
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
            faturado,
            projetado: faturado * 1.1
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
            faturado,
            projetado: faturado * 1.1
          });
        }

        setQuarterlyChartData(quarterlyData);
        console.log("Dados do gráfico trimestral processados:", quarterlyData);

        // Buscar dados para gráficos anuais (últimos 4 anos)
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

          // Cálculo da projeção: para anos passados, é igual ao faturado
          // Para o ano atual, é o valor atual extrapolado para o ano inteiro
          const projetado = year < currentYearNum ? 
            faturado : 
            // Extrapola o valor atual com base no mês corrente
            Math.round((faturado / (new Date().getMonth() + 1)) * 12);

          yearlyData.push({
            name: year.toString(),
            faturado,
            projetado
          });
        }

        setYearlyChartData(yearlyData);
        console.log("Dados do gráfico anual processados:", yearlyData);

        // Buscar vendas por serviço para o gráfico de pizza - corrigindo a consulta
        const startCurrentMonth = startOfMonth(new Date());
        const endCurrentMonth = endOfMonth(new Date());
        
        const startCurrentMonthFormatted = format(startCurrentMonth, 'yyyy-MM-dd');
        const endCurrentMonthFormatted = format(endCurrentMonth, 'yyyy-MM-dd');

        // Corrigindo a consulta para buscar dados de vendas por serviço
        // Usando join adequado em vez de inner()
        const { data: serviceData, error: serviceError } = await supabase
          .from('orcamentos_itens')
          .select(`
            valor,
            servico:servicos(id, nome),
            orcamentos!inner(data_venda, tipo, status)
          `)
          .eq('orcamentos.tipo', 'venda')
          .eq('orcamentos.status', 'ativo')
          .gte('orcamentos.data_venda', startCurrentMonthFormatted)
          .lte('orcamentos.data_venda', endCurrentMonthFormatted);

        if (serviceError) throw serviceError;
        console.log("Dados por serviço:", serviceData);

        // Filtramos apenas os registros que possuem data_venda dentro do período
        const filteredServiceData = serviceData?.filter(item => {
          if (!item.orcamentos || !item.orcamentos.data_venda) return false;
          const dataVenda = new Date(item.orcamentos.data_venda);
          return dataVenda >= startCurrentMonth && dataVenda <= endCurrentMonth;
        });

        const pieData = filteredServiceData?.reduce((acc: any[], item) => {
          const servicoNome = item.servico?.nome || 'Outros';
          const existingService = acc.find(s => s.name === servicoNome);
          
          if (existingService) {
            existingService.value += Number(item.valor) || 0;
          } else {
            acc.push({
              name: servicoNome,
              value: Number(item.valor) || 0,
              color: `hsl(${Math.random() * 360}, 70%, 50%)`
            });
          }
          
          return acc;
        }, []) || [];

        setPieChartData(pieData);
        console.log("Dados do gráfico de pizza processados:", pieData);

        // Buscar dados para o gráfico de linha (vendas diárias do mês atual)
        const { data: dailyData, error: dailyError } = await supabase
          .from('orcamentos')
          .select(`
            data_venda,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .eq('status', 'ativo')
          .gte('data_venda', startCurrentMonthFormatted)
          .lte('data_venda', endCurrentMonthFormatted)
          .order('data_venda');

        if (dailyError) throw dailyError;
        console.log("Dados diários para gráfico de linha:", dailyData);

        const dailyChartData = dailyData?.reduce((acc: any[], orcamento) => {
          if (!orcamento.data_venda) return acc;
          
          const date = format(new Date(orcamento.data_venda), 'dd/MM');
          const value = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          
          const existingDay = acc.find(d => d.name === date);
          if (existingDay) {
            existingDay.value += value;
          } else {
            acc.push({ name: date, value });
          }
          
          return acc;
        }, []) || [];

        setLineChartData(dailyChartData);
        console.log("Dados do gráfico de linha processados:", dailyChartData);

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
        <SalesCard
          title="Total de Vendas (Ano)"
          value={formatCurrency(salesData?.total_vendas || 0)}
          description="Total acumulado no ano"
          icon="money"
        />
        <SalesCard
          title={`Vendas (${format(new Date(), 'MMMM', { locale: ptBR })})`}
          value={formatCurrency(salesData?.vendas_mes_atual || 0)}
          description={`vs. ${formatCurrency(salesData?.vendas_mes_anterior || 0)} mês anterior`}
          trend={salesData?.variacao_percentual && salesData.variacao_percentual > 0 ? "up" : "down"}
          trendValue={`${Math.abs(salesData?.variacao_percentual || 0).toFixed(1)}%`}
          icon="money"
        />
        <SalesCard
          title="Ticket Médio"
          value={formatCurrency(salesData?.media_ticket || 0)}
          description="Por venda realizada"
          icon="sales"
        />
        <SalesCard
          title="Clientes Ativos"
          value={String(salesData?.clientes_ativos || 0)}
          description="Com vendas nos últimos 90 dias"
          icon="sales"
        />
      </div>

      {/* Gráficos */}
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
                <SalesBarChart data={yearlyChartData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Layout de 2 colunas com diferentes tipos de gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Vendas por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesPieChart data={pieChartData} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Tendência Vendas Diárias ({format(new Date(), 'MMMM', { locale: ptBR })})</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesLineChart data={lineChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PainelVendasPage;
