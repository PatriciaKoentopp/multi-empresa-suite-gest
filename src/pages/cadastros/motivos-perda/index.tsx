
import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - in a real app, this would come from a database
const initialMotivosPerda: MotivoPerda[] = [
  {
    id: "1",
    nome: "Preço alto",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    nome: "Concorrência",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    nome: "Cliente indeciso",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    nome: "Falta de recursos",
    status: "ativo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function MotivosPerdaPage() {
  const [motivosPerda, setMotivosPerda] = useState<MotivoPerda[]>(initialMotivosPerda);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMotivoPerda, setEditingMotivoPerda] = useState<MotivoPerda | undefined>(
    undefined
  );
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  const handleOpenDialog = (motivoPerda?: MotivoPerda) => {
    setEditingMotivoPerda(motivoPerda);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingMotivoPerda(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (editingMotivoPerda) {
      // Update existing motivoPerda
      setMotivosPerda((prev) =>
        prev.map((p) =>
          p.id === editingMotivoPerda.id
            ? {
                ...p,
                nome: data.nome,
                status: data.status,
                updatedAt: new Date(),
              }
            : p
        )
      );
      toast.success("Motivo de perda atualizado com sucesso!");
    } else {
      // Create new motivoPerda
      const newMotivoPerda: MotivoPerda = {
        id: `${Date.now()}`,
        nome: data.nome,
        status: data.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMotivosPerda((prev) => [...prev, newMotivoPerda]);
      toast.success("Motivo de perda criado com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setMotivosPerda((prev) => prev.filter((motivoPerda) => motivoPerda.id !== id));
    toast.success("Motivo de perda excluído com sucesso!");
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
            onDelete={handleDelete}
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
    </div>
  );
}
