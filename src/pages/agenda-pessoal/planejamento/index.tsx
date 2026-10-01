import { useMemo, useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, EllipsisVertical, Pencil, PlusCircle, Repeat, Trash2 } from "lucide-react";
import {
  AgendaTarefa, TRIADE_INFO, Triade, fmtData, fmtHora,
  useAgendaMetas, useAgendaPapeis, useAgendaTarefas,
} from "@/hooks/useAgendaPessoal";
import { TarefaPessoalModal } from "@/components/agenda-pessoal/TarefaPessoalModal";

export default function PlanejamentoPessoalPage() {
  const [semanaBase, setSemanaBase] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i)), [semanaBase]);
  const inicio = format(dias[0]!, "yyyy-MM-dd");
  const fim = format(dias[6]!, "yyyy-MM-dd");

  const { papeis } = useAgendaPapeis();
  const { metas } = useAgendaMetas();
  const { tarefas, isLoading, salvar, alternarConcluida, excluir } = useAgendaTarefas(inicio, fim);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<AgendaTarefa | undefined>();
  const [dataPadrao, setDataPadrao] = useState<string | undefined>();
  const [repetir, setRepetir] = useState(false);

  const papelMap = useMemo(() => new Map(papeis.map((p) => [p.id, p])), [papeis]);
  const hoje = format(new Date(), "yyyy-MM-dd");

  const resumo = useMemo(() => {
    const validas = tarefas.filter((t) => t.status !== "cancelada");
    const usarDuracao = validas.some((t) => t.duracao_min > 0);
    const peso = (t: AgendaTarefa) => (usarDuracao ? t.duracao_min : 1);
    const total = validas.reduce((s, t) => s + peso(t), 0);
    const por = (tr: Triade) => validas.filter((t) => t.triade === tr).reduce((s, t) => s + peso(t), 0);
    return {
      total: validas.length,
      concluidas: validas.filter((t) => t.status === "concluida").length,
      pct: (Object.keys(TRIADE_INFO) as Triade[]).map((tr) => ({
        tr, pct: total > 0 ? (por(tr) / total) * 100 : 0,
      })),
    };
  }, [tarefas]);

  const abrirNova = (data?: string) => {
    setRepetir(false);
    setEditando(undefined);
    setDataPadrao(data ?? hoje);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Planejamento</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSemanaBase((d) => addWeeks(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[190px] text-center">
            {fmtData(inicio)} a {fmtData(fim)}
          </span>
          <Button variant="outline" size="icon" onClick={() => setSemanaBase((d) => addWeeks(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
        </div>
        <Button variant="blue" onClick={() => abrirNova()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tarefas da semana</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{resumo.concluidas}/{resumo.total}</div><p className="text-xs text-muted-foreground">concluídas</p></CardContent>
        </Card>
        {resumo.pct.map(({ tr, pct }) => (
          <Card key={tr}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{TRIADE_INFO[tr].label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: TRIADE_INFO[tr].cor }}>{pct.toFixed(0)}%</div>
              <div className="mt-2 h-2 rounded bg-muted overflow-hidden">
                <div className="h-full" style={{ width: `${pct}%`, background: TRIADE_INFO[tr].cor }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-6">Carregando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dias.map((dia) => {
            const key = format(dia, "yyyy-MM-dd");
            const doDia = tarefas.filter((t) => t.data === key);
            return (
              <Card key={key} className={key === hoje ? "border-blue-500" : ""}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm capitalize">
                    {format(dia, "EEEE", { locale: ptBR })} <span className="text-muted-foreground font-normal">{format(dia, "dd/MM/yyyy")}</span>
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirNova(key)}>
                    <PlusCircle className="h-4 w-4 text-blue-500" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {doDia.length === 0 && <p className="text-xs text-muted-foreground">Sem tarefas</p>}
                  {doDia.map((t) => {
                    const papel = t.papel_id ? papelMap.get(t.papel_id) : undefined;
                    return (
                      <div key={t.id} className={`flex items-start gap-2 rounded-md border p-2 ${t.status === "concluida" ? "opacity-60" : ""}`}>
                        <Checkbox checked={t.status === "concluida"} onCheckedChange={() => alternarConcluida(t)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${t.status === "concluida" ? "line-through" : ""}`}>{t.titulo}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge variant="outline" className={`text-[10px] ${TRIADE_INFO[t.triade].chip}`}>{TRIADE_INFO[t.triade].label}</Badge>
                            {t.hora_inicio && <span className="text-[11px] text-muted-foreground">{fmtHora(t.hora_inicio)}{t.hora_fim ? `-${fmtHora(t.hora_fim)}` : ""}</span>}
                            {papel && <span className="text-[11px] px-1 rounded" style={{ background: papel.cor + "22", color: papel.cor }}>{papel.nome}</span>}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><EllipsisVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setRepetir(false); setEditando(t); setModalOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRepetir(true); setEditando(t); setModalOpen(true); }}>
                              <Repeat className="mr-2 h-4 w-4" /> Repetir
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => excluir(t.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TarefaPessoalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tarefa={editando}
        dataPadrao={dataPadrao}
        papeis={papeis}
        metas={metas}
        onSave={salvar}
        repetir={repetir}
      />
    </div>
  );
}
