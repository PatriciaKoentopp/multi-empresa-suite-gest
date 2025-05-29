
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, BanknoteIcon } from "lucide-react";

interface DashboardCardRendererProps {
  cardId: string;
  dashboardData: any;
}

export const DashboardCardRenderer = ({ cardId, dashboardData }: DashboardCardRendererProps) => {
  const renderCard = () => {
    switch (cardId) {
      case 'vendas-mes':
        return (
          <SalesDashboardCard 
            title="Vendas do Mês" 
            value={formatCurrency(dashboardData?.totalVendas || 0)} 
            description="Total do mês atual" 
            icon="money" 
          />
        );

      case 'total-orcamentos':
        return (
          <SalesDashboardCard 
            title="Total de Orçamentos" 
            value={formatCurrency(dashboardData?.totalOrcamentos || 0)} 
            description="Soma de todos os orçamentos ativos" 
            icon="chart" 
          />
        );

      case 'contas-pagar':
        return (
          <SalesDashboardCard 
            title="Contas a Pagar" 
            value={formatCurrency(dashboardData?.contasPagar || 0)} 
            description="Pagamentos pendentes" 
            icon="sales" 
          />
        );

      case 'contas-receber':
        return (
          <SalesDashboardCard 
            title="Contas a Receber" 
            value={formatCurrency(dashboardData?.contasReceber || 0)} 
            description={`${dashboardData?.parcelasEmAtraso?.filter(p => p.tipo === 'receber')?.length || 0} título(s) em atraso`} 
            icon="users" 
          />
        );

      case 'saldo-contas':
        return (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-500" /> 
                Saldo das Contas
              </CardTitle>
              <CardDescription>
                Saldo atual em contas correntes consideradas no cálculo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.saldoContas?.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <p className="font-semibold text-lg">Saldo Total</p>
                    <p className={`font-bold text-lg ${dashboardData.totalSaldo > 0 ? 'text-green-600' : dashboardData.totalSaldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatCurrency(dashboardData.totalSaldo)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {dashboardData.saldoContas
                      .filter(conta => conta.considerar_saldo)
                      .map(conta => (
                        <div key={conta.id} className="flex items-center justify-between">
                          <p className="text-gray-800">{conta.nome}</p>
                          <p className={`${conta.saldo > 0 ? 'text-green-600' : conta.saldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {formatCurrency(conta.saldo)}
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma conta corrente encontrada
                </p>
              )}
            </CardContent>
          </Card>
        );

      case 'top-clientes':
        return (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BanknoteIcon className="h-5 w-5 text-blue-500" />
                Top 5 Clientes
              </CardTitle>
              <CardDescription>
                Clientes com maior valor de vendas em {new Date().getFullYear()} e {new Date().getFullYear() - 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 pr-2 w-[25%]">Cliente</th>
                      <th className="text-right pb-2 pr-8 w-[25%]">{new Date().getFullYear()}</th>
                      <th className="text-left pb-2 pl-8 w-[25%]">Cliente</th>
                      <th className="text-right pb-2 w-[25%]">{new Date().getFullYear() - 1}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium pr-2">
                          {dashboardData?.topClientesAnoAtual?.[index]?.nomeFantasia || 
                           dashboardData?.topClientesAnoAtual?.[index]?.nome || "-"}
                        </td>
                        <td className="py-2 text-right pr-8">
                          {dashboardData?.topClientesAnoAtual?.[index]
                            ? formatCurrency(dashboardData.topClientesAnoAtual[index].totalVendas)
                            : "-"}
                        </td>
                        <td className="py-2 font-medium pl-8 border-l">
                          {dashboardData?.topClientesAnoAnterior?.[index]?.nomeFantasia || 
                           dashboardData?.topClientesAnoAnterior?.[index]?.nome || "-"}
                        </td>
                        <td className="py-2 text-right">
                          {dashboardData?.topClientesAnoAnterior?.[index]
                            ? formatCurrency(dashboardData.topClientesAnoAnterior[index].totalVendas)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );

      case 'alertas':
        return (
          <div className="col-span-full">
            <AlertsSection 
              parcelasVencidas={dashboardData?.parcelasEmAtraso || []}
              parcelasHoje={dashboardData?.parcelasHoje || []}
              interacoesPendentes={dashboardData?.interacoesPendentes || []}
              isLoading={false}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return renderCard();
};
