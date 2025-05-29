
import { useState } from "react";
import { FinanceiroLoadingState } from "@/components/financeiro/FinanceiroLoadingState";
import { FinanceiroDashboardHeader } from "@/components/financeiro/FinanceiroDashboardHeader";
import { FinanceiroDashboardCards } from "@/components/financeiro/FinanceiroDashboardCards";
import { FluxoFinanceiroTable } from "@/components/financeiro/FluxoFinanceiroTable";
import { ContasStatusCards } from "@/components/financeiro/ContasStatusCards";
import { FluxoCaixaChart } from "@/components/financeiro/FluxoCaixaChart";
import { FluxoCaixaFilter } from "@/components/financeiro/FluxoCaixaFilter";
import { DashboardCardConfigurator } from "@/components/dashboard/DashboardCardConfigurator";
import { usePainelFinanceiro } from "@/hooks/usePainelFinanceiro";
import { useDashboardCards } from "@/hooks/useDashboardCards";

const PainelFinanceiroPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const { 
    isLoading, 
    dadosFinanceiros, 
    fetchDadosFinanceiros, 
    filtroFluxoCaixa,
    atualizarFiltroFluxoCaixa,
    saldoInicialPeriodo
  } = usePainelFinanceiro();

  const { isCardVisible, refetch: refetchCardsConfig } = useDashboardCards('painel-financeiro');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDadosFinanceiros();
    setIsRefreshing(false);
  };

  const handleConfigChange = async () => {
    // Atualizar configuração dos cards
    await refetchCardsConfig();
    // Forçar re-render completo incrementando o estado
    setForceRender(prev => prev + 1);
  };

  if (isLoading) {
    return <FinanceiroLoadingState />;
  }

  return (
    <div className="space-y-6" key={forceRender}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe os principais indicadores financeiros de {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardCardConfigurator 
            pageId="painel-financeiro" 
            onConfigChange={handleConfigChange} 
          />
          <FinanceiroDashboardHeader 
            onRefresh={handleRefresh} 
            isRefreshing={isRefreshing} 
          />
        </div>
      </div>
      
      {/* Cards principais */}
      <FinanceiroDashboardCards dadosFinanceiros={dadosFinanceiros} />
      
      {/* Cards de status */}
      <ContasStatusCards dadosFinanceiros={dadosFinanceiros} />
      
      {dadosFinanceiros && (
        <>
          {/* Filtro do fluxo de caixa */}
          {isCardVisible('filtro-fluxo-caixa') && (
            <FluxoCaixaFilter 
              filtro={filtroFluxoCaixa}
              contas={dadosFinanceiros.contas_correntes.filter(c => c.considerar_saldo) || []}
              onFiltroChange={atualizarFiltroFluxoCaixa}
            />
          )}
          
          {/* Gráfico do fluxo de caixa */}
          {isCardVisible('grafico-fluxo-caixa') && (
            <FluxoCaixaChart 
              data={dadosFinanceiros.fluxo_caixa || []} 
              saldoInicialPeriodo={saldoInicialPeriodo}
            />
          )}
        </>
      )}
      
      {/* Tabela do fluxo mensal */}
      {dadosFinanceiros?.fluxo_por_mes && isCardVisible('tabela-fluxo-mensal') && (
        <FluxoFinanceiroTable fluxoMensal={dadosFinanceiros.fluxo_por_mes} />
      )}
    </div>
  );
};

export default PainelFinanceiroPage;
