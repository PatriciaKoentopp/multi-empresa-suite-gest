
import { useState, useEffect } from "react";
import { GrupoProduto } from "@/types/grupo-produtos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { GrupoProdutosForm } from "@/components/grupo-produtos/grupo-produtos-form";
import { GrupoProdutosTable } from "@/components/grupo-produtos/grupo-produtos-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";

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

export default function GrupoProdutosPage() {
  const [grupos, setGrupos] = useState<GrupoProduto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoProduto | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingGrupoId, setDeletingGrupoId] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany) {
      loadGrupos();
    }
  }, [currentCompany]);

  const loadGrupos = async () => {
    if (!currentCompany) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("grupo_produtos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("nome");

      if (error) throw error;
      
      setGrupos(data || []);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
      toast.error("Não foi possível carregar os grupos de produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (grupo?: GrupoProduto) => {
    setEditingGrupo(grupo);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingGrupo(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      if (editingGrupo) {
        // Atualizar grupo existente
        const { error } = await supabase
          .from("grupo_produtos")
          .update({
            nome: data.nome,
            status: data.status,
          })
          .eq("id", editingGrupo.id);

        if (error) throw error;
        toast.success("Grupo de produtos atualizado com sucesso!");
        loadGrupos();
      } else {
        // Criar novo grupo
        const { error } = await supabase
          .from("grupo_produtos")
          .insert({
            nome: data.nome,
            status: data.status,
            empresa_id: currentCompany.id,
          });

        if (error) throw error;
        toast.success("Grupo de produtos criado com sucesso!");
        loadGrupos();
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Erro na operação:", error);
      toast.error("Ocorreu um erro ao processar a solicitação");
    }
  };

  const handleDelete = (id: string) => {
    setDeletingGrupoId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingGrupoId || !currentCompany) return;

    try {
      const { error } = await supabase
        .from("grupo_produtos")
        .delete()
        .eq("id", deletingGrupoId);

      if (error) throw error;
      toast.success("Grupo de produtos excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingGrupoId(null);
      loadGrupos();
    } catch (error) {
      console.error("Erro na exclusão:", error);
      toast.error("Ocorreu um erro ao excluir o grupo");
    }
  };

  // Filtrar grupos com base no termo de busca
  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grupos de Produtos/Serviços</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <GrupoProdutosTable
            grupos={filteredGrupos}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialog para criação/edição de grupo */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo
                ? "Editar Grupo de Produtos/Serviços"
                : "Novo Grupo de Produtos/Serviços"}
            </DialogTitle>
            <DialogDescription>
              {editingGrupo 
                ? "Edite as informações do grupo de produtos/serviços."
                : "Preencha as informações para criar um novo grupo de produtos/serviços."}
            </DialogDescription>
          </DialogHeader>
          <GrupoProdutosForm
            grupo={editingGrupo}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false);
            setDeletingGrupoId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.
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
