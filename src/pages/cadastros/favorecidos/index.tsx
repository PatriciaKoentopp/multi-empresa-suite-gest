import { useState, useEffect, useMemo } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { format } from "date-fns";

export default function FavorecidosPage() {
  const [favorecidos, setFavorecidos] = useState<Favorecido[]>([]);
  const [grupos, setGrupos] = useState<GrupoFavorecido[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFavorecido, setEditingFavorecido] = useState<Favorecido | undefined>(undefined);
  const [viewingFavorecido, setViewingFavorecido] = useState<Favorecido | undefined>(undefined);
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  
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
          .select("*")
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
            createdAt: new Date(profissao.created_at),
            updatedAt: new Date(profissao.updated_at)
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
          const favorecidosFormatados: Favorecido[] = data.map(favorecido => {
            // Criar data de aniversário sem timezone para manter o dia exato
            let dataAniversario: Date | undefined = undefined;
            if (favorecido.data_aniversario) {
              const dataParts = favorecido.data_aniversario.split('-');
              if (dataParts.length === 3) {
                const year = parseInt(dataParts[0], 10);
                const month = parseInt(dataParts[1], 10) - 1; // mês em JS é 0-indexed
                const day = parseInt(dataParts[2], 10);
                dataAniversario = new Date(Date.UTC(year, month, day, 12, 0, 0));
              }
            }
            
            return {
              id: favorecido.id,
              tipo: favorecido.tipo as "cliente" | "fornecedor" | "publico" | "funcionario",
              tipoDocumento: favorecido.tipo_documento as "cpf" | "cnpj",
              documento: favorecido.documento,
              grupoId: favorecido.grupo_id,
              profissaoId: favorecido.profissao_id,
              nome: favorecido.nome,
              nomeFantasia: favorecido.nome_fantasia,
              email: favorecido.email,
              telefone: favorecido.telefone,
              endereco: {
                cep: favorecido.cep || "",
                logradouro: favorecido.logradouro || "",
                numero: favorecido.numero || "",
                complemento: favorecido.complemento || "",
                bairro: favorecido.bairro || "",
                cidade: favorecido.cidade || "",
                estado: favorecido.estado || "",
                pais: favorecido.pais || "Brasil",
              },
              dataAniversario,
              status: favorecido.status as "ativo" | "inativo",
              createdAt: new Date(favorecido.created_at),
              updatedAt: new Date(favorecido.updated_at),
            };
          });
          setFavorecidos(favorecidosFormatados);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar favorecidos:", error);
        toast.error("Erro ao carregar favorecidos");
        setIsLoading(false);
      }
    };

    fetchFavorecidos();
  }, [currentCompany]);

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

  const handleSubmit = async (data: Partial<Favorecido>) => {
    if (!currentCompany) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    try {
      // Preparar a data de aniversário no formato YYYY-MM-DD para o Supabase
      let dataAniversarioFormatada = null;
      if (data.dataAniversario) {
        const year = data.dataAniversario.getFullYear();
        const month = String(data.dataAniversario.getMonth() + 1).padStart(2, '0');
        const day = String(data.dataAniversario.getDate()).padStart(2, '0');
        dataAniversarioFormatada = `${year}-${month}-${day}`;
      }

      // Preparar os dados para inserção/atualização no Supabase
      const favorecidoData = {
        empresa_id: currentCompany.id,
        tipo: data.tipo,
        tipo_documento: data.tipoDocumento,
        documento: data.documento,
        grupo_id: data.grupoId,
        profissao_id: data.profissaoId,
        nome: data.nome,
        nome_fantasia: data.nomeFantasia,
        email: data.email,
        telefone: data.telefone,
        cep: data.endereco?.cep,
        logradouro: data.endereco?.logradouro,
        numero: data.endereco?.numero,
        complemento: data.endereco?.complemento,
        bairro: data.endereco?.bairro,
        cidade: data.endereco?.cidade,
        estado: data.endereco?.estado,
        pais: data.endereco?.pais,
        data_aniversario: dataAniversarioFormatada,
        status: data.status,
      };

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

        setFavorecidos(prev =>
          prev.map(f =>
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
          const favorecidoFormatado: Favorecido = {
            id: novoFavorecido.id,
            tipo: novoFavorecido.tipo as "cliente" | "fornecedor" | "publico" | "funcionario",
            tipoDocumento: novoFavorecido.tipo_documento as "cpf" | "cnpj",
            documento: novoFavorecido.documento,
            grupoId: novoFavorecido.grupo_id,
            profissaoId: novoFavorecido.profissao_id,
            nome: novoFavorecido.nome,
            nomeFantasia: novoFavorecido.nome_fantasia,
            email: novoFavorecido.email,
            telefone: novoFavorecido.telefone,
            endereco: {
              cep: novoFavorecido.cep || "",
              logradouro: novoFavorecido.logradouro || "",
              numero: novoFavorecido.numero || "",
              complemento: novoFavorecido.complemento || "",
              bairro: novoFavorecido.bairro || "",
              cidade: novoFavorecido.cidade || "",
              estado: novoFavorecido.estado || "",
              pais: novoFavorecido.pais || "Brasil",
            },
            // Convertendo a string YYYY-MM-DD do banco para Date sem considerar timezone
            dataAniversario: novoFavorecido.data_aniversario ? new Date(novoFavorecido.data_aniversario) : undefined,
            status: novoFavorecido.status as "ativo" | "inativo",
            createdAt: new Date(novoFavorecido.created_at),
            updatedAt: new Date(novoFavorecido.updated_at),
          };
          setFavorecidos(prev => [...prev, favorecidoFormatado]);
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
            id: favorecido.id,
            tipo: favorecido.tipo as "cliente" | "fornecedor" | "publico" | "funcionario",
            tipoDocumento: favorecido.tipo_documento as "cpf" | "cnpj",
            documento: favorecido.documento,
            grupoId: favorecido.grupo_id,
            profissaoId: favorecido.profissao_id,
            nome: favorecido.nome,
            nomeFantasia: favorecido.nome_fantasia,
            email: favorecido.email,
            telefone: favorecido.telefone,
            endereco: {
              cep: favorecido.cep || "",
              logradouro: favorecido.logradouro || "",
              numero: favorecido.numero || "",
              complemento: favorecido.complemento || "",
              bairro: favorecido.bairro || "",
              cidade: favorecido.cidade || "",
              estado: favorecido.estado || "",
              pais: favorecido.pais || "Brasil",
            },
            dataAniversario: favorecido.data_aniversario ? new Date(favorecido.data_aniversario) : undefined,
            status: favorecido.status as "ativo" | "inativo",
            createdAt: new Date(favorecido.created_at),
            updatedAt: new Date(favorecido.updated_at),
          }));
          setFavorecidos(favorecidosFormatados);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar favorecidos:", error);
        toast.error("Erro ao carregar favorecidos");
        setIsLoading(false);
      }
    };

    fetchFavorecidos();
  }, [currentCompany]);

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
