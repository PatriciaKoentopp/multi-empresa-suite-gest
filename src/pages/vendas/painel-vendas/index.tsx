
import { SalesLoadingState } from "@/components/vendas/SalesLoadingState";
import { SalesDashboardHeader } from "@/components/vendas/SalesDashboardHeader";
import { SalesDashboardCards } from "@/components/vendas/SalesDashboardCards";
import { SalesPerformanceTabs } from "@/components/vendas/SalesPerformanceTabs";
import { SalesComparisonTable } from "@/components/vendas/SalesComparisonTable";
import { useVendasDashboard } from "@/hooks/useVendasDashboard";

const PainelVendasPage = () => {
  const {
    isLoading,
    salesData,
    barChartData,
    quarterlyChartData,
    yearlyChartData,
    yearlyComparisonData
  } = useVendasDashboard();

  if (isLoading) {
    return <SalesLoadingState />;
  }

  return (
    <div className="space-y-6">
      <SalesDashboardHeader />
      <SalesDashboardCards salesData={salesData} />
      <SalesPerformanceTabs
        barChartData={barChartData}
        quarterlyChartData={quarterlyChartData}
        yearlyChartData={yearlyChartData}
      />
      <SalesComparisonTable yearlyComparisonData={yearlyComparisonData} />
    </div>
  );
};

export default PainelVendasPage;
