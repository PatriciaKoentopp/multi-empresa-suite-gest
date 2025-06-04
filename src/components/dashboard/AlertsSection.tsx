
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X } from "lucide-react";
import { ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import { LeadInteracao } from "@/pages/crm/leads/types";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface AlertsSectionProps {
  parcelasVencidas: ContaReceber[];
  parcelasHoje: ContaReceber[];
  interacoesPendentes: LeadInteracao[];
  isLoading: boolean;
}

export const AlertsSection = ({ 
  parcelasVencidas, 
  parcelasHoje, 
  interacoesPendentes, 
  isLoading 
}: AlertsSectionProps) => {
  const { isCardVisible } = useDashboardCards('dashboard');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (!isCardVisible('alertas')) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Carregando alertas...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Criar alertas baseado nos dados
  const alerts: {
    id: string;
    type: "warning" | "info" | "error";
    message: string;
    action?: string;
  }[] = [];

  // Alertas de parcelas vencidas
  if (parcelasVencidas && parcelasVencidas.length > 0) {
    alerts.push({
      id: "parcelas-vencidas",
      type: "error",
      message: `${parcelasVencidas.length} conta(s) em atraso`,
      action: "Verifique as contas a receber e a pagar vencidas"
    });
  }

  // Alertas de parcelas que vencem hoje
  if (parcelasHoje && parcelasHoje.length > 0) {
    alerts.push({
      id: "parcelas-hoje",
      type: "warning",
      message: `${parcelasHoje.length} conta(s) vencem hoje`,
      action: "Providencie o pagamento das contas que vencem hoje"
    });
  }

  // Alertas de interações pendentes
  if (interacoesPendentes && interacoesPendentes.length > 0) {
    alerts.push({
      id: "interacoes-pendentes",
      type: "info",
      message: `${interacoesPendentes.length} interação(ões) de leads pendente(s)`,
      action: "Verifique as interações de leads que precisam de atenção"
    });
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  // Se não há alertas, mostrar mensagem
  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Nenhum alerta no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alertas do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {getIcon(alert.type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                )}
              </div>
              <Badge variant={getBadgeVariant(alert.type)} className="ml-2">
                {alert.type === "warning" ? "Atenção" : 
                 alert.type === "error" ? "Erro" : "Info"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissAlert(alert.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
