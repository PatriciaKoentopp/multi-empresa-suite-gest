
import React, { useState } from "react";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import { CrmDashboardHeader } from "@/components/crm/dashboard/CrmDashboardHeader";
import { CrmDateRangeFilter } from "@/components/crm/dashboard/CrmDateRangeFilter";
import { DashboardCardConfigurator } from "@/components/dashboard/DashboardCardConfigurator";
import { LeadsStatsCard } from "@/components/crm/dashboard/LeadsStatsCard";
import { LeadsFunnelChart } from "@/components/crm/dashboard/LeadsFunnelChart";
import { LeadsOriginPieChart } from "@/components/crm/dashboard/LeadsOriginPieChart";
import { LeadsTimelineChart } from "@/components/crm/dashboard/LeadsTimelineChart";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CrmPainelPage() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("todos");
  const [forceRender, setForceRender] = useState(0);
  
  const {
    isLoading,
    startDate,
    endDate,
    setDateRange,
    totalLeads,
    activeLeads,
    leadsByEtapa,
    leadsByOrigin,
    leadsTimeline,
    conversionRate,
    potentialValue,
    funisList,
    filterByFunnelId,
  } = useCrmDashboard(selectedFunnelId === "todos" ? "" : selectedFunnelId);

  const { isCardVisible, refetch: refetchCardsConfig } = useDashboardCards('painel-crm');

  const handleFunnelChange = (value: string) => {
    setSelectedFunnelId(value);
  };

  const handleConfigChange = async () => {
    // Atualizar configuração dos cards
    await refetchCardsConfig();
    // Forçar re-render completo incrementando o estado
    setForceRender(prev => prev + 1);
  };

  // Verificar se algum dos cards de stats está visível
  const hasVisibleStatsCards = [
    'total-leads',
    'leads-ativos',
    'taxa-conversao',
    'valor-potencial'
  ].some(cardId => isCardVisible(cardId));

  return (
    <div className="space-y-6" key={forceRender}>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <CrmDashboardHeader title="Painel do CRM" />
        
        <div className="flex flex-wrap items-center gap-2">
          <DashboardCardConfigurator 
            pageId="painel-crm" 
            onConfigChange={handleConfigChange}
          />
          
          <Select value={selectedFunnelId} onValueChange={handleFunnelChange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Todos os funis" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="todos">Todos os funis</SelectItem>
              {funisList.map((funil) => (
                <SelectItem key={funil.id} value={funil.id}>
                  {funil.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <CrmDateRangeFilter 
            startDate={startDate}
            endDate={endDate}
            onDateChange={setDateRange}
          />
        </div>
      </div>

      {hasVisibleStatsCards && (
        <>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isCardVisible('total-leads') && (
                <LeadsStatsCard
                  title="Total de Leads"
                  value={totalLeads}
                  description="No período selecionado"
                  icon="leads"
                />
              )}
              {isCardVisible('leads-ativos') && (
                <LeadsStatsCard
                  title="Leads Ativos"
                  value={activeLeads}
                  description={`${((activeLeads / totalLeads) * 100).toFixed(1)}% do total`}
                  icon="leads"
                />
              )}
              {isCardVisible('taxa-conversao') && (
                <LeadsStatsCard
                  title="Taxa de Conversão"
                  value={`${conversionRate}%`}
                  description="Leads fechados com sucesso"
                  icon="conversion"
                />
              )}
              {isCardVisible('valor-potencial') && (
                <LeadsStatsCard
                  title="Valor Potencial"
                  value={formatCurrency(potentialValue)}
                  description="Potencial de vendas ativas"
                  icon="value"
                />
              )}
            </div>
          )}
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            {isCardVisible('grafico-funil') && (
              <LeadsFunnelChart
                data={leadsByEtapa}
                title={`Leads por Etapa do Funil ${selectedFunnelId !== "todos" ? '- ' + funisList.find(f => f.id === selectedFunnelId)?.nome : ''}`}
              />
            )}
            {isCardVisible('grafico-origem') && (
              <LeadsOriginPieChart
                data={leadsByOrigin}
                title="Leads por Origem"
              />
            )}
          </>
        )}
      </div>
      
      {isCardVisible('grafico-timeline') && (
        <div className="grid gap-4">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <LeadsTimelineChart
              data={leadsTimeline}
              title="Evolução de Leads no Período"
            />
          )}
        </div>
      )}
    </div>
  );
}
