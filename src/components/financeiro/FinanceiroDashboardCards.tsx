
import { FinanceiroDashboardCard } from "@/components/financeiro/FinanceiroDashboardCard";
import { formatCurrency } from "@/lib/utils";
import { DadosFinanceiros } from "@/types/financeiro";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface FinanceiroDashboardCardsProps {
  dadosFinanceiros: DadosFinanceiros | null;
}

export const FinanceiroDashboardCards = ({ dadosFinanceiros }: FinanceiroDashboardCardsProps) => {
  const { isCardVisible } = useDashboardCards('painel-financeiro');
  
  // Verificar se há pelo menos um card visível
  const hasVisibleCards = [
    'total-receber',
    'total-pagar', 
    'saldo-contas',
    'previsao-saldo'
  ].some(cardId => isCardVisible(cardId));

  if (!hasVisibleCards) {
    return null;
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isCardVisible('total-receber') && (
        <FinanceiroDashboardCard
          title="Total a Receber"
          value={formatCurrency(dadosFinanceiros?.total_a_receber || 0)}
          description="Títulos em aberto"
          icon="money"
        />
      )}
      {isCardVisible('total-pagar') && (
        <FinanceiroDashboardCard
          title="Total a Pagar"
          value={formatCurrency(dadosFinanceiros?.total_a_pagar || 0)}
          description="Títulos em aberto"
          icon="chart"
        />
      )}
      {isCardVisible('saldo-contas') && (
        <FinanceiroDashboardCard
          title="Saldo em Contas"
          value={formatCurrency(dadosFinanceiros?.saldo_contas || 0)}
          description="Disponível em contas"
          icon="account"
        />
      )}
      {isCardVisible('previsao-saldo') && (
        <FinanceiroDashboardCard
          title="Previsão de Saldo"
          value={formatCurrency(dadosFinanceiros?.previsao_saldo || 0)}
          description="Considerando todos os títulos"
          icon="balance"
        />
      )}
    </div>
  );
};
