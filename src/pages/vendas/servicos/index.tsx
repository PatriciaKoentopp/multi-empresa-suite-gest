
import { useState, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ServicosForm } from "@/components/servicos/servicos-form";

// Função para exibir badge do status no mesmo padrão de Contas a Pagar
function getStatusBadge(status: "ativo" | "inativo") {
  if (status === "ativo") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
        Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
      Inativo
    </span>
  );
}

type Servico = {
  id: string;
  nome: string;
  descricao?: string;
  status: "ativo" | "inativo";
  conta_receita_id?: string;
};

export default function ServicosPage() {
  const { currentCompany } = useCompany();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativo" | "inativo">("todas");
  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingServicoId, setDeletingServicoId] = useState<string | null>(null);
  
  // Carregar serviços do Supabase
  useEffect(() => {
    if (currentCompany?.id) {
      loadServicos();
    }
  }, [currentCompany]);

  async function loadServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast("Erro ao carregar serviços");
    }
  }

  // Aplica filtro na listagem
  const servicosFiltrados = useMemo(() => {
    return servicos.filter((servico) => {
      // Filtro texto: nome ou descrição
      const textoBusca = (servico.nome + " " + (servico.descricao || ""))
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Filtro status
      const statusOk = statusFilter === "todas" || servico.status === statusFilter;
      return textoBusca && statusOk;
    });
  }, [servicos, searchTerm, statusFilter]);

  async function handleSubmitServico(formData: any) {
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('servicos')
          .update({
            nome: formData.nome,
            descricao: formData.descricao,
            status: formData.status,
            conta_receita_id: formData.conta_receita_id
          })
          .eq('id', formData.id)
          .eq('empresa_id', currentCompany?.id);

        if (error) throw error;
        toast("Serviço atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert([{
            nome: formData.nome,
            descricao: formData.descricao,
            status: formData.status,
            conta_receita_id: formData.conta_receita_id,
            empresa_id: currentCompany?.id
          }]);

        if (error) throw error;
        toast("Serviço cadastrado com sucesso!");
      }
      
      setShowForm(false);
      setEditingServico(null);
      loadServicos();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast("Erro ao salvar serviço");
    }
  }

  function handleEditar(servico: Servico) {
    setEditingServico(servico);
    setShowForm(true);
  }
  
  async function handleConfirmDelete() {
    if (!deletingServicoId) return;
    
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', deletingServicoId)
        .eq('empresa_id', currentCompany?.id);

      if (error) throw error;
      
      toast("Serviço excluído com sucesso!");
      loadServicos();
      
      if (editingServico?.id === deletingServicoId) {
        setEditingServico(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast("Erro ao excluir serviço");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingServicoId(null);
    }
  }

  function handleExcluirClick(id: string, e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setDeletingServicoId(id);
    setIsDeleteDialogOpen(true);
  }

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingServico(null);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Cadastro de Serviços</h2>
        <Button variant="blue" onClick={() => { setShowForm(true); setEditingServico(null); }}>
          <Plus className="mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Campo de busca */}
            <div className="relative w-full md:w-1/2 min-w-[220px]">
              <button
                type="button"
                className="absolute left-3 top-2.5 z-10 p-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
                style={{ lineHeight: 0 }}
                onClick={handleLupaClick}
                tabIndex={-1}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
              <Input
                ref={inputBuscaRef}
                placeholder="Buscar serviço ou descrição"
                className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    inputBuscaRef.current?.blur();
                  }
                }}
                autoComplete="off"
              />
            </div>
            {/* Select de status */}
            <div className="w-full md:w-40">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todas">Todos Status</SelectItem>
                  <SelectItem value="ativo" className="text-green-700">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-700">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingServico ? "Editar Serviço" : "Novo Serviço"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ServicosForm 
              initialData={editingServico || undefined}
              onSubmit={handleSubmitServico}
              onCancel={handleCancelForm}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {servicosFiltrados.length === 0 ? (
            <div className="text-neutral-500">Nenhum serviço cadastrado ainda.</div>
          ) : (
            <Table>
              <thead>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </thead>
              <TableBody>
                {servicosFiltrados.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.nome}</TableCell>
                    <TableCell>{s.descricao}</TableCell>
                    <TableCell>
                      {getStatusBadge(s.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-neutral-500 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu de ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 z-30 bg-white border">
                          <DropdownMenuItem
                            onClick={() => handleEditar(s)}
                            className="flex items-center gap-2 text-blue-500 focus:bg-blue-100 focus:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleExcluirClick(s.id, e)}
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
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setDeletingServicoId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
