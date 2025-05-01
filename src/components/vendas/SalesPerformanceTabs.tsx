
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesBarChart } from "./SalesBarChart";

interface SalesPerformanceTabsProps {
  barChartData: any[];
  quarterlyChartData: any[];
  yearlyChartData: any[];
}

export const SalesPerformanceTabs = ({
  barChartData,
  quarterlyChartData,
  yearlyChartData
}: SalesPerformanceTabsProps) => {
  // Verificar se todos os dados estão presentes
  console.log("SalesPerformanceTabs - Dados recebidos:", {
    barChartData,
    quarterlyChartData,
    yearlyChartData
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
      </Tabs>
    </div>
  );
};
