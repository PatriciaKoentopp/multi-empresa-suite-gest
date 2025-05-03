
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

interface Funil {
  id: string;
  nome: string;
  descricao?: string;
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
  funisList: Funil[];
  filterByFunnelId: (funnelId: string) => void;
}

const getRandomColor = () => {
  const colors = [
    "#9b87f5", // roxo principal
    "#E5DEFF", // roxo claro
    "#1EAEDB", // azul brilhante
    "#33C3F0", // azul céu
    "#4CAF50", // verde
    "#F59E0B", // âmbar
    "#EC4899", // rosa
    "#8B5CF6", // roxo
    "#6366F1", // índigo
    "#069669", // esmeralda
    "#6B7280", // cinza cool
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useCrmDashboard = (funnelId?: string): UseCrmDashboardResult => {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<DashboardLead[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);
  const [origens, setOrigens] = useState<any[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchFunis = async () => {
    if (!currentCompany) return [];
    
    try {
      const { data } = await supabase
        .from("funis")
        .select("id, nome, descricao")
        .eq("empresa_id", currentCompany.id)
        .eq("ativo", true);
      
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar funis:", error);
      return [];
    }
  };

  const fetchEtapas = async () => {
    if (!currentCompany) return [];
    
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
    if (!currentCompany) return [];
    
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
    if (!currentCompany) return [];
    
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .neq("status", "inativo") // Filtrar excluindo apenas leads inativos
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

  // Carregar dados quando o componente monta ou o intervalo de datas muda
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany) return;
      
      setIsLoading(true);
      try {
        const [funisData, etapasData, origensData, leadsData] = await Promise.all([
          fetchFunis(),
          fetchEtapas(),
          fetchOrigens(),
          fetchLeads(),
        ]);
        
        setFunis(funisData || []);
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
        setFilteredLeads(enrichedLeads);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentCompany, startDate, endDate]);

  // Filtrar leads por funil quando o funnelId mudar
  useEffect(() => {
    if (funnelId && funnelId !== "") {
      const filtered = leads.filter(lead => lead.funil_id === funnelId);
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  }, [leads, funnelId]);

  const setDateRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const filterByFunnelId = (funnelId: string) => {
    if (funnelId && funnelId !== "") {
      const filtered = leads.filter(lead => lead.funil_id === funnelId);
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  };

  const totalLeads = useMemo(() => filteredLeads.length, [filteredLeads]);
  
  const activeLeads = useMemo(() => 
    filteredLeads.filter(lead => lead.status === "ativo").length, 
  [filteredLeads]);

  const leadsByEtapa: FunnelData[] = useMemo(() => {
    const etapasMap = new Map<string, { quantidade: number; valor: number; cor: string }>();
    
    filteredLeads.forEach(lead => {
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
  }, [filteredLeads]);

  const leadsByOrigin: OriginData[] = useMemo(() => {
    const origensMap = new Map<string, number>();
    
    filteredLeads.forEach(lead => {
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
  }, [filteredLeads]);

  const leadsTimeline: TimelineData[] = useMemo(() => {
    const timelineMap = new Map<string, number>();
    
    filteredLeads.forEach(lead => {
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
  }, [filteredLeads]);

  // Taxa de conversão (estimada com base em leads fechados vs total)
  const conversionRate = useMemo(() => {
    const closed = filteredLeads.filter(lead => lead.status !== "ativo").length;
    return totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;
  }, [filteredLeads, totalLeads]);

  // Valor potencial (soma do valor de leads ativos)
  const potentialValue = useMemo(() => 
    filteredLeads
      .filter(lead => lead.status === "ativo")
      .reduce((sum, lead) => sum + (lead.valor || 0), 0),
  [filteredLeads]);

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
    funisList: funis,
    filterByFunnelId,
  };
};
