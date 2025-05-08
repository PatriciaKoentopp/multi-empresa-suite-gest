
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { YearlyComparison } from "@/types";
import { SalesData, ChartData, TicketMedioData } from "./vendas/types";
import { useSalesData } from "./vendas/useSalesData";
import { useChartData } from "./vendas/useChartData";
import { useMonthlySalesData } from "./vendas/useMonthlySalesData";
import { useYearlyComparison } from "./vendas/useYearlyComparison";
import { useTicketMedioProjeto } from "./vendas/useTicketMedioProjeto";

export const useVendasDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const { salesData, fetchSalesData } = useSalesData();
  const { barChartData, quarterlyChartData, yearlyChartData, fetchBarChartData, fetchYearlyChartData, setBarChartData, setQuarterlyChartData, setYearlyChartData } = useChartData();
  const { fetchMonthlySalesData } = useMonthlySalesData();
  const { yearlyComparisonData, fetchYearlyComparison } = useYearlyComparison();
  const { fetchTicketMedioPorProjeto } = useTicketMedioProjeto();
  
  const [monthlyComparisonData, setMonthlyComparisonData] = useState<any[]>([]);
  const [ticketMedioPorProjetoData, setTicketMedioPorProjetoData] = useState<TicketMedioData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar todos os dados em paralelo para otimizar o carregamento
      const [
        yearlyComparisonResult,
        salesDataResult,
        barChartDataResult,
        yearlyChartResult,
        ticketProjetoData,
      ] = await Promise.all([
        fetchYearlyComparison(),
        fetchSalesData(),
        fetchBarChartData(),
        fetchYearlyChartData(),
        fetchTicketMedioPorProjeto(),
      ]);
      
      // Dados de ticket médio por projeto
      setTicketMedioPorProjetoData(ticketProjetoData);

      // Buscar dados de comparação mensal do ano atual
      const currentYear = new Date().getFullYear();
      const anoAtualMensal = await fetchMonthlySalesData(currentYear);
      setMonthlyComparisonData(anoAtualMensal);
      
    } catch (error: any) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dashboard de vendas",
        description: error.message || "Não foi possível carregar os dados do dashboard de vendas"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData,
    monthlyComparisonData,
    ticketMedioPorProjetoData,
    fetchMonthlySalesData
  };
};
