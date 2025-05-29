
import React, { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDashboardCards } from '@/hooks/useDashboardCards';

export const DashboardCardConfigurator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    cardsConfig, 
    isLoading, 
    updateCardVisibility, 
    isCardVisible, 
    getCardName,
    defaultCards 
  } = useDashboardCards();

  const handleVisibilityChange = async (cardId: string, isVisible: boolean) => {
    await updateCardVisibility(cardId, isVisible);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Configurar Cards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Cards do Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais cards deseja exibir no dashboard da sua empresa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {defaultCards.map((card) => (
            <Card key={card.card_id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCardVisible(card.card_id) ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <Label 
                    htmlFor={`card-${card.card_id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {getCardName(card.card_id)}
                  </Label>
                </div>
                <Switch
                  id={`card-${card.card_id}`}
                  checked={isCardVisible(card.card_id)}
                  onCheckedChange={(checked) => 
                    handleVisibilityChange(card.card_id, checked)
                  }
                />
              </div>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
