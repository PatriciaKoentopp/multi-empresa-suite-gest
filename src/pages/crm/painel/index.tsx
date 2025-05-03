
import React from "react";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { CrmDashboardHeader } from "@/components/crm/dashboard/CrmDashboardHeader";
import { CrmDateRangeFilter } from "@/components/crm/dashboard/CrmDateRangeFilter";
import { LeadsStatsCard } from "@/components/crm/dashboard/LeadsStatsCard";
import { LeadsFunnelChart } from "@/components/crm/dashboard/LeadsFunnelChart";
import { LeadsOriginPieChart } from "@/components/crm/dashboard/LeadsOriginPieChart";
import { LeadsTimelineChart } from "@/components/crm/dashboard/LeadsTimelineChart";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function CrmPainelPage() {
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
  } = useCrmDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CrmDashboardHeader title="Painel do CRM" />
        <CrmDateRangeFilter 
          startDate={startDate}
          endDate={endDate}
          onDateChange={setDateRange}
        />
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

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </>
        ) : (
          <>
            <LeadsFunnelChart
              data={leadsByEtapa}
              title="Leads por Etapa do Funil"
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
