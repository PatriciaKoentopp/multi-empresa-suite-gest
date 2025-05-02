
import { useState } from "react";
import { FinanceiroLoadingState } from "@/components/financeiro/FinanceiroLoadingState";
import { FinanceiroDashboardHeader } from "@/components/financeiro/FinanceiroDashboardHeader";
import { FinanceiroDashboardCards } from "@/components/financeiro/FinanceiroDashboardCards";
import { FluxoFinanceiroTable } from "@/components/financeiro/FluxoFinanceiroTable";
import { ContasStatusCards } from "@/components/financeiro/ContasStatusCards";
import { usePainelFinanceiro } from "@/hooks/usePainelFinanceiro";

const PainelFinanceiroPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isLoading, dadosFinanceiros, fetchDadosFinanceiros } = usePainelFinanceiro();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDadosFinanceiros();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <FinanceiroLoadingState />;
  }

  return (
    <div className="space-y-6">
      <FinanceiroDashboardHeader 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing} 
      />
      
      <FinanceiroDashboardCards dadosFinanceiros={dadosFinanceiros} />
      
      <ContasStatusCards dadosFinanceiros={dadosFinanceiros} />
      
      {dadosFinanceiros?.fluxo_por_mes && (
        <FluxoFinanceiroTable fluxoMensal={dadosFinanceiros.fluxo_por_mes} />
      )}
    </div>
  );
};

export default PainelFinanceiroPage;
