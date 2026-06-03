import { useMemo, useState } from "react";
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
  EllipsisVertical,
  Pencil,
  Trash2,
  Upload,
  Archive,
  ArchiveRestore,
  Download,
} from "lucide-react";
import { useProjetosRelogio, type ProjetoPayload } from "@/hooks/useProjetosRelogio";
import { useFavorecidos } from "@/hooks/useFavorecidos";
import { useTiposProjetoRelogio } from "@/hooks/useTiposProjetoRelogio";
import { ProjetoFormModal } from "@/components/relogio/ProjetoFormModal";
import { ImportarProjetosModal } from "@/components/relogio/ImportarProjetosModal";
import type { RelogioProjeto } from "@/types/relogio";
import { toast } from "sonner";

type StatusFilter = "todos" | "ativo" | "arquivado";

export default function ProjetosRelogioPage() {
  const {
    projetos,
    isLoading,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    importarProjetos,
  } = useProjetosRelogio();

  const { data: favorecidos = [] } = useFavorecidos();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [clienteFilter, setClienteFilter] = useState<string>("todos");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RelogioProjeto | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const { tiposProjeto } = useTiposProjetoRelogio();

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
    return projetos.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        p.codigo.toLowerCase().includes(term) ||
        p.nome.toLowerCase().includes(term);
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const matchCliente = clienteFilter === "todos" || p.favorecido_id === clienteFilter;
      return matchSearch && matchStatus && matchCliente;
    });
  }, [projetos, searchTerm, statusFilter, clienteFilter]);

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

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      await excluirProjeto(toDelete);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir projeto");
    } finally {
      setToDelete(null);
    }
  };

  const toggleStatus = async (p: RelogioProjeto) => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <div className="flex gap-2">
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
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-72">
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {favorecidos.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead className="w-[120px]">Código</TableHead>
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
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{p.codigo}</TableCell>
                      <TableCell>{p.nome}</TableCell>
                      <TableCell>{p.tipo_projeto_id ? (tipoProjetoNome.get(p.tipo_projeto_id) ?? "—") : "—"}</TableCell>
                      <TableCell>{favorecidoNome.get(p.favorecido_id) ?? "—"}</TableCell>

                      <TableCell className="text-right">{p.fotos_tiradas}</TableCell>
                      <TableCell className="text-right">{p.fotos_enviadas}</TableCell>
                      <TableCell className="text-right">{p.fotos_vendidas}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            p.status === "ativo"
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {p.status === "ativo" ? "Ativo" : "Arquivado"}
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
                          <DropdownMenuContent align="end" className="w-40 z-30 bg-white border">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(p);
                                setFormOpen(true);
                              }}
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
                              onClick={() => setToDelete(p.id)}
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

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.
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
