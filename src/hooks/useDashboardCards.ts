
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import { useToast } from '@/components/ui/use-toast';

export interface DashboardCardConfig {
  id: string;
  card_id: string;
  is_visible: boolean;
  order_position: number;
}

export const useDashboardCards = () => {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [cardsConfig, setCardsConfig] = useState<DashboardCardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configurações padrão dos cards
  const defaultCards = [
    { card_id: 'alertas', name: 'Alertas', order_position: 1, is_visible: true },
    { card_id: 'vendas-mes', name: 'Vendas do Mês', order_position: 2, is_visible: true },
    { card_id: 'total-orcamentos', name: 'Total de Orçamentos', order_position: 3, is_visible: true },
    { card_id: 'contas-pagar', name: 'Contas a Pagar', order_position: 4, is_visible: true },
    { card_id: 'contas-receber', name: 'Contas a Receber', order_position: 5, is_visible: true },
    { card_id: 'saldo-contas', name: 'Saldo das Contas', order_position: 6, is_visible: true },
    { card_id: 'top-clientes', name: 'Top 5 Clientes', order_position: 7, is_visible: true },
  ];

  const fetchCardsConfig = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('dashboard_cards_config')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', 'dashboard')
        .order('order_position');

      if (error) throw error;

      // Se não há configuração salva, criar configurações padrão
      if (!data || data.length === 0) {
        await createDefaultConfig();
        return;
      }

      setCardsConfig(data);
    } catch (error: any) {
      console.error('Erro ao buscar configuração dos cards:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a configuração dos cards"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    if (!currentCompany?.id) return;

    try {
      const configsToInsert = defaultCards.map(card => ({
        empresa_id: currentCompany.id,
        page_id: 'dashboard',
        card_id: card.card_id,
        is_visible: card.is_visible,
        order_position: card.order_position
      }));

      const { data, error } = await supabase
        .from('dashboard_cards_config')
        .insert(configsToInsert)
        .select();

      if (error) throw error;
      
      if (data) {
        setCardsConfig(data);
      }
    } catch (error: any) {
      console.error('Erro ao criar configuração padrão:', error);
    }
  };

  const updateCardVisibility = async (cardId: string, isVisible: boolean) => {
    if (!currentCompany?.id) return;

    try {
      const { error } = await supabase
        .from('dashboard_cards_config')
        .update({ is_visible: isVisible })
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', 'dashboard')
        .eq('card_id', cardId);

      if (error) throw error;

      setCardsConfig(prev => 
        prev.map(card => 
          card.card_id === cardId ? { ...card, is_visible: isVisible } : card
        )
      );

      toast({
        title: "Sucesso",
        description: `Card ${isVisible ? 'habilitado' : 'desabilitado'} com sucesso`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar visibilidade do card:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração do card"
      });
    }
  };

  const isCardVisible = (cardId: string): boolean => {
    const config = cardsConfig.find(c => c.card_id === cardId);
    return config ? config.is_visible : true;
  };

  const getCardName = (cardId: string): string => {
    const defaultCard = defaultCards.find(c => c.card_id === cardId);
    return defaultCard ? defaultCard.name : cardId;
  };

  useEffect(() => {
    fetchCardsConfig();
  }, [currentCompany?.id]);

  return {
    cardsConfig,
    isLoading,
    updateCardVisibility,
    isCardVisible,
    getCardName,
    defaultCards,
    refetch: fetchCardsConfig
  };
};
