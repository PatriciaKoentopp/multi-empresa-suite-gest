
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export function useDashboardConfig(pageId: string) {
  const { currentCompany } = useCompany();

  const updateCardVisibility = async (cardId: string, isVisible: boolean, orderPosition: string) => {
    if (!currentCompany?.id) return;

    try {
      const { error } = await supabase
        .from("dashboard_cards_config")
        .upsert({
          empresa_id: currentCompany.id,
          page_id: pageId,
          card_id: cardId,
          is_visible: isVisible,
          order_position: parseInt(orderPosition) || 0
        });

      if (error) {
        console.error("Erro ao atualizar configuração do card:", error);
      }
    } catch (error) {
      console.error("Erro ao atualizar configuração do card:", error);
    }
  };

  return {
    updateCardVisibility
  };
}
