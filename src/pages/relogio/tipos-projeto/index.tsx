import { Fragment, useMemo, useState } from "react";
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
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { TipoProjetoFormModal } from "@/components/relogio/TipoProjetoFormModal";
import { TarefaFormModal } from "@/components/relogio/TarefaFormModal";
import type { RelogioTipoProjeto, RelogioTarefa } from "@/types/relogio";
import { toast } from "sonner";

type StatusFilter = "todos" | "ativo" | "inativo";

export default function TiposProjetoRelogioPage() {
  const {
    tiposProjeto,
    tarefas,
    isLoading,
    criarTipoProjeto,
    atualizarTipoProjeto,
    excluirTipoProjeto,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
  } = useTiposProjetoRelogio();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Modais
  const [tipoModalOpen, setTipoModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<RelogioTipoProjeto | undefined>();

  const [tarefaModalOpen, setTarefaModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<RelogioTarefa | undefined>();
  const [tarefaTipoId, setTarefaTipoId] = useState<string>("");

  // Confirmações de exclusão
  const [tipoToDelete, setTipoToDelete] = useState<string | null>(null);
  const [tarefaToDelete, setTarefaToDelete] = useState<string | null>(null);

  const filteredTipos = useMemo(() => {
    return tiposProjeto.filter((t) => {
      const matchSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "todos" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tiposProjeto, searchTerm, statusFilter]);

  const tarefasPorTipo = useMemo(() => {
    const map = new Map<string, RelogioTarefa[]>();
    for (const t of tarefas) {
      const arr = map.get(t.tipo_projeto_id) ?? [];
      arr.push(t);
      map.set(t.tipo_projeto_id, arr);
    }
    return map;
  }, [tarefas]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSaveTipo = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    try {
      if (editingTipo) await atualizarTipoProjeto(editingTipo.id, data);
      else await criarTipoProjeto(data);
      setEditingTipo(undefined);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar tipo de projeto");
    }
  };

  const handleSaveTarefa = async (data: {
    tipo_projeto_id: string;
    nome: string;
    status: "ativo" | "inativo";
    percentual_tempo_estimado: number;
  }) => {
    try {
      if (editingTarefa) {
        await atualizarTarefa(editingTarefa.id, {
          nome: data.nome,
          status: data.status,
          percentual_tempo_estimado: data.percentual_tempo_estimado,
        });
      } else {
        await criarTarefa(data);
      }
      setEditingTarefa(undefined);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar tarefa");
    }
  };

  const confirmExcluirTipo = async () => {
    if (!tipoToDelete) return;
    try {
      await excluirTipoProjeto(tipoToDelete);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir tipo de projeto");
    } finally {
      setTipoToDelete(null);
    }
  };

  const confirmExcluirTarefa = async () => {
    if (!tarefaToDelete) return;
    try {
      await excluirTarefa(tarefaToDelete);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir tarefa");
    } finally {
      setTarefaToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Projeto</h1>
        <Button
          variant="blue"
          onClick={() => {
            setEditingTipo(undefined);
            setTipoModalOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Tipo de Projeto
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-[180px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[140px] text-right">Qtde. Tarefas</TableHead>
                  <TableHead className="w-[160px] text-right">% Total Estimado</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredTipos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTipos.map((tipo) => {
                    const tarefasDoTipo = tarefasPorTipo.get(tipo.id) ?? [];
                    const totalPct = tarefasDoTipo
                      .filter((t) => t.status === "ativo")
                      .reduce((sum, t) => sum + Number(t.percentual_tempo_estimado || 0), 0);
                    const isExpanded = !!expanded[tipo.id];
                    const pctClass =
                      Math.abs(totalPct - 100) < 0.01
                        ? "text-green-700"
                        : "text-amber-600";
                    return (
                      <Fragment key={tipo.id}>
                        <TableRow key={tipo.id} className="hover:bg-muted/40">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleExpand(tipo.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{tipo.nome}</TableCell>
                          <TableCell className="text-right">{tarefasDoTipo.length}</TableCell>
                          <TableCell className={`text-right font-medium ${pctClass}`}>
                            {totalPct.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                tipo.status === "ativo"
                                  ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                  : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                              }`}
                            >
                              {tipo.status === "ativo" ? "Ativo" : "Inativo"}
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
                              <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingTipo(tipo);
                                    setTipoModalOpen(true);
                                  }}
                                  className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setTipoToDelete(tipo.id)}
                                  className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow key={tipo.id + "-tarefas"} className="bg-muted/20">
                            <TableCell></TableCell>
                            <TableCell colSpan={5} className="py-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold">Tarefas</h3>
                                <Button
                                  size="sm"
                                  variant="blue"
                                  onClick={() => {
                                    setEditingTarefa(undefined);
                                    setTarefaTipoId(tipo.id);
                                    setTarefaModalOpen(true);
                                  }}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Adicionar Tarefa
                                </Button>
                              </div>
                              {tarefasDoTipo.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">
                                  Nenhuma tarefa cadastrada.
                                </p>
                              ) : (
                                <div className="border rounded-md bg-white">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="w-[180px] text-right">
                                          % Tempo Estimado
                                        </TableHead>
                                        <TableHead className="w-[120px]">Status</TableHead>
                                        <TableHead className="w-[80px]">Ações</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tarefasDoTipo.map((tarefa) => (
                                        <TableRow key={tarefa.id}>
                                          <TableCell>{tarefa.nome}</TableCell>
                                          <TableCell className="text-right">
                                            {Number(tarefa.percentual_tempo_estimado).toFixed(2)}%
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                tarefa.status === "ativo"
                                                  ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                                  : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                                              }`}
                                            >
                                              {tarefa.status === "ativo" ? "Ativo" : "Inativo"}
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
                                                className="w-36 z-30 bg-white border"
                                              >
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    setEditingTarefa(tarefa);
                                                    setTarefaTipoId(tipo.id);
                                                    setTarefaModalOpen(true);
                                                  }}
                                                  className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                                                >
                                                  <Pencil className="h-4 w-4" />
                                                  Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() => setTarefaToDelete(tarefa.id)}
                                                  className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                  Excluir
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TipoProjetoFormModal
        open={tipoModalOpen}
        onOpenChange={(o) => {
          setTipoModalOpen(o);
          if (!o) setEditingTipo(undefined);
        }}
        tipoProjeto={editingTipo}
        onSubmit={handleSaveTipo}
      />

      <TarefaFormModal
        open={tarefaModalOpen}
        onOpenChange={(o) => {
          setTarefaModalOpen(o);
          if (!o) setEditingTarefa(undefined);
        }}
        tarefa={editingTarefa}
        tipoProjetoId={tarefaTipoId}
        onSubmit={handleSaveTarefa}
      />

      <AlertDialog open={!!tipoToDelete} onOpenChange={(o) => !o && setTipoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de projeto? Todas as tarefas vinculadas
              também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExcluirTipo}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!tarefaToDelete} onOpenChange={(o) => !o && setTarefaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExcluirTarefa}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
