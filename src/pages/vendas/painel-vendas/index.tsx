
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interfaces para os dados
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Em um cenário real, usaríamos dados do Supabase
        // Para esse exemplo, usaremos dados simulados
        
        // Simulação de dados de vendas
        const dadosSimulados: SalesData = {
          total_vendas: 1258760.45,
          vendas_mes_atual: 124580.75,
          vendas_mes_anterior: 118340.20,
          variacao_percentual: 5.3,
          media_ticket: 3450.80,
          clientes_ativos: 45
        };
        
        // Simular tempo de carregamento para uma experiência mais realista
        setTimeout(() => {
          setSalesData(dadosSimulados);
          setIsLoading(false);
        }, 800);
        
      } catch (error: any) {
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

  // Dados simulados para os gráficos
  const barChartData = [
    { name: "Jan", faturado: 45000, projetado: 50000 },
    { name: "Fev", faturado: 52000, projetado: 51000 },
    { name: "Mar", faturado: 48500, projetado: 52000 },
    { name: "Abr", faturado: 47800, projetado: 53000 },
    { name: "Mai", faturado: 54200, projetado: 54000 },
    { name: "Jun", faturado: 59700, projetado: 55000 },
    { name: "Jul", faturado: 56300, projetado: 56000 },
    { name: "Ago", faturado: 62500, projetado: 57000 },
    { name: "Set", faturado: 60200, projetado: 58000 },
    { name: "Out", faturado: 67800, projetado: 59000 },
    { name: "Nov", faturado: 71500, projetado: 60000 },
    { name: "Dez", faturado: 85000, projetado: 61000 },
  ];

  const pieChartData = [
    { name: "Consultoria", value: 420500, color: "#1E88E5" },
    { name: "Desenvolvimento", value: 350200, color: "#43A047" },
    { name: "Suporte", value: 215800, color: "#FB8C00" },
    { name: "Treinamento", value: 178250, color: "#8E24AA" },
    { name: "Outros", value: 94010, color: "#5E35B1" },
  ];

  const lineChartData = [
    { name: "01/11", value: 2400 },
    { name: "02/11", value: 1398 },
    { name: "03/11", value: 9800 },
    { name: "04/11", value: 3908 },
    { name: "05/11", value: 4800 },
    { name: "06/11", value: 3800 },
    { name: "07/11", value: 4300 },
    { name: "08/11", value: 5300 },
    { name: "09/11", value: 4890 },
    { name: "10/11", value: 8200 },
    { name: "11/11", value: 6100 },
    { name: "12/11", value: 5700 },
    { name: "13/11", value: 7500 },
    { name: "14/11", value: 6890 },
    { name: "15/11", value: 8900 },
    { name: "16/11", value: 7200 },
    { name: "17/11", value: 9100 },
    { name: "18/11", value: 10200 },
    { name: "19/11", value: 8300 },
    { name: "20/11", value: 9580 },
    { name: "21/11", value: 11200 },
    { name: "22/11", value: 10500 },
    { name: "23/11", value: 12800 },
    { name: "24/11", value: 14100 },
    { name: "25/11", value: 16500 },
  ];

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
