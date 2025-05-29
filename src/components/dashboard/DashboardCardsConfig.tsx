
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, GripVertical } from "lucide-react";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { getDashboardCards } from "@/config/dashboard-cards-registry";

export const DashboardCardsConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config, isCardVisible, updateCardConfig, isUpdating } = useDashboardConfig();
  const availableCards = getDashboardCards();

  const handleToggleCard = (cardId: string, isVisible: boolean) => {
    updateCardConfig({ cardId, isVisible });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vendas': return 'bg-green-100 text-green-800';
      case 'financeiro': return 'bg-blue-100 text-blue-800';
      case 'geral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurar Cards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração do Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais cards devem aparecer no seu dashboard e organize a ordem de exibição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {availableCards.map((card) => (
            <Card key={card.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div>
                      <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
                      <CardDescription className="text-xs">{card.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getCategoryColor(card.category)}>
                      {card.category}
                    </Badge>
                    <Switch
                      checked={isCardVisible(card.id)}
                      onCheckedChange={(checked) => handleToggleCard(card.id, checked)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {availableCards.filter(card => isCardVisible(card.id)).length} de {availableCards.length} cards ativos
          </p>
          <Button onClick={() => setIsOpen(false)}>
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
