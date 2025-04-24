
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { PlanoContasForm } from "@/components/plano-contas/plano-contas-form";
import { PlanoContasTable } from "@/components/plano-contas/plano-contas-table";
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
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlanoConta } from "@/types/plano-contas";

export default function PlanoContasPage() {
  const { currentCompany } = useCompany();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<PlanoConta | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const queryClient = useQueryClient();

  // Buscar contas do plano de contas
  const { data: contas = [] } = useQuery({
    queryKey: ["plano-contas", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("codigo", { ascending: true }); // Add order by codigo

      if (error) {
        toast.error("Erro ao carregar plano de contas");
        throw error;
      }

      return data as PlanoConta[];
    },
    enabled: !!currentCompany?.id,
  });

  const createContaMutation = useMutation({
    mutationFn: async (data: Omit<PlanoConta, "id" | "created_at" | "updated_at" | "empresa_id">) => {
      if (!currentCompany?.id) throw new Error("Empresa não selecionada");

      const { error } = await supabase
        .from("plano_contas")
        .insert([{ ...data, empresa_id: currentCompany.id }]);

      if (error) {
        console.error("Erro ao criar conta:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-contas"] });
      toast.success("Conta criada com sucesso!");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Erro detalhado:", error);
      toast.error("Erro ao criar conta");
    },
  });

  const updateContaMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanoConta> & { id: string }) => {
      const { error } = await supabase
        .from("plano_contas")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-contas"] });
      toast.success("Conta atualizada com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar conta");
    },
  });

  const deleteContaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plano_contas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-contas"] });
      toast.success("Conta excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir conta");
    },
  });

  const handleOpenDialog = (conta?: PlanoConta) => {
    setEditingConta(conta);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingConta(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: any) => {
    if (editingConta) {
      updateContaMutation.mutate({ id: editingConta.id, ...data });
    } else {
      createContaMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    deleteContaMutation.mutate(id);
  };

  const [categoriaFilter, setCategoriaFilter] = useState<string>("todos");

  // Alterar a lógica de filtro para incluir categoria
  const filteredContas = contas.filter((conta) => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || conta.tipo === tipoFilter;
    const matchesStatus = statusFilter === "todos" || conta.status === statusFilter;
    const matchesCategoria = categoriaFilter === "todos" || conta.categoria === categoriaFilter;

    return matchesSearch && matchesTipo && matchesStatus && matchesCategoria;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plano de Contas</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="passivo">Passivo</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="patrimonio">Patrimônio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todas as categorias</SelectItem>
                <SelectItem value="título">Título</SelectItem>
                <SelectItem value="movimentação">Movimentação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PlanoContasTable
            contas={filteredContas}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingConta ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>
          <PlanoContasForm
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            initialData={editingConta}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
