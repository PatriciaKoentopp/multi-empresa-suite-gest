
import { SalesLoadingState } from "@/components/vendas/SalesLoadingState";
import { SalesDashboardHeader } from "@/components/vendas/SalesDashboardHeader";
import { SalesDashboardCards } from "@/components/vendas/SalesDashboardCards";
import { SalesPerformanceTabs } from "@/components/vendas/SalesPerformanceTabs";
import { SalesComparisonTable } from "@/components/vendas/SalesComparisonTable";
import { useVendasDashboard } from "@/hooks/useVendasDashboard";
import { useEffect } from "react";

const PainelVendasPage = () => {
  const {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData,
    fetchMonthlySalesData
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
      yearlyComparisonData
    });
  }, [isLoading, salesData, barChartData, quarterlyChartData, yearlyChartData, yearlyComparisonData]);

  if (isLoading) {
    return <SalesLoadingState />;
  }

  // Garantir que todos os arrays de dados estão disponíveis
  const safeBarChartData = Array.isArray(barChartData) ? barChartData : [];
  const safeQuarterlyChartData = Array.isArray(quarterlyChartData) ? quarterlyChartData : [];
  const safeYearlyChartData = Array.isArray(yearlyChartData) ? yearlyChartData : [];
  const safeYearlyComparisonData = Array.isArray(yearlyComparisonData) ? yearlyComparisonData : [];

  return (
    <div className="space-y-6">
      <SalesDashboardHeader />
      <SalesDashboardCards salesData={salesData} />
      <SalesPerformanceTabs
        barChartData={safeBarChartData}
        quarterlyChartData={safeQuarterlyChartData}
        yearlyChartData={safeYearlyChartData}
      />
      <SalesComparisonTable 
        yearlyComparisonData={safeYearlyComparisonData}
        getMonthlySalesData={fetchMonthlySalesData}
      />
    </div>
  );
};

export default PainelVendasPage;
