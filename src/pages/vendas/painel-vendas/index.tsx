
import { SalesLoadingState } from "@/components/vendas/SalesLoadingState";
import { SalesDashboardHeader } from "@/components/vendas/SalesDashboardHeader";
import { SalesDashboardCards } from "@/components/vendas/SalesDashboardCards";
import { SalesPerformanceTabs } from "@/components/vendas/SalesPerformanceTabs";
import { SalesComparisonTable } from "@/components/vendas/SalesComparisonTable";
import { useVendasDashboard } from "@/hooks/useVendasDashboard";
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { CrmDateRangeFilter } from "@/components/crm/dashboard/CrmDateRangeFilter";

const PainelVendasPage = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <SalesDashboardHeader />
        
        <div className="flex items-center">
          <CrmDateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      <SalesDashboardCards salesData={salesData} />
      <SalesPerformanceTabs
        barChartData={safeBarChartData}
        quarterlyChartData={safeQuarterlyChartData}
        yearlyChartData={safeYearlyChartData}
        monthlyComparisonData={safeMonthlyComparisonData}
        ticketMedioPorProjetoData={safeTicketMedioPorProjetoData}
      />
      <SalesComparisonTable 
        yearlyComparisonData={safeYearlyComparisonData}
        getMonthlySalesData={fetchMonthlySalesData}
      />
    </div>
  );
}

export default PainelVendasPage;
