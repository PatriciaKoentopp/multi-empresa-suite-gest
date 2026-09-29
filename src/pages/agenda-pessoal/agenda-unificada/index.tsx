import { useEffect, useMemo, useState } from "react";
import { sincronizarGoogleAgenda } from "@/lib/google-agenda.functions";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, PlusCircle, User } from "lucide-react";
import {
  AgendaTarefa, TRIADE_INFO, fmtData, fmtHora, useAgendaMetas, useAgendaPapeis, useAgendaTarefas,
} from "@/hooks/useAgendaPessoal";
import { TarefaPessoalModal } from "@/components/agenda-pessoal/TarefaPessoalModal";

interface ItemAgenda {
  id: string;
  data: string;
  hora: string;
  titulo: string;
  subtitulo: string;
  concluido: boolean;
  tarefa: AgendaTarefa;
}

export default function AgendaPessoalPage() {
  const [mes, setMes] = useState(() => new Date());
  const inicio = format(startOfMonth(mes), "yyyy-MM-dd");
  const fim = format(endOfMonth(mes), "yyyy-MM-dd");
  const [diaSel, setDiaSel] = useState<string | null>(null);

  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();
  const { tarefas, salvar, alternarConcluida, carregar } = useAgendaTarefas(inicio, fim);

  // Traz os eventos do Google Agenda do mês (quando o usuário está conectado)
  useEffect(() => {
    let ativo = true;
    sincronizarGoogleAgenda({ data: { inicio, fim } })
      .then((r: any) => { if (ativo && r?.conectado) carregar(); })
      .catch(() => {});
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<AgendaTarefa | undefined>();
  const [dataPadrao, setDataPadrao] = useState<string | undefined>();

  const itens = useMemo(() => {
    const map: Record<string, ItemAgenda[]> = {};
    for (const t of tarefas) {
      if (t.status === "cancelada") continue;
      (map[t.data] ??= []).push({
        id: t.id, data: t.data, hora: fmtHora(t.hora_inicio),
        titulo: t.titulo, subtitulo: TRIADE_INFO[t.triade].label,
        concluido: t.status === "concluida", tarefa: t,
      });
    }
    Object.values(map).forEach((a) => a.sort((x, y) => (x.hora || "99").localeCompare(y.hora || "99")));
    return map;
  }, [tarefas]);

  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 0 }),
  });
  const hoje = format(new Date(), "yyyy-MM-dd");

  const abrirItem = (it: ItemAgenda) => {
    setDiaSel(null);
    setEditando(it.tarefa);
    setModalOpen(true);
  };

  const Chip = ({ it }: { it: ItemAgenda }) => (
    <div
      onClick={(e) => { e.stopPropagation(); abrirItem(it); }}
      className={`flex items-center gap-1 truncate rounded border px-1 py-0.5 text-[11px] cursor-pointer hover:opacity-80 ${TRIADE_INFO[it.tarefa.triade].chip} ${it.concluido ? "line-through opacity-60" : ""}`}
      title={`${it.titulo} - ${it.subtitulo}`}
    >
      <Checkbox
        checked={it.concluido}
        onCheckedChange={() => alternarConcluida(it.tarefa)}
        onClick={(e) => e.stopPropagation()}
        className="h-3 w-3 shrink-0"
      />
      <User className="h-3 w-3 shrink-0" />
      {it.hora && <span className="font-semibold">{it.hora}</span>}
      <span className="truncate">{it.titulo}</span>
    </div>
  );

  const itensDia = diaSel ? itens[diaSel] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Agenda Pessoal</h1>
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
                <Checkbox className="mt-1" checked={it.concluido} onCheckedChange={() => alternarConcluida(it.tarefa)} />
                <div className="flex-1 cursor-pointer" onClick={() => abrirItem(it)}>
                  <p className={`text-sm font-medium ${it.concluido ? "line-through text-muted-foreground" : ""}`}>
                    <User className="inline h-4 w-4 mr-1 text-blue-600" />
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
