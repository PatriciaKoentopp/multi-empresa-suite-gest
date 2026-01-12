import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { getIconForInteraction } from "../leads/utils/leadUtils";
import { parseDateString, formatDate } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
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

export default function CrmAgenda() {
  const navigate = useNavigate();
  const { userData, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  // Datas que têm interações pendentes
  const datasComPendentes = useMemo(() => {
    return Object.keys(interacoesPorData)
      .filter((data) =>
        interacoesPorData[data].some((i) => i.status !== "Realizado")
      )
      .map((data) => parseDateString(data))
      .filter((d): d is Date => d !== undefined);
  }, [interacoesPorData]);

  // Datas que têm apenas interações realizadas
  const datasRealizadas = useMemo(() => {
    return Object.keys(interacoesPorData)
      .filter((data) =>
        interacoesPorData[data].every((i) => i.status === "Realizado")
      )
      .map((data) => parseDateString(data))
      .filter((d): d is Date => d !== undefined);
  }, [interacoesPorData]);

  // Interações do dia selecionado
  const interacoesDoDia = useMemo(() => {
    if (!selectedDate) return [];
    const dataKey = format(selectedDate, "yyyy-MM-dd");
    return interacoesPorData[dataKey] || [];
  }, [selectedDate, interacoesPorData]);

  const handleNavigateToLead = (leadId: string) => {
    navigate(`/crm/leads?leadId=${leadId}`);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getStatusBadge = (status: string) => {
    if (status === "Realizado") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Realizado</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pendente</Badge>;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Agenda de Interações</h1>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                modifiers={{
                  pendente: datasComPendentes,
                  realizado: datasRealizadas,
                }}
                modifiersStyles={{
                  pendente: {
                    backgroundColor: "hsl(221 83% 95%)",
                    color: "hsl(221 83% 53%)",
                    fontWeight: "bold",
                  },
                  realizado: {
                    backgroundColor: "hsl(142 76% 93%)",
                    color: "hsl(142 76% 36%)",
                    fontWeight: "bold",
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Lista de interações do dia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Interações de {selectedDate ? formatDate(selectedDate) : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-3">
              {interacoesDoDia.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Nenhuma interação agendada para este dia.
                </p>
              ) : (
                <div className="space-y-3">
                  {interacoesDoDia.map((interacao) => (
                    <div
                      key={interacao.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleNavigateToLead(interacao.lead_id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {getIconForInteraction(interacao.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {interacao.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Lead: {interacao.lead_nome}
                            {interacao.lead_empresa && ` - ${interacao.lead_empresa}`}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            {getStatusBadge(interacao.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-600 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToLead(interacao.lead_id);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver Lead
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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
