
import { useState, useEffect, useMemo } from "react";
import { Favorecido, GrupoFavorecido, Profissao } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter } from "lucide-react";
import { FavorecidosForm } from "@/components/favorecidos/favorecidos-form";
import { FavorecidosTable } from "@/components/favorecidos/favorecidos-table";
import { FavorecidosCountCard } from "@/components/favorecidos/favorecidos-count-card";
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
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { dateToISOString, parseDateString } from "@/lib/utils";

export default function FavorecidosPage() {
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [grupos, setGrupos] = useState<GrupoFavorecido[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFavorecido, setEditingFavorecido] = useState<Favorecido | undefined>(undefined);
  const [viewingFavorecido, setViewingFavorecido] = useState<Favorecido | undefined>(undefined);
  const { currentCompany } = useCompany();
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [grupoFilter, setGrupoFilter] = useState<string>("todos");

  // Carregar grupos do Supabase
  useEffect(() => {
    const fetchGrupos = async () => {
      if (!currentCompany) return;
      
      try {
        const { data, error } = await supabase
          .from("grupo_favorecidos")
          .select("id, nome, status, empresa_id, created_at, updated_at")
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
            empresa_id: grupo.empresa_id,
            created_at: grupo.created_at,
            updated_at: grupo.updated_at
          }));
          setGrupos(gruposFormatados);
        }
      } catch (error) {
        console.error("Erro ao carregar grupos:", error);
        toast.error("Erro ao carregar grupos de favorecidos");
      }
    };

    fetchGrupos();
  }, [currentCompany]);

  // Carregar profissões do Supabase
  useEffect(() => {
    const fetchProfissoes = async () => {
      if (!currentCompany) return;
      
      try {
        const { data, error } = await supabase
          .from("profissoes")
          .select("id, nome, status, empresa_id, created_at, updated_at")
          .eq("empresa_id", currentCompany.id)
          .order("nome");
  
        if (error) {
          console.error("Erro ao carregar profissões:", error);
          toast.error("Erro ao carregar profissões");
          return;
        }
  
        if (data) {
          const profissoesFormatadas: Profissao[] = data.map(profissao => ({
            id: profissao.id,
            nome: profissao.nome,
            status: profissao.status as "ativo" | "inativo",
            empresa_id: profissao.empresa_id,
            created_at: profissao.created_at,
            updated_at: profissao.updated_at
          }));
          setProfissoes(profissoesFormatadas);
        }
      } catch (error) {
        console.error("Erro ao carregar profissões:", error);
        toast.error("Erro ao carregar profissões");
      }
    };

    fetchProfissoes();
  }, [currentCompany]);

  // Carregar favorecidos do Supabase
  useEffect(() => {
    const fetchFavorecidos = async () => {
      if (!currentCompany) return;
      
      try {
        const { data, error } = await supabase
          .from("favorecidos")
          .select("*")
          .eq("empresa_id", currentCompany.id)
          .order("nome");
  
        if (error) {
          console.error("Erro ao carregar favorecidos:", error);
          toast.error("Erro ao carregar favorecidos");
          return;
        }
  
        if (data) {
          const favorecidosFormatados: Favorecido[] = data.map(favorecido => ({
            ...favorecido,
            tipo: favorecido.tipo as "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor",
            tipo_documento: favorecido.tipo_documento as "cpf" | "cnpj",
            status: favorecido.status as "ativo" | "inativo"
          }));
          setFavorecidos(favorecidosFormatados);
        }
      } catch (error) {
        console.error("Erro ao carregar favorecidos:", error);
        toast.error("Erro ao carregar favorecidos");
      }
    };

    fetchFavorecidos();
  }, [currentCompany]);

  const handleOpenDialog = (favorecido?: Favorecido, isViewing = false) => {
    if (!favorecido) {
      setEditingFavorecido(undefined);
      setViewingFavorecido(undefined);
      setIsDialogOpen(true);
      return;
    }

    if (isViewing) {
      setViewingFavorecido(favorecido);
      setEditingFavorecido(undefined);
    } else {
      setEditingFavorecido(favorecido);
      setViewingFavorecido(undefined);
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingFavorecido(undefined);
    setViewingFavorecido(undefined);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (data: Partial<Favorecido>) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      // Preparar os dados para inserção/atualização no Supabase
      const favorecidoData = {
        empresa_id: currentCompany.id,
        tipo: data.tipo,
        tipo_documento: data.tipo_documento,
        documento: data.documento,
        grupo_id: data.grupo_id === null ? null : data.grupo_id,
        profissao_id: data.profissao_id === null ? null : data.profissao_id,
        nome: data.nome,
        nome_fantasia: data.nome_fantasia,
        email: data.email,
        telefone: data.telefone,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        pais: data.pais,
        data_aniversario: data.data_aniversario,
        status: data.status,
      };

      console.log('Dados enviados para o Supabase:', favorecidoData);

      if (editingFavorecido) {
        // Atualizar favorecido existente
        const { error } = await supabase
          .from("favorecidos")
          .update(favorecidoData)
          .eq("id", editingFavorecido.id);

        if (error) {
          console.error("Erro ao atualizar favorecido:", error);
          toast.error("Erro ao atualizar favorecido");
          return;
        }

        // Atualizar o estado local
        setFavorecidos(prev => 
          prev.map(f => {
            if (f.id === editingFavorecido.id) {
              return {
                ...f,
                ...favorecidoData,
                updated_at: new Date().toISOString()
              };
            }
            return f;
          })
        );
        toast.success("Favorecido atualizado com sucesso!");
      } else {
        // Criar novo favorecido
        const { data: novoFavorecido, error } = await supabase
          .from("favorecidos")
          .insert(favorecidoData)
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar favorecido:", error);
          toast.error("Erro ao criar favorecido");
          return;
        }

        if (novoFavorecido) {
          const novoFavorecidoFormatado = {
            ...novoFavorecido,
            tipo: novoFavorecido.tipo as "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor",
            tipo_documento: novoFavorecido.tipo_documento as "cpf" | "cnpj",
            status: novoFavorecido.status as "ativo" | "inativo"
          };
          setFavorecidos(prev => [...prev, novoFavorecidoFormatado]);
          toast.success("Favorecido criado com sucesso!");
        }
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Erro na operação:", error);
      toast.error("Ocorreu um erro ao processar a solicitação");
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      const { error } = await supabase
        .from("favorecidos")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir favorecido:", error);
        toast.error("Erro ao excluir favorecido");
        return;
      }

      setFavorecidos(prev => prev.filter(f => f.id !== id));
      toast.success("Favorecido excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir favorecido:", error);
      toast.error("Ocorreu um erro ao excluir o favorecido");
    }
  };

  const filteredFavorecidos = useMemo(() => {
    return favorecidos.filter((favorecido) => {
      // Filtro por nome ou documento
      const matchesSearch = 
        favorecido.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorecido.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (favorecido.nome_fantasia?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
      // Filtro por tipo
      const matchesTipo = tipoFilter === "todos" || 
        (tipoFilter === "fisica" && (favorecido.tipo === "fisica" || favorecido.tipo === "cliente")) ||
        (tipoFilter === "juridica" && (favorecido.tipo === "juridica" || favorecido.tipo === "fornecedor")) ||
        favorecido.tipo === tipoFilter;
      
      // Filtro por status
      const matchesStatus = statusFilter === "todos" || favorecido.status === statusFilter;
      
      // Filtro por grupo
      const matchesGrupo = grupoFilter === "todos" || favorecido.grupo_id === grupoFilter;
      
      return matchesSearch && matchesTipo && matchesStatus && matchesGrupo;
    });
  }, [favorecidos, searchTerm, tipoFilter, statusFilter, grupoFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Favorecidos</h1>
        
        <div className="md:flex-1 max-w-xs">
          <FavorecidosCountCard count={filteredFavorecidos.length} total={favorecidos.length} />
        </div>
        
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
                  <SelectItem value="fisica">Física</SelectItem>
                  <SelectItem value="juridica">Jurídica</SelectItem>
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
