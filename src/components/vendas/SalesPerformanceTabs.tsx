
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesBarChart } from "./SalesBarChart";

interface SalesPerformanceTabsProps {
  barChartData: any[];
  quarterlyChartData: any[];
  yearlyChartData: any[];
  monthlyComparisonData: any[]; // Dados para comparação mensal
  ticketMedioPorProjetoData: any[]; // Novo tipo de dados para ticket médio por projeto
}

export const SalesPerformanceTabs = ({
  barChartData,
  quarterlyChartData,
  yearlyChartData,
  monthlyComparisonData,
  ticketMedioPorProjetoData
}: SalesPerformanceTabsProps) => {
  // Verificar se todos os dados estão presentes
  console.log("SalesPerformanceTabs - Dados recebidos:", {
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    monthlyComparisonData,
    ticketMedioPorProjetoData
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="monthly">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Desempenho de Vendas</h3>
          <TabsList>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
            <TabsTrigger value="yearly">Anual</TabsTrigger>
            <TabsTrigger value="monthly-comparison">Comparativo Mensal</TabsTrigger>
            <TabsTrigger value="ticket-medio-projeto">Ticket por Projeto</TabsTrigger>
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
              <SalesBarChart data={quarterlyChartData} multiColor={true} />
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
        <TabsContent value="monthly-comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Mensal por Ano</CardTitle>
            </CardHeader>
            <CardContent className="pb-0">
              <SalesBarChart 
                data={monthlyComparisonData} 
                multiColor={true} 
                isMonthlyComparison={true} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ticket-medio-projeto">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Médio por Projeto por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesBarChart 
                data={ticketMedioPorProjetoData.map(item => ({
                  name: item.name,
                  ticket_medio: item.ticket_medio,
                  contagem: item.contagem_projetos
                }))} 
                multiColor={true}
                valueKey="ticket_medio"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
