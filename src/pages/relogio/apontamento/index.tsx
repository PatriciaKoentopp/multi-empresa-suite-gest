import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Play,
  Search,
  Upload,
  Download,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useApontamentosRelogio,
  ApontamentoPayload,
  secondsToHHMMSS,
  type PeriodoFiltro,
} from "@/hooks/useApontamentosRelogio";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { ApontamentoManualModal } from "@/components/relogio/ApontamentoManualModal";
import { ApontamentoCronometroModal } from "@/components/relogio/ApontamentoCronometroModal";
import { ImportarApontamentosModal } from "@/components/relogio/ImportarApontamentosModal";
import { CronometroCard } from "@/components/relogio/CronometroCard";
import { ApontamentoRow } from "@/components/relogio/ApontamentoRow";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DateInput } from "@/components/movimentacao/DateInput";
import { formatDate, cn } from "@/lib/utils";
import { formatHoursMinutes } from "@/utils/timeUtils";
import type { RelogioApontamento } from "@/types/relogio";

const PERIODO_STORAGE_KEY = "relogio_apontamento_periodo";
const PERIODO_INI_KEY = "relogio_apontamento_periodo_ini";
const PERIODO_FIM_KEY = "relogio_apontamento_periodo_fim";

const VALID_PERIODOS: PeriodoFiltro[] = [
  "semana_atual",
  "mes_atual",
  "mes_anterior",
  "ano_atual",
  "ano_anterior",
  "todos",
  "personalizado",
];

const isoToDate = (iso: string | null): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
};

const dateToIso = (d: Date | null | undefined): string | null => {
  if (!d) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ApontamentoRelogioPage() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(() => {
    const stored = typeof window !== "undefined"
      ? (localStorage.getItem(PERIODO_STORAGE_KEY) as PeriodoFiltro | null)
      : null;
    return stored && VALID_PERIODOS.includes(stored) ? stored : "semana_atual";
  });
  const [periodoIni, setPeriodoIni] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(PERIODO_INI_KEY) : null
  );
  const [periodoFim, setPeriodoFim] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(PERIODO_FIM_KEY) : null
  );

  useEffect(() => {
    localStorage.setItem(PERIODO_STORAGE_KEY, periodo);
  }, [periodo]);
  useEffect(() => {
    if (periodoIni) localStorage.setItem(PERIODO_INI_KEY, periodoIni);
    else localStorage.removeItem(PERIODO_INI_KEY);
  }, [periodoIni]);
  useEffect(() => {
    if (periodoFim) localStorage.setItem(PERIODO_FIM_KEY, periodoFim);
    else localStorage.removeItem(PERIODO_FIM_KEY);
  }, [periodoFim]);

  const {
    apontamentos,
    isLoading,
    criarApontamento,
    atualizarApontamento,
    excluirApontamento,
    iniciarCronometro,
    pararCronometro,
    importarApontamentos,
    apontamentoEmAndamento,
  } = useApontamentosRelogio(
    periodo,
    periodo === "personalizado" ? periodoIni : null,
    periodo === "personalizado" ? periodoFim : null
  );

  const { projetos } = useProjetosRelogio();
  const { tiposProjeto, tarefas } = useTiposProjetoRelogio();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [projetoFilter, setProjetoFilter] = useState<string>("todos");
  const [projetoOpen, setProjetoOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ativo");
  const [manualOpen, setManualOpen] = useState(false);
  const [cronoOpen, setCronoOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<RelogioApontamento | undefined>();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const projetoMap = useMemo(() => {
    const m = new Map<string, { codigo: string; nome: string; status: string }>();
    projetos.forEach((p) => m.set(p.id, { codigo: p.codigo, nome: p.nome, status: p.status }));
    return m;
  }, [projetos]);

  const tarefaMap = useMemo(() => {
    const m = new Map<string, string>();
    tarefas.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tarefas]);

  const projetosPorStatus = useMemo(() => {
    if (statusFilter === "todos") return projetos;
    return projetos.filter((p) => p.status === statusFilter);
  }, [projetos, statusFilter]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return apontamentos.filter((a) => {
      if (a.status === "em_andamento") return false;
      const proj = projetoMap.get(a.projeto_id);
      const projText = proj ? `${proj.codigo} ${proj.nome}`.toLowerCase() : "";
      const tarefaText = a.tarefa_id ? (tarefaMap.get(a.tarefa_id) || "").toLowerCase() : "";
      const matchSearch =
        !term || projText.includes(term) || tarefaText.includes(term);
      const matchProj = projetoFilter === "todos" || a.projeto_id === projetoFilter;
      const matchStatus = statusFilter === "todos" || (proj && proj.status === statusFilter);
      return matchSearch && matchProj && matchStatus;
    });
  }, [apontamentos, debouncedSearch, projetoFilter, statusFilter, projetoMap, tarefaMap]);

  const groupedApontamentos = useMemo(() => {
    const map = new Map<string, RelogioApontamento[]>();
    filtered.forEach((a) => {
      const list = map.get(a.data) || [];
      list.push(a);
      map.set(a.data, list);
    });
    return Array.from(map.entries()).sort(([dA], [dB]) => dB.localeCompare(dA));
  }, [filtered]);

  const totalGeral = useMemo(
    () => filtered.reduce((sum, a) => sum + Number(a.duracao_decimal || 0), 0),
    [filtered]
  );

  const handleSaveManual = async (payload: ApontamentoPayload, id?: string) => {
    if (id) await atualizarApontamento(id, payload);
    else await criarApontamento(payload);
  };

  const handleIniciarCronometro = async (projetoId: string, tarefaId: string | null) => {
    if (apontamentoEmAndamento) {
      toast.error("Já existe um cronômetro em andamento");
      return;
    }
    await iniciarCronometro(projetoId, tarefaId);
  };

  const handlePararCronometro = useCallback(async () => {
    if (!apontamentoEmAndamento) return;
    try {
      await pararCronometro(apontamentoEmAndamento);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao parar cronômetro");
    }
  }, [apontamentoEmAndamento, pararCronometro]);

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      await excluirApontamento(toDelete);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir apontamento");
    } finally {
      setToDelete(null);
    }
  };

  const handleEdit = useCallback(
    (id: string) => {
      const a = apontamentos.find((x) => x.id === id);
      if (!a) return;
      setEditing(a);
      setManualOpen(true);
    },
    [apontamentos]
  );

  const handleDelete = useCallback((id: string) => setToDelete(id), []);

  const handleExportar = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum apontamento para exportar");
      return;
    }
    const rows = filtered.map((a) => {
      const proj = projetoMap.get(a.projeto_id);
      const tarefa = a.tarefa_id ? tarefaMap.get(a.tarefa_id) : "";
      return {
        Projeto: proj ? `${proj.codigo} - ${proj.nome}` : "",
        Tarefa: tarefa || "",
        "Data de início": formatDate(a.data),
        "Hora de início": (a.hora_inicio || "").slice(0, 8),
        "Data final": formatDate(a.data),
        "Hora de término": (a.hora_fim || "").slice(0, 8),
        "Duração (decimal)": Number(a.duracao_decimal || 0),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 50 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Apontamentos");
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fname = `apontamentos_${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast.success(`${rows.length} apontamento(s) exportado(s)`);
  };

  const projAndamento = apontamentoEmAndamento
    ? projetoMap.get(apontamentoEmAndamento.projeto_id)
    : null;
  const tarefaAndamento =
    apontamentoEmAndamento?.tarefa_id
      ? tarefaMap.get(apontamentoEmAndamento.tarefa_id) || null
      : null;

  const projetoSelecionadoLabel =
    projetoFilter === "todos"
      ? "Todos os projetos"
      : (() => {
          const p = projetoMap.get(projetoFilter);
          return p ? `${p.codigo} - ${p.nome}` : "Projeto";
        })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Apontamento</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => setCronoOpen(true)}
            disabled={!!apontamentoEmAndamento}
          >
            <Play className="mr-2 h-4 w-4" />
            Iniciar Cronômetro
          </Button>
          <Button
            variant="blue"
            onClick={() => {
              setEditing(undefined);
              setManualOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </div>

      {apontamentoEmAndamento && (
        <CronometroCard
          apontamento={apontamentoEmAndamento}
          projetoLabel={
            projAndamento
              ? `${projAndamento.codigo} - ${projAndamento.nome}`
              : null
          }
          tarefaLabel={tarefaAndamento}
          onParar={handlePararCronometro}
        />
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por projeto ou tarefa..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-[200px]">
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="semana_atual">Semana atual</SelectItem>
                  <SelectItem value="mes_atual">Mês atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês anterior</SelectItem>
                  <SelectItem value="ano_atual">Ano atual</SelectItem>
                  <SelectItem value="ano_anterior">Ano anterior</SelectItem>
                  <SelectItem value="todos">Tudo</SelectItem>
                  <SelectItem value="personalizado">Definir período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periodo === "personalizado" && (
              <>
                <div className="flex w-full sm:w-[160px]">
                  <DateInput
                    value={isoToDate(periodoIni)}
                    onChange={(d) => setPeriodoIni(dateToIso(d))}
                    placeholder="Início"
                  />
                </div>
                <div className="flex w-full sm:w-[160px]">
                  <DateInput
                    value={isoToDate(periodoFim)}
                    onChange={(d) => setPeriodoFim(dateToIso(d))}
                    placeholder="Fim"
                  />
                </div>
              </>
            )}
            <div className="flex w-full sm:w-[160px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="arquivado">Arquivados</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full sm:w-[280px]">
              <Popover open={projetoOpen} onOpenChange={setProjetoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={projetoOpen}
                    className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                  >
                    <span className="truncate">{projetoSelecionadoLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-white dark:bg-gray-800" align="start">
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
                        {projetosPorStatus.map((p) => (
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
          </div>

          {filtered.length > 0 && (
            <div className="mb-4 flex items-center justify-end gap-3">
              <span className="text-sm text-muted-foreground">Total geral</span>
              <span className="text-base font-semibold">
                {formatHoursMinutes(totalGeral)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({totalGeral.toFixed(2)} h)
              </span>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="w-[160px]">Tarefa</TableHead>
                  <TableHead className="w-[90px]">Início</TableHead>
                  <TableHead className="w-[90px]">Fim</TableHead>
                  <TableHead className="w-[110px] text-right">Duração (h)</TableHead>
                  <TableHead className="w-[110px]">Duração</TableHead>
                  <TableHead className="w-[110px]">Origem</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      Nenhum apontamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedApontamentos.map(([dataDia, items]) => {
                    const totalDia = items.reduce(
                      (sum, a) => sum + Number(a.duracao_decimal || 0),
                      0
                    );
                    const totalDiaHHMMSS = secondsToHHMMSS(
                      Math.round(totalDia * 3600)
                    );
                    return (
                      <Fragment key={dataDia}>
                        {items.map((a) => {
                          const proj = projetoMap.get(a.projeto_id);
                          const tarefaNome = a.tarefa_id
                            ? tarefaMap.get(a.tarefa_id)
                            : null;
                          const dur = Number(a.duracao_decimal || 0);
                          const durHHMMSS = secondsToHHMMSS(
                            Math.round(dur * 3600)
                          );
                          return (
                            <ApontamentoRow
                              key={a.id}
                              id={a.id}
                              data={formatDate(a.data)}
                              projeto={
                                proj
                                  ? `${proj.codigo} - ${proj.nome}`
                                  : "—"
                              }
                              tarefa={tarefaNome || "—"}
                              horaInicio={a.hora_inicio?.slice(0, 5) || "—"}
                              horaFim={a.hora_fim?.slice(0, 5) || "—"}
                              duracaoDecimal={dur.toFixed(2)}
                              duracaoHHMMSS={durHHMMSS}
                              origem={a.origem}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          );
                        })}
                        <TableRow className="bg-muted/60 font-semibold border-t">
                          <TableCell colSpan={5}>
                            Total do dia {formatDate(dataDia)}
                          </TableCell>
                          <TableCell className="text-right">
                            {totalDia.toFixed(2)}
                          </TableCell>
                          <TableCell>{totalDiaHHMMSS}</TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ApontamentoManualModal
        open={manualOpen}
        onOpenChange={(o) => {
          setManualOpen(o);
          if (!o) setEditing(undefined);
        }}
        projetos={projetos}
        tiposProjeto={tiposProjeto}
        tarefas={tarefas}
        apontamento={editing}
        onSubmit={handleSaveManual}
      />

      <ApontamentoCronometroModal
        open={cronoOpen}
        onOpenChange={setCronoOpen}
        projetos={projetos}
        tiposProjeto={tiposProjeto}
        tarefas={tarefas}
        onIniciar={handleIniciarCronometro}
      />

      <ImportarApontamentosModal
        open={importOpen}
        onOpenChange={setImportOpen}
        projetos={projetos}
        tarefas={tarefas}
        onImport={importarApontamentos}
      />

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este apontamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExcluir}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
