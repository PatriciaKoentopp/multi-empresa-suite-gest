
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

      // Buscar dados de comparação mensal de todos os anos com vendas
      await fetchAllYearsMonthlyData(yearlyComparisonResult);
      
      console.log('Dados do dashboard carregados com sucesso:', {
        yearlyComparisonData: yearlyComparisonResult,
        ticketMedioPorProjetoData: ticketProjetoData
      });
      
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
  
  // Nova função para buscar e processar dados mensais de todos os anos
  const fetchAllYearsMonthlyData = async (yearlyData: YearlyComparison[]) => {
    try {
      // Filtrar apenas os anos que têm dados (total > 0)
      const anosComDados = yearlyData
        .filter(year => year.total > 0)
        .map(year => year.year);
      
      if (anosComDados.length === 0) {
        console.log("Não há anos com dados para buscar");
        setMonthlyComparisonData([]);
        return;
      }
      
      console.log("Anos com dados para buscar mensais:", anosComDados);
      
      // Criar um array de promessas para buscar dados de todos os anos
      const promises = anosComDados.map(year => fetchMonthlySalesData(year));
      
      // Esperar por todas as promessas serem resolvidas
      const results = await Promise.all(promises);
      
      // Criar mapa para consolidar dados por mês
      const mesesMap: Record<string, Record<number, number>> = {};
      
      // Processar os resultados e organizar por mês
      results.forEach((dadosAno, index) => {
        const ano = anosComDados[index];
        
        dadosAno.forEach(dadosMes => {
          if (!mesesMap[dadosMes.name]) {
            mesesMap[dadosMes.name] = {};
          }
          // Adicionar o valor do ano para este mês
          mesesMap[dadosMes.name][ano] = dadosMes.faturado;
        });
      });
      
      // Transformar o mapa em array de objetos para o gráfico
      const mesesProcessados = Object.keys(mesesMap).map(nomeMes => {
        // Criar objeto base com nome do mês
        const obj: Record<string, any> = { name: nomeMes };
        
        // Adicionar valores de cada ano
        anosComDados.forEach(ano => {
          obj[String(ano)] = mesesMap[nomeMes][ano] || 0;
        });
        
        return obj;
      });
      
      // Ordenar meses corretamente
      const mesesOrdem = {
        "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4,
        "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
        "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
      };
      
      mesesProcessados.sort((a, b) => mesesOrdem[a.name as keyof typeof mesesOrdem] - mesesOrdem[b.name as keyof typeof mesesOrdem]);
      
      console.log("Dados mensais formatados para todos os anos:", mesesProcessados);
      setMonthlyComparisonData(mesesProcessados);
      
    } catch (error) {
      console.error("Erro ao buscar dados mensais de todos os anos:", error);
      setMonthlyComparisonData([]);
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
