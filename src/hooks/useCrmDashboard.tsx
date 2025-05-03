
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format, subDays, startOfMonth } from "date-fns";

interface DashboardLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  etapa_id: string;
  etapa_nome?: string;
  etapa_cor?: string;
  funil_id: string;
  funil_nome?: string;
  valor: number;
  created_at: string;
  data_criacao: string;
  origem_id: string;
  origem_nome?: string;
  status: string;
}

interface FunnelData {
  nome: string;
  quantidade: number;
  valor: number;
  color: string;
}

interface OriginData {
  name: string;
  value: number;
  color: string;
}

interface TimelineData {
  name: string;
  value: number;
}

interface UseCrmDashboardResult {
  isLoading: boolean;
  startDate: Date;
  endDate: Date;
  setDateRange: (start: Date, end: Date) => void;
  totalLeads: number;
  activeLeads: number;
  leadsByEtapa: FunnelData[];
  leadsByOrigin: OriginData[];
  leadsTimeline: TimelineData[];
  conversionRate: number;
  potentialValue: number;
}

const getRandomColor = () => {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6366F1", // indigo
    "#D97706", // yellow
    "#059669", // emerald
    "#DC2626", // red
    "#7C3AED", // violet
    "#2563EB", // blue
    "#9333EA", // purple
    "#F43F5E", // rose
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useCrmDashboard = (): UseCrmDashboardResult => {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [origens, setOrigens] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchEtapas = async () => {
    if (!currentCompany) return;
    
    try {
      const { data } = await supabase
        .from("funil_etapas")
        .select("id, nome, cor, funil_id, funis(nome)")
        .order("ordem", { ascending: true });
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar etapas:", error);
      return [];
    }
  };

  const fetchOrigens = async () => {
    if (!currentCompany) return;
    
    try {
      const { data } = await supabase
        .from("origens")
        .select("id, nome")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar origens:", error);
      return [];
    }
  };

  const fetchLeads = async () => {
    if (!currentCompany) return;
    
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .gte("data_criacao", format(startDate, "yyyy-MM-dd"))
        .lte("data_criacao", format(endDate, "yyyy-MM-dd"));
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or date range changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany) return;
      
      setIsLoading(true);
      try {
        const [etapasData, origensData, leadsData] = await Promise.all([
          fetchEtapas(),
          fetchOrigens(),
          fetchLeads(),
        ]);
        
        setEtapas(etapasData || []);
        setOrigens(origensData || []);
        
        // Adicionar informações de etapa e origem aos leads
        const enrichedLeads = (leadsData || []).map((lead: any) => {
          const etapa = etapasData?.find((e) => e.id === lead.etapa_id);
          const origem = origensData?.find((o) => o.id === lead.origem_id);
          
          return {
            ...lead,
            etapa_nome: etapa?.nome || "Não especificada",
            etapa_cor: etapa?.cor || "#999999",
            funil_nome: etapa?.funis?.nome || "Não especificado",
            origem_nome: origem?.nome || "Não especificada",
          };
        });
        
        setLeads(enrichedLeads);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentCompany, startDate, endDate]);

  const setDateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Cálculos dos dados para os gráficos
  const totalLeads = useMemo(() => leads.length, [leads]);
  
  const activeLeads = useMemo(() => 
    leads.filter(lead => lead.status === "ativo").length, 
  [leads]);

  const leadsByEtapa: FunnelData[] = useMemo(() => {
    const etapasMap = new Map<string, { quantidade: number; valor: number; cor: string }>();
    
    leads.forEach(lead => {
      if (lead.etapa_nome) {
        const current = etapasMap.get(lead.etapa_nome) || { quantidade: 0, valor: 0, cor: lead.etapa_cor || getRandomColor() };
        etapasMap.set(lead.etapa_nome, {
          quantidade: current.quantidade + 1,
          valor: current.valor + (lead.valor || 0),
          cor: current.cor,
        });
      }
    });
    
    return Array.from(etapasMap.entries()).map(([nome, data]) => ({
      nome,
      quantidade: data.quantidade,
      valor: data.valor,
      color: data.cor,
    }));
  }, [leads]);

  const leadsByOrigin: OriginData[] = useMemo(() => {
    const origensMap = new Map<string, number>();
    
    leads.forEach(lead => {
      const origem = lead.origem_nome || "Não especificada";
      origensMap.set(origem, (origensMap.get(origem) || 0) + 1);
    });
    
    return Array.from(origensMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: getRandomColor(),
      }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const leadsTimeline: TimelineData[] = useMemo(() => {
    const timelineMap = new Map<string, number>();
    
    leads.forEach(lead => {
      const date = lead.data_criacao ? format(new Date(lead.data_criacao), "dd/MM") : "Sem data";
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });
    
    return Array.from(timelineMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [dayA, monthA] = a.name.split('/').map(Number);
        const [dayB, monthB] = b.name.split('/').map(Number);
        
        if (monthA !== monthB) {
          return monthA - monthB;
        }
        return dayA - dayB;
      });
  }, [leads]);

  // Taxa de conversão (estimada com base em leads fechados vs total)
  const conversionRate = useMemo(() => {
    const closed = leads.filter(lead => lead.status !== "ativo").length;
    return totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;
  }, [leads, totalLeads]);

  // Valor potencial (soma do valor de leads ativos)
  const potentialValue = useMemo(() => 
    leads
      .filter(lead => lead.status === "ativo")
      .reduce((sum, lead) => sum + (lead.valor || 0), 0),
  [leads]);

  return {
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
  };
};
