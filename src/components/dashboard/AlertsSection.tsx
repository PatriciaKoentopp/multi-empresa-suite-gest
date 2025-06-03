
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface Alert {
  id: string;
  type: "warning" | "info" | "error";
  message: string;
  action?: string;
}

interface AlertsSectionProps {
  alerts: Alert[];
}

export const AlertsSection = ({ alerts }: AlertsSectionProps) => {
  const { isCardVisible } = useDashboardCards('dashboard');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (!isCardVisible('alerts') || !alerts || alerts.length === 0) {
    return null;
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

  if (visibleAlerts.length === 0) {
    return null;
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
