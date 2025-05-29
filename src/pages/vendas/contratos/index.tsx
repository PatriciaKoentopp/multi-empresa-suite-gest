import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContratosTable } from "@/components/contratos/contratos-table";
import { ContratosForm } from "@/components/contratos/contratos-form";
import { ContratosFilters } from "@/components/contratos/contratos-filters";
import { useContratos } from "@/hooks/useContratos";
import { Contrato, ContratoFormData } from "@/types/contratos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus } from "lucide-react";

export default function ContratosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState<Contrato | null>(null);
  const [viewingContrato, setViewingContrato] = useState<Contrato | null>(null);
  const [deletingContrato, setDeletingContrato] = useState<Contrato | null>(null);
  const [filtros, setFiltros] = useState({
    codigo: "",
    favorecido: "",
    status: "todos",
    periodicidade: "todas",
  });

  const {
    contratos,
    isLoading,
    createContrato,
    updateContrato,
    deleteContrato,
    generateInvoices,
    changeStatus,
  } = useContratos();

  const contratosFiltrados = contratos.filter((contrato) => {
    return (
      (filtros.codigo === "" || 
       contrato.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())) &&
      (filtros.favorecido === "" || 
       contrato.favorecido?.nome.toLowerCase().includes(filtros.favorecido.toLowerCase())) &&
      (filtros.status === "todos" || contrato.status === filtros.status) &&
      (filtros.periodicidade === "todas" || contrato.periodicidade === filtros.periodicidade)
    );
  });

  const handleSubmit = async (formData: ContratoFormData) => {
    if (editingContrato) {
      await updateContrato.mutateAsync({ 
        id: editingContrato.id, 
        formData 
      });
      setEditingContrato(null);
    } else {
      await createContrato.mutateAsync(formData);
    }
    setIsFormOpen(false);
  };

  const handleEdit = (contrato: Contrato) => {
    setEditingContrato(contrato);
    setIsFormOpen(true);
  };

  const handleView = (contrato: Contrato) => {
    setViewingContrato(contrato);
  };

  const handleDelete = (contrato: Contrato) => {
    setDeletingContrato(contrato);
  };

  const confirmDelete = async () => {
    if (deletingContrato) {
      await deleteContrato.mutateAsync(deletingContrato.id);
      setDeletingContrato(null);
    }
  };

  const handleGenerateInvoices = async (contrato: Contrato) => {
    await generateInvoices.mutateAsync(contrato.id);
  };

  const handleChangeStatus = async (contrato: Contrato, novoStatus: string) => {
    await changeStatus.mutateAsync({ 
      id: contrato.id, 
      status: novoStatus 
    });
  };

  const formatInitialData = (contrato: Contrato): Partial<ContratoFormData> => {
    return {
      codigo: contrato.codigo,
      favorecido_id: contrato.favorecido_id,
      servico_id: contrato.servico_id || '',
      descricao: contrato.descricao || '',
      valor_mensal: contrato.valor_mensal,
      data_inicio: new Date(contrato.data_inicio),
      data_fim: new Date(contrato.data_fim),
      data_primeiro_vencimento: new Date(contrato.data_primeiro_vencimento),
      periodicidade: contrato.periodicidade,
      forma_pagamento: contrato.forma_pagamento,
      observacoes: contrato.observacoes || '',
      gerar_automatico: contrato.gerar_automatico,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie os contratos de prestação de serviços
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          variant="blue"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <ContratosFilters 
            filtros={filtros}
            onFiltrosChange={setFiltros}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <ContratosTable
            contratos={contratosFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onGenerateInvoices={handleGenerateInvoices}
            onChangeStatus={handleChangeStatus}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContrato ? "Editar Contrato" : "Novo Contrato"}
            </DialogTitle>
            <DialogDescription>
              {editingContrato 
                ? "Altere as informações do contrato abaixo." 
                : "Preencha as informações para criar um novo contrato."
              }
            </DialogDescription>
          </DialogHeader>
          <ContratosForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingContrato(null);
            }}
            initialData={editingContrato ? formatInitialData(editingContrato) : undefined}
            isLoading={createContrato.isPending || updateContrato.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingContrato} onOpenChange={(open) => !open && setViewingContrato(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {viewingContrato && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Código:</label>
                  <p>{viewingContrato.codigo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status:</label>
                  <p>{viewingContrato.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Favorecido:</label>
                  <p>{viewingContrato.favorecido?.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Serviço:</label>
                  <p>{viewingContrato.servico?.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor Mensal:</label>
                  <p>{new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(viewingContrato.valor_mensal)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Periodicidade:</label>
                  <p>{viewingContrato.periodicidade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Início:</label>
                  <p>{new Date(viewingContrato.data_inicio).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data Fim:</label>
                  <p>{new Date(viewingContrato.data_fim).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              {viewingContrato.descricao && (
                <div>
                  <label className="text-sm font-medium">Descrição:</label>
                  <p>{viewingContrato.descricao}</p>
                </div>
              )}
              {viewingContrato.observacoes && (
                <div>
                  <label className="text-sm font-medium">Observações:</label>
                  <p>{viewingContrato.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingContrato} onOpenChange={(open) => !open && setDeletingContrato(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato "{deletingContrato?.codigo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
