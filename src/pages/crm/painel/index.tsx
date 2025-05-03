
import React, { useState } from "react";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { CrmDashboardHeader } from "@/components/crm/dashboard/CrmDashboardHeader";
import { CrmDateRangeFilter } from "@/components/crm/dashboard/CrmDateRangeFilter";
import { LeadsStatsCard } from "@/components/crm/dashboard/LeadsStatsCard";
import { LeadsFunnelChart } from "@/components/crm/dashboard/LeadsFunnelChart";
import { LeadsOriginPieChart } from "@/components/crm/dashboard/LeadsOriginPieChart";
import { LeadsTimelineChart } from "@/components/crm/dashboard/LeadsTimelineChart";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CrmPainelPage() {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("todos");
  
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

  const handleFunnelChange = (value: string) => {
    setSelectedFunnelId(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CrmDashboardHeader title="Painel do CRM" />
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={selectedFunnelId} onValueChange={handleFunnelChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos os funis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os funis</SelectItem>
              {funisList.map((funil) => (
                <SelectItem key={funil.id} value={funil.id}>
                  {funil.descricao || funil.nome}
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LeadsStatsCard
            title="Total de Leads"
            value={totalLeads}
            description="No período selecionado"
            icon="leads"
          />
          <LeadsStatsCard
            title="Leads Ativos"
            value={activeLeads}
            description={`${((activeLeads / totalLeads) * 100).toFixed(1)}% do total`}
            icon="leads"
          />
          <LeadsStatsCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            description="Leads fechados com sucesso"
            icon="conversion"
          />
          <LeadsStatsCard
            title="Valor Potencial"
            value={formatCurrency(potentialValue)}
            description="Potencial de vendas ativas"
            icon="value"
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            <LeadsFunnelChart
              data={leadsByEtapa}
              title={`Leads por Etapa do Funil ${selectedFunnelId !== "todos" ? '- ' + (funisList.find(f => f.id === selectedFunnelId)?.descricao || funisList.find(f => f.id === selectedFunnelId)?.nome) : ''}`}
            />
            <LeadsOriginPieChart
              data={leadsByOrigin}
              title="Leads por Origem"
            />
          </>
        )}
      </div>
      
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
    </div>
  );
}
