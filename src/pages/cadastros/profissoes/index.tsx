import { useState, useEffect } from "react";
import { Profissao } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { ProfissoesForm } from "@/components/profissoes/profissoes-form";
import { ProfissoesTable } from "@/components/profissoes/profissoes-table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export default function ProfissoesPage() {
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfissao, setEditingProfissao] = useState<Profissao | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProfissaoId, setDeletingProfissaoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const { currentCompany } = useCompany();

  // Carregar profissões do Supabase
  useEffect(() => {
    const fetchProfissoes = async () => {
      if (!currentCompany) return;
      
      try {
        const { data, error } = await supabase
          .from("profissoes")
          .select("id, nome, status, empresa_id, created_at, updated_at")
          .eq("empresa_id", currentCompany.id)
          .order("nome");

        if (error) {
          console.error("Erro ao carregar profissões:", error);
          toast.error("Erro ao carregar profissões");
          return;
        }

        if (data) {
          const profissoesFormatadas: Profissao[] = data.map(profissao => ({
            id: profissao.id,
            nome: profissao.nome,
            empresa_id: profissao.empresa_id,
            status: profissao.status as "ativo" | "inativo",
            created_at: profissao.created_at,
            updated_at: profissao.updated_at
          }));
          setProfissoes(profissoesFormatadas);
        }
      } catch (error) {
        console.error("Erro ao carregar profissões:", error);
        toast.error("Erro ao carregar profissões");
      }
    };

    fetchProfissoes();
  }, [currentCompany]);

  const handleOpenDialog = (profissao?: Profissao) => {
    setEditingProfissao(profissao);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingProfissao(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      if (editingProfissao) {
        // Atualizar profissão existente
        const { error } = await supabase
          .from("profissoes")
          .update({
            nome: data.nome,
            status: data.status
          })
          .eq("id", editingProfissao.id)
          .eq("empresa_id", currentCompany.id);

        if (error) {
          console.error("Erro ao atualizar profissão:", error);
          toast.error("Erro ao atualizar profissão");
          return;
        }

        setProfissoes(prev => prev.map(p => 
          p.id === editingProfissao.id 
            ? { ...p, nome: data.nome, status: data.status, updated_at: new Date().toISOString() }
            : p
        ));
        toast.success("Profissão atualizada com sucesso!");
      } else {
        // Criar nova profissão
        const { data: novaProfissao, error } = await supabase
          .from("profissoes")
          .insert([{
            empresa_id: currentCompany.id,
            nome: data.nome,
            status: data.status
          }])
          .select("id, nome, status, empresa_id, created_at, updated_at")
          .single();

        if (error) {
          console.error("Erro ao criar profissão:", error);
          toast.error("Erro ao criar profissão");
          return;
        }

        if (novaProfissao) {
          const profissaoFormatada: Profissao = {
            id: novaProfissao.id,
            nome: novaProfissao.nome,
            empresa_id: novaProfissao.empresa_id,
            status: novaProfissao.status as "ativo" | "inativo",
            created_at: novaProfissao.created_at,
            updated_at: novaProfissao.updated_at
          };
          setProfissoes(prev => [...prev, profissaoFormatada]);
          toast.success("Profissão criada com sucesso!");
        }
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Erro na operação:", error);
      toast.error("Ocorreu um erro ao processar a solicitação");
    }
  };

  const handleDelete = (id: string) => {
    setDeletingProfissaoId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProfissaoId || !currentCompany) return;

    try {
      const { error } = await supabase
        .from("profissoes")
        .delete()
        .eq("id", deletingProfissaoId)
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao excluir profissão:", error);
        toast.error("Erro ao excluir profissão");
        return;
      }

      setProfissoes(prev => prev.filter(profissao => profissao.id !== deletingProfissaoId));
      toast.success("Profissão excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingProfissaoId(null);
    } catch (error) {
      console.error("Erro na exclusão:", error);
      toast.error("Ocorreu um erro ao excluir a profissão");
    }
  };

  // Filtrar profissões com base no termo de busca e status
  const filteredProfissoes = profissoes.filter(profissao => {
    const matchesSearch = profissao.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || profissao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissões/Ramos</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Profissão
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
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "todos" | "ativo" | "inativo")}
              >
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

          <ProfissoesTable
            profissoes={filteredProfissoes}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Dialog para criação/edição de profissão */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfissao ? "Editar Profissão" : "Nova Profissão"}
            </DialogTitle>
            <DialogDescription>
              {editingProfissao ? "Edite as informações da profissão." : "Preencha as informações para criar uma nova profissão."}
            </DialogDescription>
          </DialogHeader>
          <ProfissoesForm
            profissao={editingProfissao}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteDialogOpen(false);
          setDeletingProfissaoId(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta profissão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
