
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesBarChart } from "./SalesBarChart";
import { SalesLineChart } from "./SalesLineChart";
import { BarChart, LineChart, AreaChart } from "lucide-react";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface SalesPerformanceTabsProps {
  barChartData: any[];
  quarterlyChartData: any[];
  yearlyChartData: any[];
  monthlyComparisonData: any[];
  ticketMedioPorProjetoData: any[];
}

export const SalesPerformanceTabs = ({
  barChartData,
  quarterlyChartData,
  yearlyChartData,
  monthlyComparisonData,
  ticketMedioPorProjetoData
}: SalesPerformanceTabsProps) => {
  const { isCardVisible } = useDashboardCards('painel-vendas');

  // Se o card de tabs não estiver visível, não renderizar
  if (!isCardVisible('tabs-performance')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Performance de Vendas
        </CardTitle>
        <CardDescription>
          Análise detalhada dos dados de vendas em diferentes períodos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mensal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="trimestral">Trimestral</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
            <TabsTrigger value="comparacao">Comparação</TabsTrigger>
            <TabsTrigger value="ticket">Ticket Médio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mensal" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Vendas Mensais</h3>
            </div>
            <SalesBarChart data={barChartData} />
          </TabsContent>
          
          <TabsContent value="trimestral" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Vendas Trimestrais</h3>
            </div>
            <SalesBarChart data={quarterlyChartData} />
          </TabsContent>
          
          <TabsContent value="anual" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Vendas Anuais</h3>
            </div>
            <SalesLineChart data={yearlyChartData} />
          </TabsContent>
          
          <TabsContent value="comparacao" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AreaChart className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Comparação Mensal por Ano</h3>
            </div>
            <SalesBarChart data={monthlyComparisonData} />
          </TabsContent>
          
          <TabsContent value="ticket" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Ticket Médio por Projeto</h3>
            </div>
            <SalesLineChart data={ticketMedioPorProjetoData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
