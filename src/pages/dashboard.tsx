
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompany } from "@/contexts/company-context";
import { SalesDashboardCard } from "@/components/vendas/SalesDashboardCard";
import { DollarSign, TrendingUp, ShoppingBag, Users } from "lucide-react";

export function Dashboard() {
  const { currentCompany } = useCompany();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da empresa {currentCompany?.nomeFantasia || ""}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SalesDashboardCard
          title="Vendas Totais"
          value="R$ 45.231,89"
          description="+20.1% em relação ao mês passado"
          icon="money"
        />
        <SalesDashboardCard
          title="Contas a Receber"
          value="R$ 12.450,00"
          description="5 títulos pendentes"
          icon="chart"
        />
        <SalesDashboardCard
          title="Contas a Pagar"
          value="R$ 8.230,50"
          description="3 títulos pendentes"
          icon="sales"
        />
        <SalesDashboardCard
          title="Novos Clientes"
          value="+12"
          description="+30% em relação ao mês passado"
          icon="users"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
            <CardDescription>
              Últimos pedidos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Empresa ABC Ltda</p>
                  <p className="text-sm text-muted-foreground">Pedido #1234</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ 12.400,00</p>
                  <p className="text-sm text-muted-foreground">10/04/2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">XYZ Comércio S.A.</p>
                  <p className="text-sm text-muted-foreground">Pedido #1233</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ 8.750,00</p>
                  <p className="text-sm text-muted-foreground">09/04/2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Indústria QWE</p>
                  <p className="text-sm text-muted-foreground">Pedido #1232</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ 5.320,50</p>
                  <p className="text-sm text-muted-foreground">08/04/2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
            <CardDescription>
              Suas tarefas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-4 w-4 rounded-full border border-primary"></div>
                <div>
                  <p className="font-medium">Ligação para cliente Empresa ABC</p>
                  <p className="text-sm text-muted-foreground">
                    Agendado para 15:00
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-4 w-4 rounded-full border border-primary"></div>
                <div>
                  <p className="font-medium">Aprovar pagamentos</p>
                  <p className="text-sm text-muted-foreground">
                    3 pagamentos aguardando aprovação
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-4 w-4 rounded-full border border-primary"></div>
                <div>
                  <p className="font-medium">Revisar relatório mensal</p>
                  <p className="text-sm text-muted-foreground">
                    Prazo até o final do dia
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
