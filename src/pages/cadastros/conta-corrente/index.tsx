
import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Mock data inicial
const initialContas: ContaCorrente[] = [
  {
    id: "1",
    nome: "Conta Principal",
    banco: "Banco do Brasil",
    agencia: "1234-5",
    numero: "12345-6",
    contaContabilId: "1",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Conta Pagamentos",
    banco: "Caixa Econômica",
    agencia: "4321-5",
    numero: "54321-6",
    contaContabilId: "2",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "Conta Recebimentos",
    banco: "Bradesco",
    agencia: "5678-9",
    numero: "98765-4",
    contaContabilId: "3",
    status: "inativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export default function ContaCorrentePage() {
  const [contas, setContas] = useState<ContaCorrente[]>(initialContas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaCorrente | undefined>(undefined);
  const [viewingConta, setViewingConta] = useState<ContaCorrente | undefined>(undefined);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [bancoFilter, setBancoFilter] = useState<string>("todos");

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

  const handleSubmit = (data: Partial<ContaCorrente>) => {
    if (editingConta) {
      setContas((prev) =>
        prev.map((c) =>
          c.id === editingConta.id
            ? {
                ...c,
                ...data,
                updatedAt: new Date(),
              }
            : c
        )
      );
      toast.success("Conta corrente atualizada com sucesso!");
    } else {
      const newConta: ContaCorrente = {
        id: `${Date.now()}`,
        ...data as ContaCorrente,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContas((prev) => [...prev, newConta]);
      toast.success("Conta corrente criada com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setContas((prev) => prev.filter((conta) => conta.id !== id));
    toast.success("Conta corrente excluída com sucesso!");
  };

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
