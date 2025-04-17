import { useState } from "react";
import { PlanoConta } from "@/types";
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

// Dados de exemplo - em uma aplicação real, isso viria de uma API
const contasIniciais: PlanoConta[] = [
  {
    id: "1",
    codigo: "1",
    descricao: "Ativo",
    tipo: "ativo",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "1.1",
    codigo: "1.1",
    descricao: "Ativo Circulante",
    tipo: "ativo",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "1.1.1",
    codigo: "1.1.1",
    descricao: "Caixa e Equivalentes",
    tipo: "ativo",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    codigo: "2",
    descricao: "Passivo",
    tipo: "passivo",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2.1",
    codigo: "2.1",
    descricao: "Passivo Circulante",
    tipo: "passivo",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    codigo: "3",
    descricao: "Receitas",
    tipo: "receita",
    considerarDRE: true,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3.1",
    codigo: "3.1",
    descricao: "Receitas Operacionais",
    tipo: "receita",
    considerarDRE: true,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    codigo: "4",
    descricao: "Despesas",
    tipo: "despesa",
    considerarDRE: true,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4.1",
    codigo: "4.1",
    descricao: "Despesas Administrativas",
    tipo: "despesa",
    considerarDRE: true,
    status: "inativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    codigo: "5",
    descricao: "Patrimônio Líquido",
    tipo: "patrimonio",
    considerarDRE: false,
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export default function PlanoContasPage() {
  const [contas, setContas] = useState<PlanoConta[]>(contasIniciais);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<PlanoConta | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const handleOpenDialog = (conta?: PlanoConta) => {
    setEditingConta(conta);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingConta(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: { 
    codigo: string; 
    descricao: string; 
    tipo: "ativo" | "passivo" | "receita" | "despesa" | "patrimonio";
    considerarDRE: boolean;
    status: "ativo" | "inativo";
  }) => {
    if (editingConta) {
      // Atualizar conta existente
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
      toast.success("Conta atualizada com sucesso!");
    } else {
      // Criar nova conta
      const newConta: PlanoConta = {
        id: `${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContas((prev) => [...prev, newConta]);
      toast.success("Conta criada com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setContas((prev) => prev.filter((conta) => conta.id !== id));
    toast.success("Conta excluída com sucesso!");
  };

  // Filtrar contas com base em todos os critérios
  const filteredContas = contas.filter((conta) => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "todos" || conta.tipo === tipoFilter;
    const matchesStatus = statusFilter === "todos" || conta.status === statusFilter;

    return matchesSearch && matchesTipo && matchesStatus;
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
