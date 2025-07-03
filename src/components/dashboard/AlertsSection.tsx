
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertItemProps {
  title: string;
  description: string;
  type: "financeiro" | "vendas" | "crm";
  link: string;
}

const alerts: AlertItemProps[] = [
  {
    title: "Contas a Pagar Vencidas",
    description: "Você possui contas a pagar vencidas. Verifique!",
    type: "financeiro",
    link: "/financeiro/contas-a-pagar",
  },
  {
    title: "Orçamentos Pendentes",
    description: "Há orçamentos aguardando aprovação. Confira!",
    type: "vendas",
    link: "/vendas/orcamento",
  },
  {
    title: "Leads sem Contato",
    description: "Existem leads que precisam de atenção. Visualize!",
    type: "crm",
    link: "/crm/leads",
  },
];

export const AlertsSection = () => {
  const [currentSlide, setCurrentSlide] = useState("0");
  const navigate = useNavigate();

  const handleGoToAlert = (alertType: string) => {
    navigate(alertType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            loop: true,
          }}
          className="relative"
        >
          <CarouselContent>
            {alerts.map((alert, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{alert.title}</h3>
                      <Badge variant="secondary">{alert.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
                    <Button
                      variant="link"
                      className="mt-4"
                      onClick={() => handleGoToAlert(alert.link)}
                    >
                      Ver mais
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2" />
          <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2" />
        </Carousel>
        <div className="flex items-center justify-center gap-2 py-4">
          {alerts.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                currentSlide === index.toString() ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
