import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  Calendar as CalendarIcon,
  Clock,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { useApontamentosRelogio } from "@/hooks/useApontamentosRelogio";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { cn, formatDate } from "@/lib/utils";
import type { RelogioApontamento } from "@/types/relogio";

const pad = (n: number) => String(n).padStart(2, "0");
const isoFromDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Hash determinístico → matiz HSL [0,360)
function projetoHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}
const projetoColor = (id: string, alpha = 1) =>
  `hsl(${projetoHue(id)} 65% 55% / ${alpha})`;
const projetoColorSoft = (id: string) =>
  `hsl(${projetoHue(id)} 65% 90%)`;

function formatHoras(decimal: number): string {
  if (!decimal || decimal <= 0) return "0h";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${pad(m)}m`;
}

interface DayAgregado {
  iso: string;
  total: number;
  porProjeto: Map<string, number>;
  apontamentos: RelogioApontamento[];
}

export default function VisualizacaoRelogioPage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState<Date>(today);
  const [projetoFilter, setProjetoFilter] = useState<string>("todos");
  const [projetoOpen, setProjetoOpen] = useState(false);
  const [dayDialog, setDayDialog] = useState<DayAgregado | null>(null);

  // Grid de 6 semanas que cobre o mês
  const gridRange = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // domingo
    const end = new Date(start);
    end.setDate(start.getDate() + 41); // 6 semanas
    return {
      start,
      end,
      startIso: isoFromDate(start),
      endIso: isoFromDate(end),
    };
  }, [cursor]);

  const { apontamentos, isLoading } = useApontamentosRelogio(
    "personalizado",
    gridRange.startIso,
    gridRange.endIso
  );
  const { projetos } = useProjetosRelogio();
  const { tarefas } = useTiposProjetoRelogio();

  const projetoMap = useMemo(() => {
    const m = new Map<string, { codigo: string; nome: string }>();
    projetos.forEach((p) => m.set(p.id, { codigo: p.codigo, nome: p.nome }));
    return m;
  }, [projetos]);

  const tarefaMap = useMemo(() => {
    const m = new Map<string, string>();
    tarefas.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tarefas]);

  // Filtra e agrega por dia
  const { porDia, totaisMes } = useMemo(() => {
    const map = new Map<string, DayAgregado>();
    const projetosAtivos = new Set<string>();
    let totalHoras = 0;
    apontamentos.forEach((a) => {
      if (a.status === "em_andamento") return;
      if (projetoFilter !== "todos" && a.projeto_id !== projetoFilter) return;
      if (a.data < gridRange.startIso || a.data > gridRange.endIso) return;
      let agg = map.get(a.data);
      if (!agg) {
        agg = { iso: a.data, total: 0, porProjeto: new Map(), apontamentos: [] };
        map.set(a.data, agg);
      }
      const dur = Number(a.duracao_decimal || 0);
      agg.total += dur;
      agg.porProjeto.set(
        a.projeto_id,
        (agg.porProjeto.get(a.projeto_id) || 0) + dur
      );
      agg.apontamentos.push(a);
      totalHoras += dur;
      projetosAtivos.add(a.projeto_id);
    });

    // Só conta dias do mês corrente para os KPIs
    const mesAtual = cursor.getMonth();
    const anoAtual = cursor.getFullYear();
    let totalMes = 0;
    let diasMes = 0;
    const projsMes = new Set<string>();
    map.forEach((agg) => {
      const [y, m] = agg.iso.split("-").map(Number);
      if (y === anoAtual && m - 1 === mesAtual) {
        totalMes += agg.total;
        if (agg.total > 0) diasMes++;
        agg.porProjeto.forEach((_, pid) => projsMes.add(pid));
      }
    });

    return {
      porDia: map,
      totaisMes: {
        totalHoras: totalMes,
        diasTrabalhados: diasMes,
        projetosAtivos: projsMes.size,
        mediaDiaria: diasMes > 0 ? totalMes / diasMes : 0,
      },
    };
  }, [apontamentos, projetoFilter, gridRange.startIso, gridRange.endIso, cursor]);

  // Cores máx do dia para heatmap
  const maxDia = useMemo(() => {
    let max = 0;
    porDia.forEach((d) => {
      if (d.total > max) max = d.total;
    });
    return max;
  }, [porDia]);

  // Legenda – projetos visíveis no mês
  const legenda = useMemo(() => {
    const set = new Map<string, number>();
    porDia.forEach((d) => {
      d.porProjeto.forEach((h, pid) => {
        set.set(pid, (set.get(pid) || 0) + h);
      });
    });
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [porDia]);

  // Lista de dias do grid
  const days = useMemo(() => {
    const arr: { date: Date; iso: string }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridRange.start);
      d.setDate(gridRange.start.getDate() + i);
      arr.push({ date: d, iso: isoFromDate(d) });
    }
    return arr;
  }, [gridRange.start]);

  const navMonth = useCallback((delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);
  const goToday = useCallback(() => setCursor(today), [today]);

  const projetoFilterLabel =
    projetoFilter === "todos"
      ? "Todos os projetos"
      : (() => {
          const p = projetoMap.get(projetoFilter);
          return p ? `${p.codigo} - ${p.nome}` : "Projeto";
        })();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Visualização</h1>
            <p className="text-sm text-muted-foreground">
              Calendário visual dos apontamentos realizados em cada dia.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 min-w-[180px] text-lg font-semibold capitalize">
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label="Total de horas"
            value={formatHoras(totaisMes.totalHoras)}
          />
          <KpiCard
            icon={<CalendarIcon className="h-5 w-5" />}
            label="Dias trabalhados"
            value={String(totaisMes.diasTrabalhados)}
          />
          <KpiCard
            icon={<FolderKanban className="h-5 w-5" />}
            label="Projetos ativos"
            value={String(totaisMes.projetosAtivos)}
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Média diária"
            value={formatHoras(totaisMes.mediaDiaria)}
          />
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="w-full sm:w-[320px]">
                <Popover open={projetoOpen} onOpenChange={setProjetoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                    >
                      <span className="truncate">{projetoFilterLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0 bg-white dark:bg-gray-800" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar projeto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="todos"
                            onSelect={() => {
                              setProjetoFilter("todos");
                              setProjetoOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                projetoFilter === "todos" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Todos os projetos
                          </CommandItem>
                          {projetos.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.codigo} ${p.nome}`}
                              onSelect={() => {
                                setProjetoFilter(p.id);
                                setProjetoOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  projetoFilter === p.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.codigo} - {p.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {isLoading && (
                <span className="text-sm text-muted-foreground">Carregando...</span>
              )}
            </div>

            {/* Calendário */}
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-7 bg-muted/50">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="px-2 py-2 text-xs font-semibold text-muted-foreground text-center border-r last:border-r-0"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d, idx) => {
                  const agg = porDia.get(d.iso);
                  const isCurrentMonth = d.date.getMonth() === cursor.getMonth();
                  const isToday = d.iso === isoFromDate(today);
                  const isWeekend = d.date.getDay() === 0 || d.date.getDay() === 6;
                  const intensity = maxDia > 0 && agg ? agg.total / maxDia : 0;
                  const segments = agg
                    ? Array.from(agg.porProjeto.entries()).sort((a, b) => b[1] - a[1])
                    : [];

                  const cell = (
                    <button
                      type="button"
                      onClick={() => agg && setDayDialog(agg)}
                      disabled={!agg}
                      className={cn(
                        "relative text-left min-h-[110px] border-r border-b last:border-r-0 p-2 flex flex-col gap-1.5 transition-colors",
                        (idx + 1) % 7 === 0 && "border-r-0",
                        idx >= 35 && "border-b-0",
                        !isCurrentMonth && "bg-muted/20 text-muted-foreground/60",
                        isCurrentMonth && "bg-background hover:bg-muted/40",
                        agg && "cursor-pointer",
                        !agg && "cursor-default"
                      )}
                    >
                      {/* Heatmap top bar */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{
                          background:
                            intensity > 0
                              ? `hsl(var(--primary) / ${0.25 + intensity * 0.65})`
                              : "transparent",
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isWeekend && isCurrentMonth && "text-muted-foreground",
                            isToday &&
                              "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          )}
                        >
                          {d.date.getDate()}
                        </span>
                        {agg && (
                          <span className="text-xs font-semibold text-foreground">
                            {formatHoras(agg.total)}
                          </span>
                        )}
                      </div>

                      {/* Stacked bar */}
                      {segments.length > 0 && (
                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                          {segments.slice(0, 6).map(([pid, h]) => (
                            <div
                              key={pid}
                              style={{
                                width: `${(h / agg!.total) * 100}%`,
                                background: projetoColor(pid),
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Project chips (até 3) */}
                      {segments.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {segments.slice(0, 3).map(([pid, h]) => {
                            const p = projetoMap.get(pid);
                            return (
                              <div
                                key={pid}
                                className="flex items-center gap-1 text-[10px] leading-tight"
                              >
                                <span
                                  className="h-2 w-2 rounded-sm shrink-0"
                                  style={{ background: projetoColor(pid) }}
                                />
                                <span className="truncate flex-1">
                                  {p ? p.codigo : "—"}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatHoras(h)}
                                </span>
                              </div>
                            );
                          })}
                          {segments.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{segments.length - 3} projeto(s)
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );

                  return agg ? (
                    <Tooltip key={d.iso}>
                      <TooltipTrigger asChild>{cell}</TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-xs font-semibold mb-1">
                          {formatDate(d.iso)} — {formatHoras(agg.total)}
                        </div>
                        <div className="space-y-0.5">
                          {segments.map(([pid, h]) => {
                            const p = projetoMap.get(pid);
                            return (
                              <div key={pid} className="flex items-center gap-2 text-xs">
                                <span
                                  className="h-2 w-2 rounded-sm"
                                  style={{ background: projetoColor(pid) }}
                                />
                                <span className="truncate flex-1">
                                  {p ? `${p.codigo} - ${p.nome}` : "Projeto"}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatHoras(h)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={d.iso}>{cell}</div>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            {legenda.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {legenda.map(([pid, h]) => {
                  const p = projetoMap.get(pid);
                  const active = projetoFilter === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() =>
                        setProjetoFilter((cur) => (cur === pid ? "todos" : pid))
                      }
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      )}
                      style={{
                        background: active ? undefined : projetoColorSoft(pid),
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: projetoColor(pid) }}
                      />
                      <span className="font-medium">
                        {p ? `${p.codigo} - ${p.nome}` : "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatHoras(h)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog dia */}
        <Dialog open={!!dayDialog} onOpenChange={(o) => !o && setDayDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {dayDialog
                  ? `${formatDate(dayDialog.iso)} — ${formatHoras(dayDialog.total)}`
                  : ""}
              </DialogTitle>
            </DialogHeader>
            {dayDialog && (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {dayDialog.apontamentos
                  .slice()
                  .sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
                  .map((a) => {
                    const p = projetoMap.get(a.projeto_id);
                    const t = a.tarefa_id ? tarefaMap.get(a.tarefa_id) : null;
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-md border bg-card"
                      >
                        <span
                          className="h-10 w-1.5 rounded-full shrink-0 mt-0.5"
                          style={{ background: projetoColor(a.projeto_id) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {p ? `${p.codigo} - ${p.nome}` : "Projeto"}
                          </div>
                          {t && (
                            <div className="text-xs text-muted-foreground">
                              Tarefa: {t}
                            </div>
                          )}
                          {a.observacao && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {a.observacao}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-mono">
                            {(a.hora_inicio || "").slice(0, 5)}
                            {a.hora_fim ? ` – ${a.hora_fim.slice(0, 5)}` : ""}
                          </div>
                          <div className="font-semibold mt-1">
                            {formatHoras(Number(a.duracao_decimal || 0))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
