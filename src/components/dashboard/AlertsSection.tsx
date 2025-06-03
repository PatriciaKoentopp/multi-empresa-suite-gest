import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Calendar, TrendingUp, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format, addDays, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";

export function AlertsSection() {
  const { currentCompany } = useCompany();
  const [isVisible, setIsVisible] = useState(true);
  
  const { updateCardVisibility } = useDashboardConfig("dashboard");

  const { data: contasReceberProximas, isLoading: isLoadingContasReceber } = useQuery({
    queryKey: ["contas-receber-proximas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const today = new Date();
      const sevenDaysLater = addDays(today, 7);

      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .lte("data_vencimento", format(sevenDaysLater, "yyyy-MM-dd"))
        .gte("data_vencimento", format(today, "yyyy-MM-dd"))
        .is("data_pagamento", null);

      if (error) {
        console.error("Erro ao buscar contas a receber próximas:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const { data: contasPagarAtrasadas, isLoading: isLoadingContasPagar } = useQuery({
    queryKey: ["contas-pagar-atrasadas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const today = new Date();

      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .lt("data_vencimento", format(today, "yyyy-MM-dd"))
        .is("data_pagamento", null);

      if (error) {
        console.error("Erro ao buscar contas a pagar atrasadas:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const { data: totalContasReceberAtrasadas, isLoading: isLoadingTotalReceberAtrasadas } = useQuery({
    queryKey: ["total-contas-receber-atrasadas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return 0;

      const today = new Date();

      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select("valor")
        .eq("empresa_id", currentCompany.id)
        .lt("data_vencimento", format(today, "yyyy-MM-dd"))
        .is("data_pagamento", null);

      if (error) {
        console.error("Erro ao buscar total de contas a receber atrasadas:", error);
        return 0;
      }

      const total = data?.reduce((acc, item) => acc + item.valor, 0) || 0;
      return total;
    },
    enabled: !!currentCompany?.id,
  });

  const { data: totalContasPagarProximas, isLoading: isLoadingTotalPagarProximas } = useQuery({
    queryKey: ["total-contas-pagar-proximas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return 0;

      const today = new Date();
      const sevenDaysLater = addDays(today, 7);

      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select("valor")
        .eq("empresa_id", currentCompany.id)
        .lte("data_vencimento", format(sevenDaysLater, "yyyy-MM-dd"))
        .gte("data_vencimento", format(today, "yyyy-MM-dd"))
        .is("data_pagamento", null);

      if (error) {
        console.error("Erro ao buscar total de contas a pagar próximas:", error);
        return 0;
      }

      const total = data?.reduce((acc, item) => acc + item.valor, 0) || 0;
      return total;
    },
    enabled: !!currentCompany?.id,
  });

  const handleToggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    await updateCardVisibility("alertas", newVisibility, String(isVisible ? 1 : 0));
  };

  const handleCardClick = () => {
    const cardElement = document.querySelector('[data-card="alertas"]');
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Card data-card="alertas">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          Alertas
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleToggleVisibility}>
          {isVisible ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Ocultar
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Mostrar
            </>
          )}
        </Button>
      </CardHeader>
      {isVisible && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">
                {isLoadingContasPagar ? "Carregando..." : `${contasPagarAtrasadas?.length || 0} conta(s) a pagar atrasada(s)`}
              </span>
              {!isLoadingContasPagar && contasPagarAtrasadas?.length > 0 && (
                <Badge variant="destructive">
                  {formatCurrency(totalContasReceberAtrasadas || 0)}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">
                {isLoadingContasReceber ? "Carregando..." : `${contasReceberProximas?.length || 0} conta(s) a receber próxima(s)`}
              </span>
              {!isLoadingContasReceber && contasReceberProximas?.length > 0 && (
                <Badge variant="secondary">
                  {formatCurrency(totalContasPagarProximas || 0)}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">
                Próximo vencimento:{" "}
                {isLoadingContasPagar
                  ? "Carregando..."
                  : contasPagarAtrasadas?.length > 0
                    ? format(parseISO(contasPagarAtrasadas[0].data_vencimento), "dd/MM/yyyy")
                    : "Nenhum"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">
                Total de vendas este mês:{" "}
                {isLoadingContasReceber ? "Carregando..." : formatCurrency(15000)}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
