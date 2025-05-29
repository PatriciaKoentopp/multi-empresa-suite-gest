
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { useToast } from "@/hooks/use-toast";

export interface DashboardCardConfig {
  id: string;
  empresa_id: string;
  page_id: string;
  card_id: string;
  is_visible: boolean;
  order_position: number;
}

export const useDashboardConfig = (pageId: string = 'dashboard') => {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações dos cards
  const { data: config, isLoading } = useQuery({
    queryKey: ['dashboard-config', currentCompany?.id, pageId],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('dashboard_cards_config')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', pageId)
        .order('order_position');

      if (error) {
        console.error('Erro ao buscar configuração do dashboard:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  // Função para verificar se um card está visível
  const isCardVisible = (cardId: string): boolean => {
    const cardConfig = config?.find(c => c.card_id === cardId);
    return cardConfig?.is_visible ?? true; // Padrão: visível se não configurado
  };

  // Função para obter cards visíveis ordenados
  const getVisibleCards = () => {
    return config
      ?.filter(c => c.is_visible)
      ?.sort((a, b) => a.order_position - b.order_position) || [];
  };

  // Mutation para atualizar configuração de um card
  const updateCardConfig = useMutation({
    mutationFn: async ({ cardId, isVisible, orderPosition }: {
      cardId: string;
      isVisible?: boolean;
      orderPosition?: number;
    }) => {
      if (!currentCompany?.id) throw new Error('Empresa não encontrada');

      console.log('Atualizando configuração:', { cardId, isVisible, orderPosition });

      // Buscar configuração existente
      const { data: existingConfig } = await supabase
        .from('dashboard_cards_config')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('page_id', pageId)
        .eq('card_id', cardId)
        .single();

      if (existingConfig) {
        // Atualizar configuração existente
        const updates: any = {};
        if (isVisible !== undefined) updates.is_visible = isVisible;
        if (orderPosition !== undefined) updates.order_position = orderPosition;

        const { data, error } = await supabase
          .from('dashboard_cards_config')
          .update(updates)
          .eq('id', existingConfig.id)
          .select();

        if (error) throw error;
        return data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('dashboard_cards_config')
          .insert({
            empresa_id: currentCompany.id,
            page_id: pageId,
            card_id: cardId,
            is_visible: isVisible ?? true,
            order_position: orderPosition ?? 0
          })
          .select();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-config', currentCompany?.id, pageId] });
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso."
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações."
      });
    }
  });

  return {
    config,
    isLoading,
    isCardVisible,
    getVisibleCards,
    updateCardConfig: updateCardConfig.mutate,
    isUpdating: updateCardConfig.isPending
  };
};
