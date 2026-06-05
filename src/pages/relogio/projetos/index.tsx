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
  PlusCircle,
  Search,
  Filter,
  Upload,
  Download,
  Check,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useProjetosRelogio, type ProjetoPayload } from "@/hooks/useProjetosRelogio";
import { ProjetoFormModal } from "@/components/relogio/ProjetoFormModal";
import { ImportarProjetosModal } from "@/components/relogio/ImportarProjetosModal";
import { ProjetoRow } from "@/components/relogio/ProjetoRow";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import type { RelogioProjeto } from "@/types/relogio";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatHoursMinutes } from "@/utils/timeUtils";

type StatusFilter = "todos" | "ativo" | "arquivado";

export default function ProjetosRelogioPage() {
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

  // Buscas enxutas só com id+nome (evita trafegar dados pesados)
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
  const [sortCodigoDir, setSortCodigoDir] = useState<"asc" | "desc">("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RelogioProjeto | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; codigo: string; nome: string; count: number } | null>(null);
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
      return matchSearch && matchStatus && matchCliente;
    });
    result.sort((a, b) => {
      const cmp = a.codigo.localeCompare(b.codigo);
      return sortCodigoDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [projetos, debouncedSearch, statusFilter, clienteFilter, sortCodigoDir]);

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

  const toggleStatus = useCallback(async (p: RelogioProjeto) => {
    try {
      await atualizarProjeto(p.id, {
        codigo: p.codigo,
        nome: p.nome,
        favorecido_id: p.favorecido_id,
        tipo_projeto_id: p.tipo_projeto_id,
        fotos_tiradas: p.fotos_tiradas,
        fotos_enviadas: p.fotos_enviadas,
        fotos_vendidas: p.fotos_vendidas,
        status: p.status === "ativo" ? "arquivado" : "ativo",
      });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar status");
    }
  }, [atualizarProjeto]);

  const handleExportar = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum projeto para exportar");
      return;
    }

    const headers = ["Código", "Nome", "Tipo de Projeto", "Cliente", "Fotos Tiradas", "Fotos Enviadas", "Fotos Vendidas", "Status"];
    const rows = filtered.map((p) => [
      p.codigo,
      p.nome,
      p.tipo_projeto_id ? (tipoProjetoNome.get(p.tipo_projeto_id) ?? "") : "",
      favorecidoNome.get(p.favorecido_id) ?? "",
      String(p.fotos_tiradas ?? 0),
      String(p.fotos_enviadas ?? 0),
      String(p.fotos_vendidas ?? 0),
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
    link.download = `projetos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso");
  };

  const clienteSelecionadoNome =
    clienteFilter === "todos" ? "Todos os clientes" : favorecidoNome.get(clienteFilter) ?? "Cliente";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
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
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clienteFilter === "todos" ? "opacity-100" : "opacity-0"
                            )}
                          />
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                clienteFilter === f.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {f.nome}
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
                    onClick={() =>
                      setSortCodigoDir((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
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
                  <TableHead className="w-[160px]">Tipo de Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right w-[110px]">Fotos Tiradas</TableHead>
                  <TableHead className="text-right w-[110px]">Fotos Enviadas</TableHead>
                  <TableHead className="text-right w-[110px]">Fotos Vendidas</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
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
                    <ProjetoRow
                      key={p.id}
                      projeto={p}
                      tipoNome={p.tipo_projeto_id ? (tipoProjetoNome.get(p.tipo_projeto_id) ?? "") : ""}
                      clienteNome={favorecidoNome.get(p.favorecido_id) ?? ""}
                      onEdit={handleEdit}
                      onToggleStatus={toggleStatus}
                      onDelete={handleAskDelete}
                    />
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
    </div>
  );
}
