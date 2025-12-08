import { useState, useMemo, useEffect } from "react";
import { Origem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { OrigensForm } from "@/components/origens/origens-form";
import { OrigensTable } from "@/components/origens/origens-table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export default function OrigensPage() {
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrigem, setEditingOrigem] = useState<Origem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const { currentCompany } = useCompany();

  // Função para buscar as origens
  const fetchOrigens = async () => {
    if (!currentCompany) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("origens")
        .select("*")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao carregar origens:", error);
        toast.error("Erro ao carregar origens");
        return;
      }

      if (data) {
        const origensFormatadas: Origem[] = data.map(origem => ({
          id: origem.id,
          nome: origem.nome,
          status: origem.status as "ativo" | "inativo",
          empresa_id: origem.empresa_id,
          created_at: origem.created_at,
          updated_at: origem.updated_at,
        }));
        setOrigens(origensFormatadas);
      }
    } catch (err) {
      console.error("Exceção ao carregar origens:", err);
      toast.error("Erro inesperado ao carregar origens");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para carregar os dados quando a página é carregada
  useEffect(() => {
    fetchOrigens();
  }, [currentCompany]);

  const handleOpenDialog = (origem?: Origem) => {
    setEditingOrigem(origem);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingOrigem(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingOrigem) {
        // Update existing origem
        const { error } = await supabase
          .from("origens")
          .update({
            nome: data.nome,
            status: data.status,
          })
          .eq("id", editingOrigem.id)
          .eq("empresa_id", currentCompany.id);

        if (error) {
          console.error("Erro ao atualizar origem:", error);
          toast.error("Erro ao atualizar origem");
          return;
        }

        toast.success("Origem atualizada com sucesso!");
      } else {
        // Create new origem
        const { error } = await supabase
          .from("origens")
          .insert([
            {
              empresa_id: currentCompany.id,
              nome: data.nome,
              status: data.status,
            },
          ]);

        if (error) {
          console.error("Erro ao criar origem:", error);
          toast.error("Erro ao criar origem");
          return;
        }

        toast.success("Origem criada com sucesso!");
      }
      
      // Fecha o modal
      handleCloseDialog();
      
      // Atualiza os dados
      fetchOrigens();
      
    } catch (err) {
      console.error("Exceção durante operação de origem:", err);
      toast.error("Erro inesperado ao processar origem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    await handleDelete(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleDelete = async (id: string) => {
    if (!currentCompany) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("origens")
        .delete()
        .eq("id", id)
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao excluir origem:", error);
        toast.error("Erro ao excluir origem", {
          description: "Não foi possível remover a origem selecionada."
        });
        return;
      }

      toast.success("Origem excluída com sucesso!", {
        description: "A origem foi removida permanentemente do sistema."
      });
      
      // Atualiza os dados
      fetchOrigens();
      
    } catch (err) {
      console.error("Exceção ao excluir origem:", err);
      toast.error("Erro inesperado ao excluir origem", {
        description: "Por favor, tente novamente mais tarde."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros às origens
  const filteredOrigens = useMemo(() => {
    return origens.filter((origem) => {
      const matchesSearch = origem.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || origem.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [origens, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Origens</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Origem
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

          <OrigensTable
            origens={filteredOrigens}
            onEdit={handleOpenDialog}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrigem
                ? "Editar Origem"
                : "Nova Origem"}
            </DialogTitle>
          </DialogHeader>
          <OrigensForm
            origem={editingOrigem}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirm({ isOpen, id: isOpen ? deleteConfirm.id : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta origem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
