
import { SalesLoadingState } from "@/components/vendas/SalesLoadingState";
import { SalesDashboardHeader } from "@/components/vendas/SalesDashboardHeader";
import { SalesDashboardCards } from "@/components/vendas/SalesDashboardCards";
import { SalesPerformanceTabs } from "@/components/vendas/SalesPerformanceTabs";
import { SalesComparisonTable } from "@/components/vendas/SalesComparisonTable";
import { useVendasDashboard } from "@/hooks/useVendasDashboard";
import { useEffect, useState } from "react";
import { DateInput } from "@/components/movimentacao/DateInput";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfMonth } from "date-fns";

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

  const handleDateChange = () => {
    fetchSalesData(format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <SalesDashboardHeader />
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <div className="w-[140px]">
              <DateInput
                label="Data inicial"
                value={startDate}
                onChange={(date) => date && setStartDate(date)}
              />
            </div>
            <div className="w-[140px]">
              <DateInput
                label="Data final"
                value={endDate}
                onChange={(date) => date && setEndDate(date)}
              />
            </div>
            <Button onClick={handleDateChange} className="mt-6 h-9">
              Filtrar
            </Button>
          </div>
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
};

export default PainelVendasPage;
