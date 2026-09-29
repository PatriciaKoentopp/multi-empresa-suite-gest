import { useEffect, useMemo, useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, ChevronLeft, ChevronRight, PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useCompany } from "@/contexts/company-context";
import { useNavigate } from "@/lib/router-compat";
import {
  AgendaTarefa, TRIADE_INFO, fmtData, fmtHora, useAgendaMetas, useAgendaPapeis, useAgendaTarefas,
} from "@/hooks/useAgendaPessoal";
import { TarefaPessoalModal } from "@/components/agenda-pessoal/TarefaPessoalModal";

interface ItemAgenda {
  id: string;
  origem: "crm" | "pessoal";
  data: string;
  hora: string;
  titulo: string;
  subtitulo: string;
  concluido: boolean;
  leadId?: string;
  tarefa?: AgendaTarefa;
}

export default function AgendaUnificadaPage() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { currentCompany } = useCompany();
  const empresaId = currentCompany?.id ?? userData?.empresa_id ?? null;

  const [mes, setMes] = useState(() => new Date());
  const inicio = format(startOfMonth(mes), "yyyy-MM-dd");
  const fim = format(endOfMonth(mes), "yyyy-MM-dd");

  const [verCrm, setVerCrm] = useState(true);
  const [verPessoal, setVerPessoal] = useState(true);
  const [somenteMeus, setSomenteMeus] = useState(true);
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();
  const { tarefas, salvar, alternarConcluida } = useAgendaTarefas(inicio, fim);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<AgendaTarefa | undefined>();
  const [dataPadrao, setDataPadrao] = useState<string | undefined>();

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      let q = supabase
        .from("leads_interacoes")
        .select("id, lead_id, tipo, descricao, data, status, responsavel_id, leads!inner(nome, empresa_id, status)")
        .eq("leads.empresa_id", empresaId)
        .neq("leads.status", "inativo")
        .gte("data", inicio)
        .lte("data", fim)
        .order("data");
      if (somenteMeus && user?.id) q = q.eq("responsavel_id", user.id);
      const { data, error } = await q;
      if (error) { toast.error("Erro ao carregar interações do CRM"); return; }
      setInteracoes(data || []);
    })();
  }, [empresaId, inicio, fim, somenteMeus, user?.id]);

  const itens = useMemo(() => {
    const lista: ItemAgenda[] = [];
    if (verCrm) {
      for (const i of interacoes) {
        lista.push({
          id: "crm-" + i.id, origem: "crm", data: i.data, hora: "",
          titulo: i.leads?.nome ?? "Lead", subtitulo: `${i.tipo} - ${i.descricao ?? ""}`,
          concluido: i.status === "Realizado", leadId: i.lead_id,
        });
      }
    }
    if (verPessoal) {
      for (const t of tarefas) {
        if (t.status === "cancelada") continue;
        lista.push({
          id: "p-" + t.id, origem: "pessoal", data: t.data, hora: fmtHora(t.hora_inicio),
          titulo: t.titulo, subtitulo: TRIADE_INFO[t.triade].label,
          concluido: t.status === "concluida", tarefa: t,
        });
      }
    }
    const map: Record<string, ItemAgenda[]> = {};
    for (const it of lista) (map[it.data] ??= []).push(it);
    Object.values(map).forEach((a) => a.sort((x, y) => (x.hora || "99").localeCompare(y.hora || "99")));
    return map;
  }, [interacoes, tarefas, verCrm, verPessoal]);

  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 0 }),
  });
  const hoje = format(new Date(), "yyyy-MM-dd");

  const abrirItem = (it: ItemAgenda) => {
    if (it.origem === "crm" && it.leadId) {
      setDiaSel(null);
      const id = it.leadId;
      setTimeout(() => navigate(`/crm/leads?leadId=${id}&from=agenda`), 250);
    } else if (it.tarefa) {
      setDiaSel(null);
      setEditando(it.tarefa);
      setModalOpen(true);
    }
  };

  const Chip = ({ it }: { it: ItemAgenda }) => {
    const cls = it.origem === "crm"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : TRIADE_INFO[it.tarefa!.triade].chip;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); abrirItem(it); }}
        className={`flex items-center gap-1 truncate rounded border px-1 py-0.5 text-[11px] cursor-pointer hover:opacity-80 ${cls} ${it.concluido ? "line-through opacity-60" : ""}`}
        title={`${it.titulo} - ${it.subtitulo}`}
      >
        {it.origem === "crm" ? <Briefcase className="h-3 w-3 shrink-0" /> : <User className="h-3 w-3 shrink-0" />}
        {it.hora && <span className="font-semibold">{it.hora}</span>}
        <span className="truncate">{it.titulo}</span>
      </div>
    );
  };

  const itensDia = diaSel ? itens[diaSel] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Agenda Unificada</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMes((d) => addMonths(d, -1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium min-w-[150px] text-center capitalize">{format(mes, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          <Button variant="outline" size="icon" onClick={() => setMes((d) => addMonths(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setMes(new Date())}>Hoje</Button>
        </div>
        <Button variant="blue" onClick={() => { setEditando(undefined); setDataPadrao(hoje); setModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa Pessoal
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-2"><Checkbox id="crm" checked={verCrm} onCheckedChange={(v) => setVerCrm(!!v)} /><Label htmlFor="crm" className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-blue-600" /> CRM</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="pes" checked={verPessoal} onCheckedChange={(v) => setVerPessoal(!!v)} /><Label htmlFor="pes" className="flex items-center gap-1"><User className="h-4 w-4 text-blue-600" /> Pessoal</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="meus" checked={somenteMeus} onCheckedChange={(v) => setSomenteMeus(!!v)} disabled={!verCrm} /><Label htmlFor="meus">Somente interações do CRM sob minha responsabilidade</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground mb-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia) => {
              const key = format(dia, "yyyy-MM-dd");
              const lista = itens[key] ?? [];
              return (
                <div
                  key={key}
                  onClick={() => setDiaSel(key)}
                  className={`min-h-[110px] rounded border p-1 cursor-pointer hover:bg-muted/50 ${isSameMonth(dia, mes) ? "" : "opacity-40"} ${key === hoje ? "border-blue-500" : ""}`}
                >
                  <div className="text-xs font-semibold mb-1">{format(dia, "d")}</div>
                  <div className="space-y-0.5">
                    {lista.slice(0, 3).map((it) => <Chip key={it.id} it={it} />)}
                    {lista.length > 3 && <div className="text-[11px] text-blue-600 font-medium">+{lista.length - 3} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!diaSel} onOpenChange={(o) => !o && setDiaSel(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Agenda de {fmtData(diaSel)}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {itensDia.length === 0 && <p className="text-sm text-muted-foreground">Nenhum compromisso neste dia.</p>}
            {itensDia.map((it) => (
              <div key={it.id} className="flex items-start gap-2 rounded-md border p-2">
                {it.tarefa && <Checkbox className="mt-1" checked={it.concluido} onCheckedChange={() => alternarConcluida(it.tarefa!)} />}
                <div className="flex-1 cursor-pointer" onClick={() => abrirItem(it)}>
                  <p className={`text-sm font-medium ${it.concluido ? "line-through text-muted-foreground" : ""}`}>
                    {it.origem === "crm" ? <Briefcase className="inline h-4 w-4 mr-1 text-blue-600" /> : <User className="inline h-4 w-4 mr-1 text-blue-600" />}
                    {it.hora && <span className="mr-1">{it.hora}</span>}{it.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{it.subtitulo}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="blue" onClick={() => { const d = diaSel!; setDiaSel(null); setEditando(undefined); setDataPadrao(d); setModalOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa neste dia
          </Button>
        </DialogContent>
      </Dialog>

      <TarefaPessoalModal open={modalOpen} onOpenChange={setModalOpen} tarefa={editando} dataPadrao={dataPadrao} papeis={papeis} metas={metas} onSave={salvar} />
    </div>
  );
}
