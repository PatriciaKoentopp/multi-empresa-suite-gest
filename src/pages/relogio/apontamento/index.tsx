import { useEffect, useMemo, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  Square,
  Search,
  EllipsisVertical,
  Pencil,
  Trash2,
  Timer,
  Upload,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useApontamentosRelogio,
  ApontamentoPayload,
  secondsToHHMMSS,
  timeToSeconds,
  nowTimeString,
} from "@/hooks/useApontamentosRelogio";
import { useProjetosRelogio } from "@/hooks/useProjetosRelogio";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { ApontamentoManualModal } from "@/components/relogio/ApontamentoManualModal";
import { ApontamentoCronometroModal } from "@/components/relogio/ApontamentoCronometroModal";
import { ImportarApontamentosModal } from "@/components/relogio/ImportarApontamentosModal";
import { formatDate } from "@/lib/utils";
import type { RelogioApontamento } from "@/types/relogio";

export default function ApontamentoRelogioPage() {
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
  } = useApontamentosRelogio();
  const { projetos } = useProjetosRelogio();
  const { tiposProjeto, tarefas } = useTiposProjetoRelogio();

  const [searchTerm, setSearchTerm] = useState("");
  const [projetoFilter, setProjetoFilter] = useState<string>("todos");
  const [manualOpen, setManualOpen] = useState(false);
  const [cronoOpen, setCronoOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<RelogioApontamento | undefined>();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Atualiza tempo decorrido do cronômetro a cada segundo
  useEffect(() => {
    if (!apontamentoEmAndamento) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [apontamentoEmAndamento]);

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

  const filtered = useMemo(() => {
    return apontamentos.filter((a) => {
      if (a.status === "em_andamento") return false;
      const term = searchTerm.toLowerCase();
      const proj = projetoMap.get(a.projeto_id);
      const projText = proj ? `${proj.codigo} ${proj.nome}`.toLowerCase() : "";
      const tarefaText = a.tarefa_id ? (tarefaMap.get(a.tarefa_id) || "").toLowerCase() : "";
      const matchSearch =
        !term || projText.includes(term) || tarefaText.includes(term);
      const matchProj = projetoFilter === "todos" || a.projeto_id === projetoFilter;
      return matchSearch && matchProj;
    });
  }, [apontamentos, searchTerm, projetoFilter, projetoMap, tarefaMap]);

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

  const handlePararCronometro = async () => {
    if (!apontamentoEmAndamento) return;
    try {
      await pararCronometro(apontamentoEmAndamento);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao parar cronômetro");
    }
  };

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

  // Tempo decorrido do cronômetro ativo
  const tempoDecorrido = useMemo(() => {
    if (!apontamentoEmAndamento) return "00:00:00";
    void tick;
    const inicioSec = timeToSeconds(apontamentoEmAndamento.hora_inicio);
    const agoraSec = timeToSeconds(nowTimeString());
    return secondsToHHMMSS(Math.max(0, agoraSec - inicioSec));
  }, [apontamentoEmAndamento, tick]);

  const projAndamento = apontamentoEmAndamento
    ? projetoMap.get(apontamentoEmAndamento.projeto_id)
    : null;
  const tarefaAndamento =
    apontamentoEmAndamento?.tarefa_id && tarefaMap.get(apontamentoEmAndamento.tarefa_id);

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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Timer className="h-6 w-6 text-blue-600 animate-pulse" />
              <div>
                <div className="text-sm text-muted-foreground">
                  Cronômetro em andamento
                </div>
                <div className="font-medium">
                  {projAndamento
                    ? `${projAndamento.codigo} - ${projAndamento.nome}`
                    : "Projeto"}
                  {tarefaAndamento ? ` • ${tarefaAndamento}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  Iniciado às {apontamentoEmAndamento.hora_inicio.slice(0, 8)} —{" "}
                  {formatDate(apontamentoEmAndamento.data)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold text-blue-700">
                {tempoDecorrido}
              </div>
              <Button variant="destructive" onClick={handlePararCronometro}>
                <Square className="mr-2 h-4 w-4" />
                Parar
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <div className="flex w-full sm:w-[280px]">
              <Select value={projetoFilter} onValueChange={setProjetoFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Projeto" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 max-h-72">
                  <SelectItem value="todos">Todos os projetos</SelectItem>
                  {projetos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} - {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  filtered.map((a) => {
                    const proj = projetoMap.get(a.projeto_id);
                    const tarefaNome = a.tarefa_id ? tarefaMap.get(a.tarefa_id) : null;
                    const dur = Number(a.duracao_decimal || 0);
                    const durHHMMSS = secondsToHHMMSS(Math.round(dur * 3600));
                    return (
                      <TableRow key={a.id} className="hover:bg-muted/40">
                        <TableCell>{formatDate(a.data)}</TableCell>
                        <TableCell>
                          {proj ? `${proj.codigo} - ${proj.nome}` : "—"}
                        </TableCell>
                        <TableCell>{tarefaNome || "—"}</TableCell>
                        <TableCell>{a.hora_inicio?.slice(0, 5) || "—"}</TableCell>
                        <TableCell>{a.hora_fim?.slice(0, 5) || "—"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {dur.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono">{durHHMMSS}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              a.origem === "cronometro"
                                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                : "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/20"
                            }`}
                          >
                            {a.origem === "cronometro" ? "Cronômetro" : "Manual"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-neutral-500 hover:bg-gray-100"
                              >
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 z-30 bg-white border"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(a);
                                  setManualOpen(true);
                                }}
                                className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setToDelete(a.id)}
                                className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
