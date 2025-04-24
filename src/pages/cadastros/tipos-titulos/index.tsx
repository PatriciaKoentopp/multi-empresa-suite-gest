
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { TiposTitulosForm } from "@/components/tipos-titulos/tipos-titulos-form";
import { TiposTitulosTable } from "@/components/tipos-titulos/tipos-titulos-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TipoTitulo } from "@/types/tipos-titulos";
import { PlanoConta } from "@/types/plano-contas";

export default function TiposTitulosPage() {
  const { currentCompany } = useCompany();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoTitulo | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const queryClient = useQueryClient();

  // Buscar tipos de títulos
  const { data: tiposTitulos = [] } = useQuery({
    queryKey: ["tipos-titulos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("tipos_titulos")
        .select("*")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        toast.error("Erro ao carregar tipos de títulos");
        throw error;
      }

      return data as TipoTitulo[];
    },
    enabled: !!currentCompany?.id,
  });

  // Buscar contas contábeis
  const { data: contasContabeis = [] } = useQuery({
    queryKey: ["plano-contas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        toast.error("Erro ao carregar plano de contas");
        throw error;
      }

      return data as PlanoConta[];
    },
    enabled: !!currentCompany?.id,
  });

  const createTipoMutation = useMutation({
    mutationFn: async (data: Omit<TipoTitulo, "id" | "created_at" | "updated_at" | "empresa_id">) => {
      if (!currentCompany?.id) throw new Error("Empresa não selecionada");

      const { error } = await supabase
        .from("tipos_titulos")
        .insert([{ ...data, empresa_id: currentCompany.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-titulos"] });
      toast.success("Tipo de título criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar tipo de título");
    },
  });

  const updateTipoMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TipoTitulo> & { id: string }) => {
      const { error } = await supabase
        .from("tipos_titulos")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-titulos"] });
      toast.success("Tipo de título atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar tipo de título");
    },
  });

  const deleteTipoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tipos_titulos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-titulos"] });
      toast.success("Tipo de título excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingTipoId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir tipo de título");
    },
  });

  const handleOpenDialog = (tipo?: TipoTitulo) => {
    setEditingTipo(tipo);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingTipo(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: any) => {
    if (editingTipo) {
      updateTipoMutation.mutate({ id: editingTipo.id, ...data });
    } else {
      createTipoMutation.mutate(data);
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTipoId, setDeletingTipoId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingTipoId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredTipos = tiposTitulos.filter((tipo) => {
    const matchesSearch = tipo.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || tipo.tipo === tipoFilter;
    const matchesStatus = statusFilter === "todos" || tipo.status === statusFilter;

    return matchesSearch && matchesTipo && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Títulos</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="receber" className="text-green-600">Receber</SelectItem>
                <SelectItem value="pagar" className="text-red-600">Pagar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TiposTitulosTable
            tipos={filteredTipos}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? "Editar Tipo de Título" : "Novo Tipo de Título"}
            </DialogTitle>
          </DialogHeader>
          <TiposTitulosForm
            tipoTitulo={editingTipo}
            contasContabeis={contasContabeis}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de título? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTipoId && deleteTipoMutation.mutate(deletingTipoId)}
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
