import { useState, useMemo, useEffect } from "react";
import { ContaCorrente } from "@/types/conta-corrente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { ContaCorrenteForm } from "@/components/conta-corrente/conta-corrente-form";
import { ContaCorrenteTable } from "@/components/conta-corrente/conta-corrente-table";
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

export default function ContaCorrentePage() {
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaCorrente | undefined>(undefined);
  const [viewingConta, setViewingConta] = useState<ContaCorrente | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Usar o contexto da empresa
  const { currentCompany } = useCompany();
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [bancoFilter, setBancoFilter] = useState<string>("todos");

  // Mock data para contas contábeis
  const mockContasContabeis = [
    {
      id: "1",
      codigo: "1.1.01",
      descricao: "Banco do Brasil - Conta Corrente",
      tipo: "ativo",
      considerarDRE: false,
      status: "ativo"
    },
    {
      id: "2",
      codigo: "1.1.02",
      descricao: "Caixa Econômica - Conta Corrente",
      tipo: "ativo",
      considerarDRE: false,
      status: "ativo"
    },
    {
      id: "3",
      codigo: "1.1.03",
      descricao: "Bradesco - Conta Corrente",
      tipo: "ativo",
      considerarDRE: false,
      status: "ativo"
    }
  ];

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingContaId, setDeletingContaId] = useState<string | null>(null);

  // Buscar os dados do Supabase
  const fetchContasCorrentes = async () => {
    setIsLoading(true);
    try {
      if (!currentCompany?.id) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('contas_correntes')
        .select('*')
        .eq('empresa_id', currentCompany.id);
        
      if (error) {
        throw error;
      }
      
      // Converter dados para o formato ContaCorrente
      const formattedData: ContaCorrente[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        banco: item.banco,
        agencia: item.agencia,
        numero: item.numero,
        contaContabilId: item.conta_contabil_id,
        status: item.status as "ativo" | "inativo",
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        data: item.data ? new Date(item.data) : undefined,
        saldoInicial: item.saldo_inicial
      }));
      
      setContas(formattedData);
    } catch (error) {
      console.error('Erro ao buscar contas correntes:', error);
      toast.error('Erro ao carregar as contas correntes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContasCorrentes();
  }, [currentCompany?.id]);

  const bancos = useMemo(() => {
    const uniqueBancos = Array.from(new Set(contas.map(conta => conta.banco)));
    return uniqueBancos;
  }, [contas]);

  const handleOpenDialog = (conta?: ContaCorrente, isViewing = false) => {
    if (isViewing) {
      setViewingConta(conta);
    } else {
      setEditingConta(conta);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingConta(undefined);
    setViewingConta(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: Partial<ContaCorrente>) => {
    if (!currentCompany?.id) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }
    
    try {
      if (editingConta) {
        // Update existing conta corrente
        const { error } = await supabase
          .from('contas_correntes')
          .update({
            nome: data.nome,
            banco: data.banco,
            agencia: data.agencia,
            numero: data.numero,
            conta_contabil_id: data.contaContabilId,
            status: data.status,
            data: data.data?.toISOString(),
            saldo_inicial: data.saldoInicial,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingConta.id);
          
        if (error) throw error;
        
        toast.success("Conta corrente atualizada com sucesso!");
      } else {
        // Create new conta corrente
        const { error } = await supabase
          .from('contas_correntes')
          .insert({
            empresa_id: currentCompany.id,
            nome: data.nome,
            banco: data.banco,
            agencia: data.agencia,
            numero: data.numero,
            conta_contabil_id: data.contaContabilId,
            status: data.status,
            data: data.data?.toISOString(),
            saldo_inicial: data.saldoInicial
          });
          
        if (error) throw error;
        
        toast.success("Conta corrente criada com sucesso!");
      }
      
      // Recarregar dados após sucesso
      fetchContasCorrentes();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(editingConta 
        ? "Erro ao atualizar conta corrente" 
        : "Erro ao criar conta corrente");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingContaId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingContaId) return;

    try {
      const { error } = await supabase
        .from('contas_correntes')
        .delete()
        .eq('id', deletingContaId);
        
      if (error) throw error;
      
      toast.success("Conta corrente excluída com sucesso!");
      fetchContasCorrentes();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Erro ao excluir conta corrente");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingContaId(null);
    }
  };

  // Aplicar filtros às contas correntes
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const matchesSearch = 
        conta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.agencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.numero.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "todos" || conta.status === statusFilter;
      const matchesBanco = bancoFilter === "todos" || conta.banco === bancoFilter;
      
      return matchesSearch && matchesStatus && matchesBanco;
    });
  }, [contas, searchTerm, statusFilter, bancoFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas Correntes</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta corrente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, banco, agência ou número..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "todos" | "ativo" | "inativo")}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={bancoFilter}
              onValueChange={setBancoFilter}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos os bancos</SelectItem>
                {bancos.map((banco) => (
                  <SelectItem key={banco} value={banco}>
                    {banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6">
            <ContaCorrenteTable
              contas={filteredContas}
              contasContabeis={mockContasContabeis}
              onView={(conta) => handleOpenDialog(conta, true)}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {viewingConta
                ? "Visualizar Conta"
                : editingConta
                ? "Editar Conta"
                : "Nova Conta"}
            </DialogTitle>
          </DialogHeader>
          <ContaCorrenteForm
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            contasContabeis={mockContasContabeis}
            initialData={viewingConta || editingConta}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
