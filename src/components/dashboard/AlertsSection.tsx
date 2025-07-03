import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

interface AlertItem {
  id: string;
  title: string;
  description: string;
  date: string;
}

const mockAlerts: AlertItem[] = [
  {
    id: "1",
    title: "Novo Orçamento",
    description: "Um novo orçamento foi criado e aguarda sua aprovação.",
    date: "2024-08-15",
  },
  {
    id: "2",
    title: "Revisão de Contrato",
    description: "O contrato XYZ precisa ser revisado e atualizado.",
    date: "2024-08-10",
  },
  {
    id: "3",
    title: "Pagamento Pendente",
    description: "O pagamento da fatura #123 está pendente.",
    date: "2024-08-05",
  },
];

export function AlertsSection() {
  const [activeTab, setActiveTab] = useState("0");
  const [alerts, setAlerts] = useState(mockAlerts);

  useEffect(() => {
    // Simulação de carregamento de alertas
    setTimeout(() => {
      setAlerts(mockAlerts);
    }, 500);
  }, []);

  const groupedAlerts = alerts.reduce((acc: { [key: string]: AlertItem[] }, alert) => {
    const date = alert.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(alert);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedAlerts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
      </CardHeader>
      <CardContent className="pl-2 pr-2">
        <Tabs defaultValue="0" className="w-full">
          <TabsList>
            {sortedDates.map((date, index) => (
              <TabsTrigger key={index} value={String(index)} onClick={() => setActiveTab(String(index))}>
                {date}
              </TabsTrigger>
            ))}
          </TabsList>
          {sortedDates.map((date, index) => (
            <TabsContent key={String(index)} value={String(index)}>
              <ul>
                {groupedAlerts[date].map((alert) => (
                  <li key={alert.id} className="mb-4">
                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
