
import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/company-context";
import { useNavigate } from "react-router-dom";
import { Favorecido } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FavorecidosTable } from "@/components/favorecidos/favorecidos-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GrupoFavorecido } from "@/types";
import { Profissao } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavorecidosPage() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();

  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [grupos, setGrupos] = useState<GrupoFavorecido[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [favorecidoEditando, setFavorecidoEditando] = useState<Favorecido | null>(null);

  const carregarFavorecidos = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorecidos')
        .select(`
          *,
          grupo:grupo_favorecidos(nome),
          profissao:profissoes(nome)
        `)
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;

      const favorecidosFormatados = (data || []).map(favorecido => ({
        ...favorecido,
        created_at: favorecido.created_at,
        updated_at: favorecido.updated_at,
        data_aniversario: favorecido.data_aniversario ? new Date(favorecido.data_aniversario) : undefined,
      }));

      setFavorecidos(favorecidosFormatados);
    } catch (error) {
      console.error('Erro ao carregar favorecidos:', error);
      toast({
        title: "Erro ao carregar favorecidos",
        description: "Não foi possível carregar os favorecidos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarGrupos = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('grupo_favorecidos')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;
      setGrupos((data || []).map(item => ({
        ...item,
        status: item.status as "ativo" | "inativo",
        created_at: item.created_at,
        updated_at: item.updated_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast({
        title: "Erro ao carregar grupos",
        description: "Não foi possível carregar os grupos",
      });
    }
  };

  const carregarProfissoes = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('profissoes')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;
      setProfissoes((data || []).map(item => ({
        ...item,
        status: item.status as "ativo" | "inativo",
        created_at: item.created_at,
        updated_at: item.updated_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar profissões:', error);
      toast({
        title: "Erro ao carregar profissões",
        description: "Não foi possível carregar as profissões",
      });
    }
  };

  useEffect(() => {
    if (!currentCompany?.id) {
      navigate("/");
      return;
    }

    carregarFavorecidos();
    carregarGrupos();
    carregarProfissoes();
  }, [currentCompany?.id, navigate]);

  const handleEditarFavorecido = (favorecido: Favorecido) => {
    setFavorecidoEditando(favorecido);
    setModalAberto(true);
  };

  const handleVisualizarFavorecido = (favorecido: Favorecido) => {
    setFavorecidoEditando(favorecido);
    setModalAberto(true);
  };

  const handleExcluirFavorecido = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('favorecidos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorecidos(prev => prev.filter(f => f.id !== id));
      toast({ 
        title: "Favorecido excluído com sucesso!",
        description: "O favorecido foi removido com sucesso"
      });
    } catch (error) {
      console.error('Erro ao excluir favorecido:', error);
      toast({
        title: "Erro ao excluir favorecido",
        description: "Não foi possível excluir o favorecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Favorecido>) => {
    setIsLoading(true);
    try {
      if (favorecidoEditando) {
        const { error } = await supabase
          .from('favorecidos')
          .update({
            ...data,
            data_aniversario: data.data_aniversario instanceof Date 
              ? data.data_aniversario.toISOString().split('T')[0]
              : data.data_aniversario,
            updated_at: new Date().toISOString(),
          })
          .eq('id', favorecidoEditando.id);

        if (error) throw error;

        setFavorecidos(prev => 
          prev.map(f => f.id === favorecidoEditando.id ? {
            ...f,
            ...data,
            created_at: f.created_at,
            updated_at: new Date().toISOString(),
          } : f)
        );

        toast({ 
          title: "Favorecido atualizado com sucesso!",
          description: "Os dados foram salvos com sucesso"
        });
      } else {
        const favorecidoData = {
          ...data,
          data_aniversario: data.data_aniversario instanceof Date 
            ? data.data_aniversario.toISOString().split('T')[0]
            : data.data_aniversario,
          empresa_id: currentCompany?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: novoFavorecido, error } = await supabase
          .from('favorecidos')
          .insert(favorecidoData)
          .select()
          .single();

        if (error) throw error;

        setFavorecidos(prev => [...prev, {
          ...novoFavorecido,
          created_at: novoFavorecido.created_at,
          updated_at: novoFavorecido.updated_at,
          data_aniversario: novoFavorecido.data_aniversario ? new Date(novoFavorecido.data_aniversario) : undefined,
        }]);

        toast({ 
          title: "Favorecido criado com sucesso!",
          description: "O novo favorecido foi adicionado"
        });
      }

      setModalAberto(false);
      setFavorecidoEditando(null);
    } catch (error) {
      console.error('Erro ao salvar favorecido:', error);
      toast({
        title: "Erro ao salvar favorecido",
        description: "Não foi possível salvar o favorecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="border-b">
        <div className="flex h-full max-w-screen-xl items-center justify-between py-2 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Favorecidos</h1>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="blue">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Favorecido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>{favorecidoEditando ? "Editar Favorecido" : "Novo Favorecido"}</DialogTitle>
                  <DialogDescription>
                    {favorecidoEditando ? "Edite os dados do favorecido." : "Adicione um novo favorecido."}
                  </DialogDescription>
                </DialogHeader>
                <FavorecidosForm
                  favorecido={favorecidoEditando}
                  grupos={grupos}
                  profissoes={profissoes}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setModalAberto(false);
                    setFavorecidoEditando(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-12 w-[80%]" />
            <Skeleton className="h-12 w-[50%]" />
            <Skeleton className="h-[300px]" />
          </div>
        ) : (
          <FavorecidosTable
            favorecidos={favorecidos}
            onEditar={handleEditarFavorecido}
            onVisualizar={handleVisualizarFavorecido}
            onExcluir={handleExcluirFavorecido}
          />
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{favorecidoEditando ? "Visualizar Favorecido" : "Novo Favorecido"}</DialogTitle>
            <DialogDescription>
              {favorecidoEditando ? "Visualize os dados do favorecido." : "Adicione um novo favorecido."}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-12 w-[80%]" />
              <Skeleton className="h-12 w-[50%]" />
              <Skeleton className="h-[300px]" />
            </div>
          ) : (
            <FavorecidosForm
              favorecido={favorecidoEditando}
              grupos={grupos}
              profissoes={profissoes}
              onSubmit={handleSubmit}
              onCancel={() => {
                setModalAberto(false);
                setFavorecidoEditando(null);
              }}
              readOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
