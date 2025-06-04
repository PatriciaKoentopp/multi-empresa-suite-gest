import { useState, useMemo, useEffect } from "react";
import { MotivoPerda } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { MotivosPerdaForm } from "@/components/motivos-perda/motivos-perda-form";
import { MotivosPerdaTable } from "@/components/motivos-perda/motivos-perda-table";
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

export default function MotivosPerdaPage() {
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerda[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMotivoPerda, setEditingMotivoPerda] = useState<MotivoPerda | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [motivoToDelete, setMotivoToDelete] = useState<string | null>(null);
  
  // Usar o contexto da empresa
  const { currentCompany } = useCompany();
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  // Buscar os dados do Supabase
  const fetchMotivosPerda = async () => {
    setIsLoading(true);
    try {
      if (!currentCompany?.id) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('motivos_perda')
        .select('id, nome, status, empresa_id, created_at, updated_at')
        .eq('empresa_id', currentCompany.id);
        
      if (error) {
        throw error;
      }
      
      // Converter dados para o formato MotivoPerda
      const formattedData: MotivoPerda[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        status: item.status as "ativo" | "inativo",
        empresa_id: item.empresa_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setMotivosPerda(formattedData);
    } catch (error) {
      console.error('Erro ao buscar motivos de perda:', error);
      toast.error('Erro ao carregar os motivos de perda');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivosPerda();
  }, [currentCompany?.id]);

  const handleOpenDialog = (motivoPerda?: MotivoPerda) => {
    setEditingMotivoPerda(motivoPerda);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingMotivoPerda(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany?.id) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }
    
    try {
      if (editingMotivoPerda) {
        // Update existing motivoPerda
        const { error } = await supabase
          .from('motivos_perda')
          .update({
            nome: data.nome,
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMotivoPerda.id);
          
        if (error) throw error;
        
        toast.success("Motivo de perda atualizado com sucesso!");
      } else {
        // Create new motivoPerda
        const { error } = await supabase
          .from('motivos_perda')
          .insert({
            nome: data.nome,
            status: data.status,
            empresa_id: currentCompany.id
          });
          
        if (error) throw error;
        
        toast.success("Motivo de perda criado com sucesso!");
      }
      
      // Recarregar dados após sucesso
      fetchMotivosPerda();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(editingMotivoPerda 
        ? "Erro ao atualizar motivo de perda" 
        : "Erro ao criar motivo de perda");
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setMotivoToDelete(id);
    setAlertDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!motivoToDelete) return;
    
    try {
      const { error } = await supabase
        .from('motivos_perda')
        .delete()
        .eq('id', motivoToDelete);
        
      if (error) throw error;
      
      toast.success("Motivo de perda excluído com sucesso!");
      fetchMotivosPerda();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Erro ao excluir motivo de perda");
    } finally {
      setAlertDialogOpen(false);
      setMotivoToDelete(null);
    }
  };

  // Aplicar filtros aos motivos de perda
  const filteredMotivosPerda = useMemo(() => {
    return motivosPerda.filter((motivoPerda) => {
      const matchesSearch = motivoPerda.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || motivoPerda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [motivosPerda, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Motivos de Perda</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Motivo de Perda
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

          <MotivosPerdaTable
            motivosPerda={filteredMotivosPerda}
            onEdit={handleOpenDialog}
            onDelete={openDeleteConfirmation}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMotivoPerda
                ? "Editar Motivo de Perda"
                : "Novo Motivo de Perda"}
            </DialogTitle>
          </DialogHeader>
          <MotivosPerdaForm
            motivoPerda={editingMotivoPerda}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este motivo de perda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
