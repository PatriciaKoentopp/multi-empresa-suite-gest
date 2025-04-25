
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
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
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

        const { data: yearData, error: yearError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', `${currentYear}-01-01`)
          .lte('data', `${currentYear}-12-31`);

        if (yearError) throw yearError;
        console.log("Dados do ano:", yearData);

        // Calcular total de vendas do ano
        const totalVendas = yearData?.reduce((acc, orcamento) => {
          const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + orcamentoTotal;
        }, 0) || 0;
        
        console.log("Total de vendas do ano:", totalVendas);

        // Buscar vendas do mês atual
        const startCurrentMonth = startOfMonth(new Date());
        const endCurrentMonth = endOfMonth(new Date());
        
        console.log("Período mês atual:", startCurrentMonth.toISOString(), "até", endCurrentMonth.toISOString());
        
        const { data: currentMonthData, error: currentMonthError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            data,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', startCurrentMonth.toISOString())
          .lte('data', endCurrentMonth.toISOString());

        if (currentMonthError) throw currentMonthError;
        console.log("Dados do mês atual:", currentMonthData);

        const vendasMesAtual = currentMonthData?.reduce((acc, orcamento) => {
          const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + orcamentoTotal;
        }, 0) || 0;
        
        console.log("Vendas mês atual:", vendasMesAtual);

        // Buscar vendas do mês anterior
        const startLastMonth = startOfMonth(subMonths(new Date(), 1));
        const endLastMonth = endOfMonth(subMonths(new Date(), 1));
        
        console.log("Período mês anterior:", startLastMonth.toISOString(), "até", endLastMonth.toISOString());
        
        const { data: lastMonthData, error: lastMonthError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', startLastMonth.toISOString())
          .lte('data', endLastMonth.toISOString());

        if (lastMonthError) throw lastMonthError;
        console.log("Dados do mês anterior:", lastMonthData);

        const vendasMesAnterior = lastMonthData?.reduce((acc, orcamento) => {
          const orcamentoTotal = orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          return acc + orcamentoTotal;
        }, 0) || 0;
        
        console.log("Vendas mês anterior:", vendasMesAnterior);

        // Calcular variação percentual
        const variacaoPercentual = vendasMesAnterior === 0 ? 100 : ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;

        // Buscar média de ticket
        const { data: ticketData, error: ticketError } = await supabase
          .from('orcamentos')
          .select(`
            id,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', subDays(new Date(), 90).toISOString());

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
          .gte('data', subDays(new Date(), 90).toISOString())
          .distinct();

        if (clientesError) throw clientesError;
        console.log("Clientes ativos:", clientesData);

        const clientesAtivos = clientesData?.length || 0;

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
            data,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', `${currentYear}-01-01`)
          .order('data');

        if (monthlyError) throw monthlyError;
        console.log("Dados mensais para gráfico:", monthlyData);

        const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const monthData = monthlyData?.filter(
            (item) => new Date(item.data).getMonth() === i
          );
          
          const faturado = monthData?.reduce((acc, orcamento) => {
            return acc + orcamento.orcamentos_itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
          }, 0) || 0;

          return {
            name: format(new Date(currentYear, i), 'MMM', { locale: ptBR }),
            faturado,
            projetado: faturado * 1.1 // Projeção simples de 10% de crescimento
          };
        });

        setBarChartData(monthlyChartData);
        console.log("Dados do gráfico de barras processados:", monthlyChartData);

        // Buscar dados para o gráfico de pizza (vendas por categoria/serviço)
        const { data: categoryData, error: categoryError } = await supabase
          .from('orcamentos_itens')
          .select(`
            valor,
            servico:servicos(nome)
          `)
          .gte('orcamentos.data', startCurrentMonth.toISOString())
          .lte('orcamentos.data', endCurrentMonth.toISOString())
          .eq('orcamentos.tipo', 'venda')
          .inner('orcamentos');

        if (categoryError) throw categoryError;
        console.log("Dados por categoria:", categoryData);

        const pieData = categoryData?.reduce((acc: any[], item) => {
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
            data,
            orcamentos_itens (valor)
          `)
          .eq('tipo', 'venda')
          .gte('data', startCurrentMonth.toISOString())
          .lte('data', endCurrentMonth.toISOString())
          .order('data');

        if (dailyError) throw dailyError;
        console.log("Dados diários para gráfico de linha:", dailyData);

        const dailyChartData = dailyData?.reduce((acc: any[], orcamento) => {
          const date = format(new Date(orcamento.data), 'dd/MM');
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

  // Formatação de valores para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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
                <SalesBarChart 
                  data={[
                    { name: "T1", faturado: 145500, projetado: 153000 },
                    { name: "T2", faturado: 161700, projetado: 162000 },
                    { name: "T3", faturado: 179000, projetado: 171000 },
                    { name: "T4", faturado: 224300, projetado: 180000 }
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="yearly">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesBarChart 
                  data={[
                    { name: "2022", faturado: 850000, projetado: 820000 },
                    { name: "2023", faturado: 980000, projetado: 950000 },
                    { name: "2024", faturado: 710500, projetado: 1100000 },
                    { name: "2025", faturado: 0, projetado: 1250000 }
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Layout de 2 colunas com diferentes tipos de gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Vendas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesPieChart data={pieChartData} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Tendência Vendas Diárias (Novembro)</CardTitle>
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
