import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContratosForm } from "@/components/contratos/contratos-form";
import { ContratosTable } from "@/components/contratos/contratos-table";
import { Contrato, ContratoFormData } from "@/types/contratos";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contratos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [deletingContrato, setDeletingContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const queryClient = useQueryClient();

  // Buscar contratos
  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select(`
          *,
          favorecido:favorecidos(
            nome,
            documento
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contrato[];
    },
  });

  // Filtrar contratos
  const contratosFiltrados = contratos.filter((contrato) => {
    const matchesSearch = 
      contrato.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.favorecido?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || contrato.status === statusFilter;
    const matchesTipo = tipoFilter === "todos" || contrato.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Estatísticas
  const stats = {
    total: contratos.length,
    ativos: contratos.filter(c => c.status === 'ativo').length,
    suspensos: contratos.filter(c => c.status === 'suspenso').length,
    encerrados: contratos.filter(c => c.status === 'encerrado').length,
    valorTotal: contratos
      .filter(c => c.status === 'ativo')
      .reduce((acc, c) => acc + c.valor_mensal, 0)
  };

  // Mutação para criar/editar contrato
  const createContratoMutation = useMutation({
    mutationFn: async (data: ContratoFormData) => {
      const contratoData = {
        ...data,
        data_inicio: format(data.data_inicio!, "yyyy-MM-dd"),
        data_fim: format(data.data_fim!, "yyyy-MM-dd"),
        valor_total: data.valor_mensal * 12, // Cálculo básico, pode ser ajustado
      };

      if (editingContrato) {
        const { error } = await supabase
          .from("contratos")
          .update(contratoData)
          .eq("id", editingContrato.id);
        if (error) throw error;
      } else {
        const { data: newContrato, error } = await supabase
          .from("contratos")
          .insert(contratoData)
          .select()
          .single();
        
        if (error) throw error;

        // Gerar parcelas automaticamente se habilitado
        if (data.gerar_automatico) {
          const { error: parcelasError } = await supabase.rpc(
            "gerar_parcelas_contrato",
            { contrato_id_param: newContrato.id }
          );
          if (parcelasError) {
            console.error("Erro ao gerar parcelas:", parcelasError);
            toast.error("Contrato criado, mas erro ao gerar parcelas");
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      setIsFormOpen(false);
      setEditingContrato(null);
      toast.success(editingContrato ? "Contrato atualizado!" : "Contrato criado!");
    },
    onError: (error) => {
      console.error("Erro ao salvar contrato:", error);
      toast.error("Erro ao salvar contrato");
    },
  });

  // Mutação para excluir contrato
  const deleteContratoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contratos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      setDeletingContrato(null);
      toast.success("Contrato excluído!");
    },
    onError: (error) => {
      console.error("Erro ao excluir contrato:", error);
      toast.error("Erro ao excluir contrato");
    },
  });

  // Mutação para gerar contas a receber
  const generateInvoicesMutation = useMutation({
    mutationFn: async (contratoId: string) => {
      // Buscar parcelas pendentes do contrato
      const { data: parcelas, error: parcelasError } = await supabase
        .from("contratos_parcelas")
        .select("*")
        .eq("contrato_id", contratoId)
        .eq("status", "pendente")
        .order("data_vencimento");

      if (parcelasError) throw parcelasError;

      // Buscar dados do contrato
      const { data: contrato, error: contratoError } = await supabase
        .from("contratos")
        .select("*")
        .eq("id", contratoId)
        .single();

      if (contratoError) throw contratoError;

      // Gerar movimentação para cada parcela
      for (const parcela of parcelas) {
        const { data: movimentacao, error: movError } = await supabase
          .from("movimentacoes")
          .insert({
            tipo_operacao: "receber",
            data_lancamento: parcela.data_vencimento,
            descricao: `Contrato ${contrato.codigo} - ${parcela.numero_parcela}`,
            valor: parcela.valor,
            favorecido_id: contrato.favorecido_id,
            numero_parcelas: 1,
            primeiro_vencimento: parcela.data_vencimento,
            forma_pagamento: contrato.forma_pagamento,
          })
          .select()
          .single();

        if (movError) throw movError;

        // Criar a parcela da movimentação
        const { error: parcelaMovError } = await supabase
          .from("movimentacoes_parcelas")
          .insert({
            movimentacao_id: movimentacao.id,
            numero: 1,
            valor: parcela.valor,
            data_vencimento: parcela.data_vencimento,
          });

        if (parcelaMovError) throw parcelaMovError;

        // Atualizar status da parcela do contrato
        const { error: updateError } = await supabase
          .from("contratos_parcelas")
          .update({
            status: "gerada",
            movimentacao_id: movimentacao.id,
            data_geracao_conta: new Date().toISOString().split('T')[0],
          })
          .eq("id", parcela.id);

        if (updateError) throw updateError;
      }

      return parcelas.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success(`${count} contas a receber geradas!`);
    },
    onError: (error) => {
      console.error("Erro ao gerar contas:", error);
      toast.error("Erro ao gerar contas a receber");
    },
  });

  const handleOpenForm = () => {
    setEditingContrato(null);
    setIsFormOpen(true);
  };

  const handleEdit = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setIsFormOpen(true);
  };

  const handleDelete = (contrato: Contrato) => {
    setDeletingContrato(contrato);
  };

  const handleView = (contrato: Contrato) => {
    toast.info("Visualização em desenvolvimento");
  };

  const handleGenerateInvoices = (contrato: Contrato) => {
    generateInvoicesMutation.mutate(contrato.id);
  };

  const handleSubmit = (data: ContratoFormData) => {
    createContratoMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos de serviços e aluguéis
          </p>
        </div>
        <Button onClick={handleOpenForm} variant="blue">
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Suspensos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.suspensos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Encerrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.encerrados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Mensal Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.valorTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por código, favorecido ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <ContratosTable
        contratos={contratosFiltrados}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onGenerateInvoices={handleGenerateInvoices}
        isLoading={isLoading}
      />

      {/* Modal do formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContrato ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
          </DialogHeader>
          <ContratosForm
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            initialData={editingContrato ? {
              codigo: editingContrato.codigo,
              favorecido_id: editingContrato.favorecido_id,
              tipo: editingContrato.tipo,
              descricao: editingContrato.descricao || "",
              valor_mensal: editingContrato.valor_mensal,
              data_inicio: new Date(editingContrato.data_inicio),
              data_fim: new Date(editingContrato.data_fim),
              dia_vencimento: editingContrato.dia_vencimento,
              periodicidade: editingContrato.periodicidade,
              forma_pagamento: editingContrato.forma_pagamento,
              observacoes: editingContrato.observacoes || "",
              gerar_automatico: editingContrato.gerar_automatico,
            } : undefined}
            isLoading={createContratoMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deletingContrato} onOpenChange={() => setDeletingContrato(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato "{deletingContrato?.codigo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContrato && deleteContratoMutation.mutate(deletingContrato.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
