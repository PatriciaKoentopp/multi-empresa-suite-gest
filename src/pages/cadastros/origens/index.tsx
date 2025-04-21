
import { useState, useMemo } from "react";
import { Origem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { OrigensForm } from "@/components/origens/origens-form";
import { OrigensTable } from "@/components/origens/origens-table";
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
const initialOrigens: Origem[] = [
  {
    id: "1",
    nome: "Site",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Indicação",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "LinkedIn",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    nome: "Evento",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    nome: "Ligação",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function OrigensPage() {
  const [origens, setOrigens] = useState<Origem[]>(initialOrigens);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrigem, setEditingOrigem] = useState<Origem | undefined>(
    undefined
  );
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const handleOpenDialog = (origem?: Origem) => {
    setEditingOrigem(origem);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingOrigem(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (editingOrigem) {
      // Update existing origem
      setOrigens((prev) =>
        prev.map((p) =>
          p.id === editingOrigem.id
            ? {
                ...p,
                nome: data.nome,
                status: data.status,
                updatedAt: new Date(),
              }
            : p
        )
      );
      toast.success("Origem atualizada com sucesso!");
    } else {
      // Create new origem
      const newOrigem: Origem = {
        id: `${Date.now()}`,
        nome: data.nome,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setOrigens((prev) => [...prev, newOrigem]);
      toast.success("Origem criada com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setOrigens((prev) => prev.filter((origem) => origem.id !== id));
    toast.success("Origem excluída com sucesso!");
  };

  // Aplicar filtros às origens
  const filteredOrigens = useMemo(() => {
    return origens.filter((origem) => {
      const matchesSearch = origem.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || origem.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [origens, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Origens</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Origem
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

          <OrigensTable
            origens={filteredOrigens}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrigem
                ? "Editar Origem"
                : "Nova Origem"}
            </DialogTitle>
          </DialogHeader>
          <OrigensForm
            origem={editingOrigem}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
