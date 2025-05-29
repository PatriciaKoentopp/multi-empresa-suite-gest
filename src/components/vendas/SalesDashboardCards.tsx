
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface SalesDashboardCardsProps {
  salesData: {
    total_vendas: number;
    vendas_mes_atual: number;
    vendas_mes_anterior: number;
    variacao_percentual: number;
    media_ticket: number;
    clientes_ativos: number;
    media_ticket_projeto: number; // Campo para ticket médio por projeto
  } | null;
}

export const SalesDashboardCards = ({ salesData }: SalesDashboardCardsProps) => {
  const currentYear = new Date().getFullYear();
  const { isCardVisible } = useDashboardCards('painel-vendas');
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isCardVisible('total-vendas-ano') && (
        <SalesDashboardCard
          title="Total de Vendas no Ano"
          value={formatCurrency(salesData?.total_vendas || 0)}
          description="Total acumulado no ano"
          icon="money"
        />
      )}
      {isCardVisible('vendas-mes-anual') && (
        <SalesDashboardCard
          title={`Vendas (${format(new Date(), 'MMMM', { locale: ptBR })})`}
          value={formatCurrency(salesData?.vendas_mes_atual || 0)}
          description={`vs. ${formatCurrency(salesData?.vendas_mes_anterior || 0)} mês anterior`}
          trend={salesData?.variacao_percentual && salesData.variacao_percentual > 0 ? "up" : "down"}
          trendValue={`${Math.abs(salesData?.variacao_percentual || 0).toFixed(1)}%`}
          icon="chart"
        />
      )}
      {isCardVisible('ticket-medio-projeto') && (
        <SalesDashboardCard
          title="Ticket Médio por Projeto"
          value={formatCurrency(salesData?.media_ticket_projeto || 0)}
          description={`Por projeto em ${currentYear}`}
          icon="sales"
        />
      )}
      {isCardVisible('clientes-ativos') && (
        <SalesDashboardCard
          title="Clientes Ativos"
          value={String(salesData?.clientes_ativos || 0)}
          description="Com vendas nos últimos 90 dias"
          icon="users"
        />
      )}
    </div>
  );
};
