import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { getIconForInteraction } from "../leads/utils/leadUtils";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isToday,
  addMonths, 
  subMonths 
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Interacao {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string;
  data: string;
  status: string;
  lead_nome: string;
  lead_empresa: string | null;
}

// Componente Chip da Interação
const InteracaoChip = ({ 
  interacao, 
  onClick 
}: { 
  interacao: Interacao; 
  onClick: (leadId: string) => void;
}) => {
  const isRealizado = interacao.status === "Realizado";
  
  return (
    <div
      className={cn(
        "text-xs px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center gap-1 transition-colors",
        isRealizado 
          ? "bg-green-100 text-green-800 hover:bg-green-200" 
          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick(interacao.lead_id);
      }}
      title={`${interacao.descricao} - ${interacao.lead_nome}`}
    >
      <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3">
        {getIconForInteraction(interacao.tipo)}
      </span>
      <span className="truncate">{interacao.lead_nome}</span>
    </div>
  );
};

// Componente Célula do Dia
const DayCell = ({ 
  date, 
  isCurrentMonth, 
  isTodayDate, 
  interacoes, 
  onInteracaoClick 
}: { 
  date: Date;
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  interacoes: Interacao[];
  onInteracaoClick: (leadId: string) => void;
}) => {
  const maxVisible = 3;
  const hasMore = interacoes.length > maxVisible;
  const visibleInteracoes = interacoes.slice(0, maxVisible);
  const remaining = interacoes.length - maxVisible;

  return (
    <div 
      className={cn(
        "min-h-[100px] md:min-h-[120px] border-r border-b p-1 transition-colors",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isTodayDate && "bg-blue-50/50"
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div 
          className={cn(
            "text-sm font-medium",
            isTodayDate && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
          )}
        >
          {format(date, "d")}
        </div>
      </div>
      <div className="space-y-1 overflow-hidden">
        {visibleInteracoes.map((interacao) => (
          <InteracaoChip 
            key={interacao.id} 
            interacao={interacao} 
            onClick={onInteracaoClick} 
          />
        ))}
        {hasMore && (
          <span className="text-xs text-muted-foreground pl-1">
            +{remaining} mais
          </span>
        )}
      </div>
    </div>
  );
};

export default function CrmAgenda() {
  const navigate = useNavigate();
  const { userData, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // Buscar empresa_id do usuário
  useEffect(() => {
    const fetchEmpresaId = async () => {
      if (!isAuthenticated || authLoading) return;

      let empId = userData?.empresa_id;

      if (!empId) {
        const { data: empresaData } = await supabase
          .from("empresas")
          .select("id")
          .limit(1)
          .single();

        empId = empresaData?.id;
      }

      setEmpresaId(empId);
    };

    fetchEmpresaId();
  }, [isAuthenticated, authLoading, userData]);

  // Buscar interações do mês
  useEffect(() => {
    if (!empresaId) return;

    const fetchInteracoes = async () => {
      setLoading(true);
      try {
        const inicioMes = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const fimMes = format(endOfMonth(currentMonth), "yyyy-MM-dd");

        const { data, error } = await supabase
          .from("leads_interacoes")
          .select(`
            id,
            lead_id,
            tipo,
            descricao,
            data,
            status,
            leads!inner(
              id,
              nome,
              empresa,
              empresa_id
            )
          `)
          .eq("leads.empresa_id", empresaId)
          .gte("data", inicioMes)
          .lte("data", fimMes)
          .order("data", { ascending: true });

        if (error) throw error;

        const interacoesFormatadas: Interacao[] = (data || []).map((item: any) => ({
          id: item.id,
          lead_id: item.lead_id,
          tipo: item.tipo,
          descricao: item.descricao,
          data: item.data,
          status: item.status,
          lead_nome: item.leads?.nome || "Lead não encontrado",
          lead_empresa: item.leads?.empresa || null,
        }));

        setInteracoes(interacoesFormatadas);
      } catch (error: any) {
        console.error("Erro ao buscar interações:", error);
        toast.error("Erro ao carregar agenda", {
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInteracoes();
  }, [empresaId, currentMonth]);

  // Agrupar interações por data
  const interacoesPorData = useMemo(() => {
    const grouped: Record<string, Interacao[]> = {};
    interacoes.forEach((interacao) => {
      const dataKey = interacao.data;
      if (!grouped[dataKey]) grouped[dataKey] = [];
      grouped[dataKey].push(interacao);
    });
    return grouped;
  }, [interacoes]);

  // Gerar dias do calendário com padding para semanas completas
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [currentMonth]);

  const handleNavigateToLead = (leadId: string) => {
    navigate(`/crm/leads?leadId=${leadId}&from=agenda`);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleGoToToday = () => {
    setCurrentMonth(new Date());
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Agenda de Interações</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[150px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendário Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Header com dias da semana */}
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDays.map((dia) => (
              <div 
                key={dia} 
                className="text-center text-sm font-medium py-3 border-r border-b last:border-r-0"
              >
                {dia}
              </div>
            ))}
          </div>
          
          {/* Grid dos dias */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dataKey = format(day, "yyyy-MM-dd");
              const interacoesDoDia = interacoesPorData[dataKey] || [];
              
              return (
                <DayCell
                  key={day.toISOString()}
                  date={day}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  isTodayDate={isToday(day)}
                  interacoes={interacoesDoDia}
                  onInteracaoClick={handleNavigateToLead}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span>Pendente/Aberto</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span>Realizado</span>
        </div>
      </div>
    </div>
  );
}
