
import { SalesLoadingState } from "@/components/vendas/SalesLoadingState";
import { SalesDashboardHeader } from "@/components/vendas/SalesDashboardHeader";
import { SalesDashboardCards } from "@/components/vendas/SalesDashboardCards";
import { SalesPerformanceTabs } from "@/components/vendas/SalesPerformanceTabs";
import { SalesComparisonTable } from "@/components/vendas/SalesComparisonTable";
import { SalesByServiceChart } from "@/components/vendas/SalesByServiceChart";
import { DashboardCardConfigurator } from "@/components/dashboard/DashboardCardConfigurator";
import { useVendasDashboard } from "@/hooks/useVendasDashboard";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { CrmDateRangeFilter } from "@/components/crm/dashboard/CrmDateRangeFilter";

const PainelVendasPage = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [forceRender, setForceRender] = useState(0);

  const {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData,
    monthlyComparisonData,
    ticketMedioPorProjetoData,
    fetchMonthlySalesData,
    fetchSalesData
  } = useVendasDashboard();

  const { isCardVisible, refetch: refetchCardsConfig } = useDashboardCards('painel-vendas');

  useEffect(() => {
    console.log("Estado do Painel de Vendas:", {
      isLoading,
      salesData,
      barChartDataLength: barChartData?.length,
      barChartData,
      quarterlyChartDataLength: quarterlyChartData?.length,
      quarterlyChartData,
      yearlyChartDataLength: yearlyChartData?.length,
      yearlyChartData,
      yearlyComparisonDataLength: yearlyComparisonData?.length,
      yearlyComparisonData,
      monthlyComparisonData,
      ticketMedioPorProjetoData
    });
  }, [isLoading, salesData, barChartData, quarterlyChartData, yearlyChartData, yearlyComparisonData, monthlyComparisonData, ticketMedioPorProjetoData]);

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    fetchSalesData(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
  };

  const handleConfigChange = async () => {
    // Atualizar configuração dos cards
    await refetchCardsConfig();
    // Forçar re-render completo incrementando o estado
    setForceRender(prev => prev + 1);
  };

  if (isLoading) {
    return <SalesLoadingState />;
  }

  // Garantir que todos os arrays de dados estão disponíveis
  const safeBarChartData = Array.isArray(barChartData) ? barChartData : [];
  const safeQuarterlyChartData = Array.isArray(quarterlyChartData) ? quarterlyChartData : [];
  const safeYearlyChartData = Array.isArray(yearlyChartData) ? yearlyChartData : [];
  const safeYearlyComparisonData = Array.isArray(yearlyComparisonData) ? yearlyComparisonData : [];
  const safeMonthlyComparisonData = Array.isArray(monthlyComparisonData) ? monthlyComparisonData : [];
  const safeTicketMedioPorProjetoData = Array.isArray(ticketMedioPorProjetoData) ? ticketMedioPorProjetoData : [];

  // Verificar se algum dos cards de vendas está visível
  const hasVisibleSalesCards = [
    'vendas-mes-atual',
    'total-vendas-ano', 
    'ticket-medio-projeto',
    'clientes-ativos'
  ].some(cardId => isCardVisible(cardId));

  return (
    <div className="space-y-6" key={forceRender}>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-4">
        <SalesDashboardHeader />
        
        <div className="flex items-center gap-4">
          <DashboardCardConfigurator 
            pageId="painel-vendas" 
            onConfigChange={handleConfigChange}
          />
          <CrmDateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      {hasVisibleSalesCards && (
        <SalesDashboardCards salesData={salesData} />
      )}
      
      {isCardVisible('tabs-performance') && (
        <SalesPerformanceTabs
          barChartData={safeBarChartData}
          quarterlyChartData={safeQuarterlyChartData}
          yearlyChartData={safeYearlyChartData}
          monthlyComparisonData={safeMonthlyComparisonData}
          ticketMedioPorProjetoData={safeTicketMedioPorProjetoData}
        />
      )}
      
      {isCardVisible('tabela-comparacao') && (
        <SalesComparisonTable 
          yearlyComparisonData={safeYearlyComparisonData}
          getMonthlySalesData={fetchMonthlySalesData}
        />
      )}

      {/* Novo gráfico de pizza de vendas por serviço */}
      <SalesByServiceChart />
    </div>
  );
}

export default PainelVendasPage;
