
import { useState, useEffect } from "react";
import { GrupoFavorecido } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import { GrupoFavorecidosForm } from "@/components/grupo-favorecidos/grupo-favorecidos-form";
import { GrupoFavorecidosTable } from "@/components/grupo-favorecidos/grupo-favorecidos-table";
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
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

export default function GrupoFavorecidosPage() {
  const [grupos, setGrupos] = useState<GrupoFavorecido[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoFavorecido | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);

  // Carregar grupos do Supabase
  useEffect(() => {
    const fetchGrupos = async () => {
      if (!currentCompany) return;
      
      const { data, error } = await supabase
        .from("grupo_favorecidos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("nome");

      if (error) {
        console.error("Erro ao carregar grupos:", error);
        toast.error("Erro ao carregar grupos de favorecidos");
        return;
      }

      if (data) {
        const gruposFormatados: GrupoFavorecido[] = data.map(grupo => ({
          id: grupo.id,
          nome: grupo.nome,
          status: grupo.status as "ativo" | "inativo",
          createdAt: new Date(grupo.created_at),
          updatedAt: new Date(grupo.updated_at)
        }));
        setGrupos(gruposFormatados);
      }
      setIsLoading(false);
    };

    fetchGrupos();
  }, [currentCompany]);

  const handleOpenDialog = (grupo?: GrupoFavorecido) => {
    setEditingGrupo(grupo);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingGrupo(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: { nome: string; status: "ativo" | "inativo" }) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    if (editingGrupo) {
      // Atualizar grupo existente
      const { error } = await supabase
        .from("grupo_favorecidos")
        .update({
          nome: data.nome,
          status: data.status,
        })
        .eq("id", editingGrupo.id)
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao atualizar grupo:", error);
        toast.error("Erro ao atualizar grupo de favorecidos");
        return;
      }

      setGrupos(prev =>
        prev.map(g =>
          g.id === editingGrupo.id
            ? {
                ...g,
                nome: data.nome,
                status: data.status,
                updatedAt: new Date(),
              }
            : g
        )
      );
      toast.success("Grupo de favorecidos atualizado com sucesso!");
    } else {
      // Criar novo grupo
      const { data: newGrupo, error } = await supabase
        .from("grupo_favorecidos")
        .insert([
          {
            empresa_id: currentCompany.id,
            nome: data.nome,
            status: data.status,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar grupo:", error);
        toast.error("Erro ao criar grupo de favorecidos");
        return;
      }

      if (newGrupo) {
        const grupoFormatado: GrupoFavorecido = {
          id: newGrupo.id,
          nome: newGrupo.nome,
          status: newGrupo.status as "ativo" | "inativo",
          createdAt: new Date(newGrupo.created_at),
          updatedAt: new Date(newGrupo.updated_at)
        };
        setGrupos(prev => [...prev, grupoFormatado]);
        toast.success("Grupo de favorecidos criado com sucesso!");
      }
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!currentCompany) return;

    const { error } = await supabase
      .from("grupo_favorecidos")
      .delete()
      .eq("id", id)
      .eq("empresa_id", currentCompany.id);

    if (error) {
      console.error("Erro ao excluir grupo:", error);
      toast.error("Erro ao excluir grupo de favorecidos");
      return;
    }

    setGrupos(prev => prev.filter(grupo => grupo.id !== id));
    toast.success("Grupo de favorecidos excluído com sucesso!");
  };

  // Filtrar grupos com base no termo de busca
  const filteredGrupos = grupos.filter((grupo) =>
    grupo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grupo de Favorecidos</h1>
        <Button onClick={() => handleOpenDialog()} variant="blue">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <GrupoFavorecidosTable
            grupos={filteredGrupos}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo
                ? "Editar Grupo de Favorecidos"
                : "Novo Grupo de Favorecidos"}
            </DialogTitle>
          </DialogHeader>
          <GrupoFavorecidosForm
            grupo={editingGrupo}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
