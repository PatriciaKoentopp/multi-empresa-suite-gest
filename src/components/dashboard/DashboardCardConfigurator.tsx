
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

interface DashboardCardConfiguratorProps {
  pageId?: string;
  onConfigChange?: () => void;
}

export const DashboardCardConfigurator = ({ 
  pageId = 'dashboard', 
  onConfigChange 
}: DashboardCardConfiguratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    cardsConfig, 
    isLoading, 
    updateCardVisibility, 
    isCardVisible, 
    getCardName,
    defaultCards 
  } = useDashboardCards(pageId);

  const handleVisibilityChange = async (cardId: string, isVisible: boolean) => {
    const success = await updateCardVisibility(cardId, isVisible);
    
    // Se a atualização foi bem-sucedida e há callback, executar
    if (success && onConfigChange) {
      onConfigChange();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Chamar callback quando fechar o modal
    if (onConfigChange) {
      onConfigChange();
    }
  };

  if (isLoading) {
    return null;
  }

  const getPageTitle = () => {
    switch (pageId) {
      case 'painel-financeiro':
        return 'Configurar Cards do Painel Financeiro';
      case 'painel-vendas':
        return 'Configurar Cards do Painel de Vendas';
      case 'dashboard':
      default:
        return 'Configurar Cards do Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (pageId) {
      case 'painel-financeiro':
        return 'Escolha quais cards deseja exibir no painel financeiro da sua empresa.';
      case 'painel-vendas':
        return 'Escolha quais cards deseja exibir no painel de vendas da sua empresa.';
      case 'dashboard':
      default:
        return 'Escolha quais cards deseja exibir no dashboard da sua empresa.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open && onConfigChange) {
        onConfigChange();
      }
    }}>
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
          <DialogTitle>{getPageTitle()}</DialogTitle>
          <DialogDescription>
            {getPageDescription()}
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
          <Button onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
