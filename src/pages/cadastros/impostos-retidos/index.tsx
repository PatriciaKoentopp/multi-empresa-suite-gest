import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { ImpostosRetidosForm } from "@/components/impostos-retidos/impostos-retidos-form";
import { ImpostosRetidosTable } from "@/components/impostos-retidos/impostos-retidos-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
import { ImpostoRetido } from "@/types/impostos-retidos";
import { TipoTitulo } from "@/types/tipos-titulos";

export default function ImpostosRetidosPage() {
  const { currentCompany } = useCompany();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImposto, setEditingImposto] = useState<ImpostoRetido | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingImpostoId, setDeletingImpostoId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Buscar impostos retidos
  const { data: impostosRetidos = [] } = useQuery({
    queryKey: ["impostos-retidos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from("impostos_retidos")
        .select("*")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        toast.error("Erro ao carregar impostos retidos");
        throw error;
      }

      return data as ImpostoRetido[];
    },
    enabled: !!currentCompany?.id,
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: Omit<ImpostoRetido, "id" | "created_at" | "updated_at" | "empresa_id">) => {
      if (!currentCompany?.id) throw new Error("Empresa não selecionada");

      const { error } = await supabase
        .from("impostos_retidos")
        .insert([{ ...data, empresa_id: currentCompany.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impostos-retidos"] });
      toast.success("Imposto retido criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar imposto retido");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ImpostoRetido> & { id: string }) => {
      const { error } = await supabase
        .from("impostos_retidos")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impostos-retidos"] });
      toast.success("Imposto retido atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar imposto retido");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("impostos_retidos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impostos-retidos"] });
      toast.success("Imposto retido excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setDeletingImpostoId(null);
    },
    onError: () => {
      toast.error("Erro ao excluir imposto retido");
    },
  });

  const handleOpenDialog = (imposto?: ImpostoRetido) => {
    setEditingImposto(imposto);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingImposto(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: any) => {
    if (editingImposto) {
      updateMutation.mutate({ id: editingImposto.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingImpostoId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredImpostos = impostosRetidos.filter((imposto) => {
    const matchesSearch = imposto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || imposto.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Impostos Retidos</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Imposto Retido
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

          <ImpostosRetidosTable
            impostos={filteredImpostos}
            tiposTitulos={tiposTitulos}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingImposto ? "Editar Imposto Retido" : "Novo Imposto Retido"}
            </DialogTitle>
          </DialogHeader>
          <ImpostosRetidosForm
            impostoRetido={editingImposto}
            tiposTitulos={tiposTitulos}
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
              Tem certeza que deseja excluir este imposto retido? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingImpostoId && deleteMutation.mutate(deletingImpostoId)}
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
