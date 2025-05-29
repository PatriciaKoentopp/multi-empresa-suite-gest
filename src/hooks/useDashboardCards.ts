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

export const useDashboardCards = (pageId: string = 'dashboard') => {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [cardsConfig, setCardsConfig] = useState<DashboardCardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configurações padrão dos cards por página
  const defaultCards = {
    dashboard: [
      { card_id: 'alertas', name: 'Alertas', order_position: 1, is_visible: true },
      { card_id: 'vendas-mes', name: 'Vendas do Mês', order_position: 2, is_visible: true },
      { card_id: 'total-orcamentos', name: 'Total de Orçamentos', order_position: 3, is_visible: true },
      { card_id: 'contas-pagar', name: 'Contas a Pagar', order_position: 4, is_visible: true },
      { card_id: 'contas-receber', name: 'Contas a Receber', order_position: 5, is_visible: true },
      { card_id: 'saldo-contas', name: 'Saldo das Contas', order_position: 6, is_visible: true },
      { card_id: 'top-clientes', name: 'Top 5 Clientes', order_position: 7, is_visible: true },
    ],
    'painel-financeiro': [
      { card_id: 'total-receber', name: 'Total a Receber', order_position: 1, is_visible: true },
      { card_id: 'total-pagar', name: 'Total a Pagar', order_position: 2, is_visible: true },
      { card_id: 'saldo-contas', name: 'Saldo em Contas', order_position: 3, is_visible: true },
      { card_id: 'previsao-saldo', name: 'Previsão de Saldo', order_position: 4, is_visible: true },
      { card_id: 'contas-vencidas-receber', name: 'Contas a Receber Vencidas', order_position: 5, is_visible: true },
      { card_id: 'contas-vencer-receber', name: 'Contas a Receber a Vencer', order_position: 6, is_visible: true },
      { card_id: 'contas-vencidas-pagar', name: 'Contas a Pagar Vencidas', order_position: 7, is_visible: true },
      { card_id: 'contas-vencer-pagar', name: 'Contas a Pagar a Vencer', order_position: 8, is_visible: true },
      { card_id: 'filtro-fluxo-caixa', name: 'Filtro do Fluxo de Caixa', order_position: 9, is_visible: true },
      { card_id: 'grafico-fluxo-caixa', name: 'Gráfico do Fluxo de Caixa', order_position: 10, is_visible: true },
      { card_id: 'tabela-fluxo-mensal', name: 'Tabela do Fluxo Mensal', order_position: 11, is_visible: true },
    ],
    'painel-vendas': [
      { card_id: 'vendas-mes-atual', name: 'Vendas do Mês Atual', order_position: 1, is_visible: true },
      { card_id: 'total-vendas-ano', name: 'Total de Vendas no Ano', order_position: 2, is_visible: true },
      { card_id: 'ticket-medio-projeto', name: 'Ticket Médio por Projeto', order_position: 3, is_visible: true },
      { card_id: 'clientes-ativos', name: 'Clientes Ativos', order_position: 4, is_visible: true },
      { card_id: 'tabs-performance', name: 'Abas de Performance', order_position: 5, is_visible: true },
      { card_id: 'tabela-comparacao', name: 'Tabela de Comparação Anual', order_position: 6, is_visible: true },
    ],
    'painel-crm': [
      { card_id: 'total-leads', name: 'Total de Leads', order_position: 1, is_visible: true },
      { card_id: 'leads-ativos', name: 'Leads Ativos', order_position: 2, is_visible: true },
      { card_id: 'taxa-conversao', name: 'Taxa de Conversão', order_position: 3, is_visible: true },
      { card_id: 'valor-potencial', name: 'Valor Potencial', order_position: 4, is_visible: true },
      { card_id: 'grafico-funil', name: 'Gráfico do Funil', order_position: 5, is_visible: true },
      { card_id: 'grafico-origem', name: 'Gráfico por Origem', order_position: 6, is_visible: true },
      { card_id: 'grafico-timeline', name: 'Evolução Temporal', order_position: 7, is_visible: true },
    ]
  };

  const fetchCardsConfig = async () => {
    if (!currentCompany?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('dashboard_cards_config')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', pageId)
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
      const cards = defaultCards[pageId as keyof typeof defaultCards] || [];
      const configsToInsert = cards.map(card => ({
        empresa_id: currentCompany.id,
        page_id: pageId,
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
    if (!currentCompany?.id) return false;

    try {
      const { error } = await supabase
        .from('dashboard_cards_config')
        .update({ is_visible: isVisible })
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', pageId)
        .eq('card_id', cardId);

      if (error) throw error;

      // Atualizar estado local imediatamente
      setCardsConfig(prev => 
        prev.map(card => 
          card.card_id === cardId ? { ...card, is_visible: isVisible } : card
        )
      );

      toast({
        title: "Sucesso",
        description: `Card ${isVisible ? 'habilitado' : 'desabilitado'} com sucesso`
      });

      // Retornar true para indicar sucesso
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar visibilidade do card:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a configuração do card"
      });
      return false;
    }
  };

  const isCardVisible = (cardId: string): boolean => {
    const config = cardsConfig.find(c => c.card_id === cardId);
    return config ? config.is_visible : true;
  };

  const getCardName = (cardId: string): string => {
    const cards = defaultCards[pageId as keyof typeof defaultCards] || [];
    const defaultCard = cards.find(c => c.card_id === cardId);
    return defaultCard ? defaultCard.name : cardId;
  };

  useEffect(() => {
    fetchCardsConfig();
  }, [currentCompany?.id, pageId]);

  return {
    cardsConfig,
    isLoading,
    updateCardVisibility,
    isCardVisible,
    getCardName,
    defaultCards: defaultCards[pageId as keyof typeof defaultCards] || [],
    refetch: fetchCardsConfig
  };
};
