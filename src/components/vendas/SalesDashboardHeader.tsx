
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SalesDashboardHeader = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Painel de Vendas</h2>
      <p className="text-muted-foreground">
        Visão geral dos dados de vendas atualizados até {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}.
      </p>
    </div>
  );
};
