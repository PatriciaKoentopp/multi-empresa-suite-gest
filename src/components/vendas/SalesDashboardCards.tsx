
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesDashboardCardsProps {
  salesData: {
    total_vendas: number;
    vendas_mes_atual: number;
    vendas_mes_anterior: number;
    variacao_percentual: number;
    media_ticket: number;
    clientes_ativos: number;
  } | null;
}

export const SalesDashboardCards = ({ salesData }: SalesDashboardCardsProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SalesDashboardCard
        title="Total de Vendas no Ano"
        value={formatCurrency(salesData?.total_vendas || 0)}
        description="Total acumulado no ano"
        icon="money"
      />
      <SalesDashboardCard
        title={`Vendas (${format(new Date(), 'MMMM', { locale: ptBR })})`}
        value={formatCurrency(salesData?.vendas_mes_atual || 0)}
        description={`vs. ${formatCurrency(salesData?.vendas_mes_anterior || 0)} mês anterior`}
        trend={salesData?.variacao_percentual && salesData.variacao_percentual > 0 ? "up" : "down"}
        trendValue={`${Math.abs(salesData?.variacao_percentual || 0).toFixed(1)}%`}
        icon="chart"
      />
      <SalesDashboardCard
        title="Ticket Médio"
        value={formatCurrency(salesData?.media_ticket || 0)}
        description={`Por venda em ${currentYear}`}
        icon="sales"
      />
      <SalesDashboardCard
        title="Clientes Ativos"
        value={String(salesData?.clientes_ativos || 0)}
        description="Com vendas nos últimos 90 dias"
        icon="users"
      />
    </div>
  );
};
