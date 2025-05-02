
import { FinanceiroDashboardCard } from "@/components/financeiro/FinanceiroDashboardCard";
import { formatCurrency } from "@/lib/utils";
import { DadosFinanceiros } from "@/types/financeiro";

interface FinanceiroDashboardCardsProps {
  dadosFinanceiros: DadosFinanceiros | null;
}

export const FinanceiroDashboardCards = ({ dadosFinanceiros }: FinanceiroDashboardCardsProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <FinanceiroDashboardCard
        title="Total a Receber"
        value={formatCurrency(dadosFinanceiros?.total_a_receber || 0)}
        description="Títulos em aberto"
        icon="money"
      />
      <FinanceiroDashboardCard
        title="Total a Pagar"
        value={formatCurrency(dadosFinanceiros?.total_a_pagar || 0)}
        description="Títulos em aberto"
        icon="chart"
      />
      <FinanceiroDashboardCard
        title="Saldo em Contas"
        value={formatCurrency(dadosFinanceiros?.saldo_contas || 0)}
        description="Disponível em contas"
        icon="account"
      />
      <FinanceiroDashboardCard
        title="Previsão de Saldo"
        value={formatCurrency(dadosFinanceiros?.previsao_saldo || 0)}
        description={`Considerando todos os títulos`}
        icon="balance"
      />
    </div>
  );
};
