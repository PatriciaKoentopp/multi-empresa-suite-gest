import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Check,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Upload,
  Download,
  EllipsisVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { useProjetosRelogio, type ProjetoPayload } from "@/hooks/useProjetosRelogio";
import { ProjetoFormModal } from "@/components/relogio/ProjetoFormModal";
import { ImportarProjetosModal } from "@/components/relogio/ImportarProjetosModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { cn, parseDateString, formatDate } from "@/lib/utils";
import type { RelogioProjeto } from "@/types/relogio";
import { toast } from "sonner";

type StatusFilter = "todos" | "ativo" | "arquivado";

const fmt = (d: string | null) => {
  if (!d) return "—";
  const parsed = parseDateString(d);
  return parsed ? formatDate(parsed) : "—";
};

export default function PainelProjetosRelogioPage() {
  const {
    projetos,
    isLoading,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    contarApontamentos,
    excluirProjetoComApontamentos,
    importarProjetos,
  } = useProjetosRelogio();

  const { currentCompany } = useCompany();

  const { data: favorecidos = [] } = useQuery({
    queryKey: ["favorecidos-lite", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorecidos")
        .select("id, nome")
        .eq("empresa_id", currentCompany!.id)
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const { data: tiposProjeto = [] } = useQuery({
    queryKey: ["tipos-projeto-lite", currentCompany?.id],
    enabled: !!currentCompany?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relogio_tipos_projeto")
        .select("id, nome")
        .eq("empresa_id", currentCompany!.id)
        .order("nome");
      if (error) throw error;
      return (data || []) as { id: string; nome: string }[];
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativo");
  const [clienteFilter, setClienteFilter] = useState<string>("todos");
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoProjetoFilter, setTipoProjetoFilter] = useState<string>("todos");
  const [tipoOpen, setTipoOpen] = useState(false);
  const [sortCodigoDir, setSortCodigoDir] = useState<"asc" | "desc">("asc");

  // Default: seleciona "Fotografia" quando tipos carregam
  useEffect(() => {
    if (tiposProjeto.length > 0 && tipoProjetoFilter === "todos") {
      const fotografia = tiposProjeto.find(
        (t) => t.nome.toLowerCase() === "fotografia"
      );
      if (fotografia) {
        setTipoProjetoFilter(fotografia.id);
      }
    }
  }, [tiposProjeto, tipoProjetoFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RelogioProjeto | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; codigo: string; nome: string; count: number } | null>(null);
  const [toArchive, setToArchive] = useState<{ projeto: RelogioProjeto; missing: string[] } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const favorecidoNome = useMemo(() => {
    const m = new Map<string, string>();
    favorecidos.forEach((f) => m.set(f.id, f.nome));
    return m;
  }, [favorecidos]);

  const tipoProjetoNome = useMemo(() => {
    const m = new Map<string, string>();
    tiposProjeto.forEach((t) => m.set(t.id, t.nome));
    return m;
  }, [tiposProjeto]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const result = projetos.filter((p) => {
      const matchSearch =
        !term ||
        p.codigo.toLowerCase().includes(term) ||
        p.nome.toLowerCase().includes(term);
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const matchCliente = clienteFilter === "todos" || p.favorecido_id === clienteFilter;
      const matchTipo = tipoProjetoFilter === "todos" || p.tipo_projeto_id === tipoProjetoFilter;
      return matchSearch && matchStatus && matchCliente && matchTipo;
    });
    result.sort((a, b) => {
      const cmp = a.codigo.localeCompare(b.codigo);
      return sortCodigoDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [projetos, debouncedSearch, statusFilter, clienteFilter, tipoProjetoFilter, sortCodigoDir]);

  const handleSave = async (data: ProjetoPayload) => {
    try {
      if (editing) await atualizarProjeto(editing.id, data);
      else await criarProjeto(data);
      setEditing(undefined);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes("duplicate") ? "Código já existe" : "Erro ao salvar projeto");
      throw e;
    }
  };

  const handleEdit = useCallback((p: RelogioProjeto) => {
    setEditing(p);
    setFormOpen(true);
  }, []);

  const handleAskDelete = useCallback(async (p: RelogioProjeto) => {
    const count = await contarApontamentos(p.id);
    setConfirmText("");
    setToDelete({ id: p.id, codigo: p.codigo, nome: p.nome, count });
  }, [contarApontamentos]);

  const confirmExcluir = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete.count > 0) {
        await excluirProjetoComApontamentos(toDelete.id);
      } else {
        await excluirProjeto(toDelete.id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir projeto");
    } finally {
      setDeleting(false);
      setToDelete(null);
      setConfirmText("");
    }
  };

  const doArchive = useCallback(async (p: RelogioProjeto, novoStatus: "ativo" | "arquivado") => {
    try {
      await atualizarProjeto(p.id, {
        codigo: p.codigo,
        nome: p.nome,
        favorecido_id: p.favorecido_id,
        tipo_projeto_id: p.tipo_projeto_id,
        fotos_tiradas: p.fotos_tiradas,
        fotos_enviadas: p.fotos_enviadas,
        fotos_vendidas: p.fotos_vendidas,
        status: novoStatus,
        data_fotos: p.data_fotos,
        data_previa: p.data_previa,
        data_selecao: p.data_selecao,
        data_prazo: p.data_prazo,
        data_entrega: p.data_entrega,
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar status");
    }
  }, [atualizarProjeto]);

  const toggleStatus = useCallback(async (p: RelogioProjeto) => {
    if (p.status === "ativo") {
      const missing: string[] = [];
      if (!p.favorecido_id) missing.push("Cliente");
      if (!p.tipo_projeto_id) missing.push("Tipo de Projeto");
      if (!p.data_fotos) missing.push("Data Fotos");
      if (!p.data_previa) missing.push("Data Prévia");
      if (!p.data_selecao) missing.push("Data Seleção");
      if (!p.data_prazo) missing.push("Data Prazo");
      if (!p.data_entrega) missing.push("Data Entrega");
      if ((p.fotos_tiradas ?? 0) === 0) missing.push("Fotos Tiradas igual a 0");
      if ((p.fotos_enviadas ?? 0) === 0) missing.push("Fotos Enviadas igual a 0");
      if ((p.fotos_vendidas ?? 0) === 0) missing.push("Fotos Vendidas igual a 0");
      if (missing.length > 0) {
        setToArchive({ projeto: p, missing });
        return;
      }
    }
    await doArchive(p, p.status === "ativo" ? "arquivado" : "ativo");
  }, [doArchive]);

  const handleExportar = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum projeto para exportar");
      return;
    }

    const headers = ["Código", "Nome", "Tipo de Projeto", "Cliente", "Data Fotos", "Data Prévia", "Data Seleção", "Data Prazo", "Data Entrega", "Status"];
    const rows = filtered.map((p) => [
      p.codigo,
      p.nome,
      p.tipo_projeto_id ? (tipoProjetoNome.get(p.tipo_projeto_id) ?? "") : "",
      favorecidoNome.get(p.favorecido_id) ?? "",
      fmt(p.data_fotos),
      fmt(p.data_previa),
      fmt(p.data_selecao),
      fmt(p.data_prazo),
      fmt(p.data_entrega),
      p.status === "ativo" ? "Ativo" : "Arquivado",
    ]);

    const escapeCsv = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [headers.map(escapeCsv).join(";"), ...rows.map((r) => r.map(escapeCsv).join(";"))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `painel_projetos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso");
  };

  const clienteSelecionadoNome =
    clienteFilter === "todos" ? "Todos os clientes" : favorecidoNome.get(clienteFilter) ?? "Cliente";

  const tipoProjetoSelecionadoNome =
    tipoProjetoFilter === "todos" ? "Todos os tipos" : tipoProjetoNome.get(tipoProjetoFilter) ?? "Tipo de Projeto";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel de Projetos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportar}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Planilha
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar Planilha
          </Button>
          <Button
            variant="blue"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-[240px]">
              <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clienteOpen}
                    className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                  >
                    <span className="truncate">{clienteSelecionadoNome}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 bg-white dark:bg-gray-800" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setClienteFilter("todos");
                            setClienteOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", clienteFilter === "todos" ? "opacity-100" : "opacity-0")} />
                          Todos os clientes
                        </CommandItem>
                        {favorecidos.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={f.nome}
                            onSelect={() => {
                              setClienteFilter(f.id);
                              setClienteOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", clienteFilter === f.id ? "opacity-100" : "opacity-0")} />
                            {f.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex w-full sm:w-[240px]">
              <Popover open={tipoOpen} onOpenChange={setTipoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tipoOpen}
                    className="w-full justify-between bg-white dark:bg-gray-900 font-normal"
                  >
                    <span className="truncate">{tipoProjetoSelecionadoNome}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 bg-white dark:bg-gray-800" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar tipo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setTipoProjetoFilter("todos");
                            setTipoOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", tipoProjetoFilter === "todos" ? "opacity-100" : "opacity-0")} />
                          Todos os tipos
                        </CommandItem>
                        {tiposProjeto.map((t) => (
                          <CommandItem
                            key={t.id}
                            value={t.nome}
                            onSelect={() => {
                              setTipoProjetoFilter(t.id);
                              setTipoOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", tipoProjetoFilter === t.id ? "opacity-100" : "opacity-0")} />
                            {t.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  <SelectItem value="arquivado" className="text-red-600">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-[120px] cursor-pointer select-none"
                    onClick={() => setSortCodigoDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                  >
                    <div className="flex items-center gap-1">
                      Código
                      {sortCodigoDir === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[120px]">Data Fotos</TableHead>
                  <TableHead className="w-[120px]">Data Prévia</TableHead>
                  <TableHead className="w-[120px]">Data Seleção</TableHead>
                  <TableHead className="w-[120px]">Data Prazo</TableHead>
                  <TableHead className="w-[120px]">Data Entrega</TableHead>
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
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{p.codigo}</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell>{favorecidoNome.get(p.favorecido_id) ?? "—"}</TableCell>
                      <TableCell>{fmt(p.data_fotos)}</TableCell>
                      <TableCell>{fmt(p.data_previa)}</TableCell>
                      <TableCell>{fmt(p.data_selecao)}</TableCell>
                      <TableCell>{fmt(p.data_prazo)}</TableCell>
                      <TableCell>{fmt(p.data_entrega)}</TableCell>
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
                          <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                            <DropdownMenuItem
                              onClick={() => handleEdit(p)}
                              className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleStatus(p)}
                              className="flex items-center gap-2 text-amber-600 focus:bg-amber-100 focus:text-amber-700"
                            >
                              {p.status === "ativo" ? (
                                <>
                                  <Archive className="h-4 w-4" /> Arquivar
                                </>
                              ) : (
                                <>
                                  <ArchiveRestore className="h-4 w-4" /> Reativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAskDelete(p)}
                              className="flex items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProjetoFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(undefined);
        }}
        projeto={editing}
        onSubmit={handleSave}
      />

      <ImportarProjetosModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importarProjetos}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) { setToDelete(null); setConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {toDelete && toDelete.count > 0 ? (
                <div className="space-y-3">
                  <p>
                    O projeto <strong>{toDelete.codigo} - {toDelete.nome}</strong> possui{" "}
                    <strong className="text-red-600">{toDelete.count}</strong>{" "}
                    {toDelete.count === 1 ? "apontamento" : "apontamentos"} de horas vinculado{toDelete.count === 1 ? "" : "s"}.
                  </p>
                  <p>
                    Ao confirmar, o projeto e <strong>todos os apontamentos</strong> serão excluídos permanentemente. Esta ação não pode ser desfeita.
                  </p>
                  <p>
                    Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Digite EXCLUIR"
                    autoFocus
                  />
                </div>
              ) : (
                <span>Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmExcluir(); }}
              disabled={deleting || (!!toDelete && toDelete.count > 0 && confirmText.trim().toUpperCase() !== "EXCLUIR")}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toArchive} onOpenChange={(o) => { if (!o) setToArchive(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar arquivamento</AlertDialogTitle>
            <AlertDialogDescription>
              {toArchive ? `O projeto ${toArchive.projeto.codigo} - ${toArchive.projeto.nome} possui inconsistências.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {toArchive && (
            <div className="space-y-3 text-sm">
              <p>Os seguintes itens precisam de atenção:</p>
              <ul className="list-disc pl-5 text-red-600">
                {toArchive.missing.map((m) => (<li key={m}>{m}</li>))}
              </ul>
              <p>Deseja arquivar mesmo assim?</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToArchive(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toArchive) {
                  const p = toArchive.projeto;
                  setToArchive(null);
                  doArchive(p, "arquivado");
                }
              }}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
