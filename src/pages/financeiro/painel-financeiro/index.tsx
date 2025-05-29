
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

  const handleConfigChange = () => {
    refetchCardsConfig();
  };

  if (isLoading) {
    return <FinanceiroLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Financeiro</h1>
          <p className="text-muted-foreground">
            Acompanhe os principais indicadores financeiros de {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardCardConfigurator pageId="painel-financeiro" onConfigChange={handleConfigChange} />
          <FinanceiroDashboardHeader 
            onRefresh={handleRefresh} 
            isRefreshing={isRefreshing} 
          />
        </div>
      </div>
      
      {/* Cards principais - renderizados se visíveis */}
      {(isCardVisible('total-receber') || isCardVisible('total-pagar') || 
        isCardVisible('saldo-contas') || isCardVisible('previsao-saldo')) && (
        <FinanceiroDashboardCards dadosFinanceiros={dadosFinanceiros} />
      )}
      
      {/* Cards de status - renderizados se visíveis */}
      {(isCardVisible('contas-vencidas-receber') || isCardVisible('contas-vencer-receber') || 
        isCardVisible('contas-vencidas-pagar') || isCardVisible('contas-vencer-pagar')) && (
        <ContasStatusCards dadosFinanceiros={dadosFinanceiros} />
      )}
      
      {dadosFinanceiros && (
        <>
          {/* Filtro do fluxo de caixa - renderizado se visível */}
          {isCardVisible('filtro-fluxo-caixa') && (
            <FluxoCaixaFilter 
              filtro={filtroFluxoCaixa}
              contas={dadosFinanceiros.contas_correntes.filter(c => c.considerar_saldo) || []}
              onFiltroChange={atualizarFiltroFluxoCaixa}
            />
          )}
          
          {/* Gráfico do fluxo de caixa - renderizado se visível */}
          {isCardVisible('grafico-fluxo-caixa') && (
            <FluxoCaixaChart 
              data={dadosFinanceiros.fluxo_caixa || []} 
              saldoInicialPeriodo={saldoInicialPeriodo}
            />
          )}
        </>
      )}
      
      {/* Tabela do fluxo mensal - renderizada se visível */}
      {dadosFinanceiros?.fluxo_por_mes && isCardVisible('tabela-fluxo-mensal') && (
        <FluxoFinanceiroTable fluxoMensal={dadosFinanceiros.fluxo_por_mes} />
      )}
    </div>
  );
};

export default PainelFinanceiroPage;
