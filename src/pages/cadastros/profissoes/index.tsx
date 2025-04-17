
import { useState, useMemo } from "react";
import { Profissao } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { ProfissoesForm } from "@/components/profissoes/profissoes-form";
import { ProfissoesTable } from "@/components/profissoes/profissoes-table";
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

// Mock data - in a real app, this would come from a database
const initialProfissoes: Profissao[] = [
  {
    id: "1",
    nome: "Desenvolvedor",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Designer",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ProfissoesPage() {
  const [profissoes, setProfissoes] = useState<Profissao[]>(initialProfissoes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfissao, setEditingProfissao] = useState<Profissao | undefined>(
    undefined
  );
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const handleOpenDialog = (profissao?: Profissao) => {
    setEditingProfissao(profissao);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingProfissao(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (editingProfissao) {
      // Update existing profissao
      setProfissoes((prev) =>
        prev.map((p) =>
          p.id === editingProfissao.id
            ? {
                ...p,
                nome: data.nome,
                status: data.status,
                updatedAt: new Date(),
              }
            : p
        )
      );
      toast.success("Profissão atualizada com sucesso!");
    } else {
      // Create new profissao
      const newProfissao: Profissao = {
        id: `${Date.now()}`,
        nome: data.nome,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProfissoes((prev) => [...prev, newProfissao]);
      toast.success("Profissão criada com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setProfissoes((prev) => prev.filter((profissao) => profissao.id !== id));
    toast.success("Profissão excluída com sucesso!");
  };

  // Aplicar filtros às profissoes
  const filteredProfissoes = useMemo(() => {
    return profissoes.filter((profissao) => {
      const matchesSearch = profissao.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || profissao.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [profissoes, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissões</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Profissão
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

          <ProfissoesTable
            profissoes={filteredProfissoes}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProfissao
                ? "Editar Profissão"
                : "Nova Profissão"}
            </DialogTitle>
          </DialogHeader>
          <ProfissoesForm
            profissao={editingProfissao}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
