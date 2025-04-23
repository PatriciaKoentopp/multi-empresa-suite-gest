
import { useState, useMemo } from "react";
import { Favorecido, GrupoFavorecido, Profissao } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { FavorecidosTable } from "@/components/favorecidos/favorecidos-table";
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

export default function FavorecidosPage() {
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [grupos] = useState<GrupoFavorecido[]>([]);
  const [profissoes] = useState<Profissao[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFavorecido, setEditingFavorecido] = useState<Favorecido | undefined>(undefined);
  const [viewingFavorecido, setViewingFavorecido] = useState<Favorecido | undefined>(undefined);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [grupoFilter, setGrupoFilter] = useState<string>("todos");

  const handleOpenDialog = (favorecido?: Favorecido, isViewing = false) => {
    if (isViewing) {
      setViewingFavorecido(favorecido);
    } else {
      setEditingFavorecido(favorecido);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingFavorecido(undefined);
    setViewingFavorecido(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: Partial<Favorecido>) => {
    if (editingFavorecido) {
      // Atualizar favorecido existente
      setFavorecidos((prev) =>
        prev.map((f) =>
          f.id === editingFavorecido.id
            ? {
                ...f,
                ...data,
                updatedAt: new Date(),
              }
            : f
        )
      );
      toast.success("Favorecido atualizado com sucesso!");
    } else {
      // Criar novo favorecido
      const newFavorecido: Favorecido = {
        id: `${Date.now()}`, // Em uma aplicação real, isso seria gerado pelo backend
        ...data as Favorecido,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setFavorecidos((prev) => [...prev, newFavorecido]);
      toast.success("Favorecido criado com sucesso!");
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setFavorecidos((prev) => prev.filter((favorecido) => favorecido.id !== id));
    toast.success("Favorecido excluído com sucesso!");
  };

  // Aplicar filtros aos favorecidos
  const filteredFavorecidos = useMemo(() => {
    return favorecidos.filter((favorecido) => {
      // Filtro por nome ou documento
      const matchesSearch = 
        favorecido.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorecido.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (favorecido.nomeFantasia?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      // Filtro por tipo
      const matchesTipo = tipoFilter === "todos" || favorecido.tipo === tipoFilter;
      
      // Filtro por status
      const matchesStatus = statusFilter === "todos" || favorecido.status === statusFilter;
      
      // Filtro por grupo
      const matchesGrupo = grupoFilter === "todos" || favorecido.grupoId === grupoFilter;
      
      return matchesSearch && matchesTipo && matchesStatus && matchesGrupo;
    });
  }, [favorecidos, searchTerm, tipoFilter, statusFilter, grupoFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Favorecidos</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="blue"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Favorecido
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou documento..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Select
                value={tipoFilter}
                onValueChange={(value) => setTipoFilter(value)}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="cliente">Física</SelectItem>
                  <SelectItem value="fornecedor">Jurídica</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="publico">Órgão Público</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as "todos" | "ativo" | "inativo")}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo" className="text-blue-600">Ativo</SelectItem>
                  <SelectItem value="inativo" className="text-red-600">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={grupoFilter}
                onValueChange={(value) => setGrupoFilter(value)}
              >
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FavorecidosTable
            favorecidos={filteredFavorecidos}
            grupos={grupos}
            onView={(favorecido) => handleOpenDialog(favorecido, true)}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {viewingFavorecido
                ? "Visualizar Favorecido"
                : editingFavorecido
                ? "Editar Favorecido"
                : "Novo Favorecido"}
            </DialogTitle>
          </DialogHeader>
          <FavorecidosForm
            favorecido={viewingFavorecido || editingFavorecido}
            grupos={grupos}
            profissoes={profissoes}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            readOnly={!!viewingFavorecido}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
