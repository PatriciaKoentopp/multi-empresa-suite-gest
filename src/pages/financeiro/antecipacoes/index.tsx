import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AntecipacaoTable, Antecipacao } from "@/components/antecipacoes/antecipacao-table";
import { AntecipacaoModal } from "@/components/antecipacoes/antecipacao-modal";
import { VisualizarAntecipacaoModal } from "@/components/antecipacoes/visualizar-antecipacao-modal";
import { EditarAntecipacaoModal } from "@/components/antecipacoes/editar-antecipacao-modal";

export default function AntecipacoesPage() {
  const { currentCompany } = useCompany();
  const [antecipacoes, setAntecipacoes] = useState<Antecipacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisualizarModalOpen, setIsVisualizarModalOpen] = useState(false);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [antecipacaoSelecionada, setAntecipacaoSelecionada] = useState<Antecipacao | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "ativa" | "utilizada">("ativa");
  const [tipoFilter, setTipoFilter] = useState<"todas" | "receber" | "pagar">("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [isFiltroAvancadoOpen, setIsFiltroAvancadoOpen] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Estado para controlar o dialog de confirmação
  const [antecipacaoParaExcluir, setAntecipacaoParaExcluir] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarAntecipacoes();
    }
  }, [currentCompany]);

  // Função para atualizar o status de antecipações automaticamente
  async function atualizarStatusAntecipacoes() {
    try {
      if (!currentCompany?.id) return;

      console.log("Verificando antecipações para atualizar status...");

      // Buscar todas as antecipações para verificar status
      const { data: antecipacoesParaVerificar, error } = await supabase
        .from("antecipacoes")
        .select("id, valor_total, valor_utilizado, status")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        console.error("Erro ao buscar antecipações para atualizar:", error);
        return;
      }

      // Separar antecipações que precisam ser atualizadas para 'utilizada'
      const idsParaUtilizada = antecipacoesParaVerificar
        ?.filter(ant => {
          const valorDisponivel = Number(ant.valor_total) - Number(ant.valor_utilizado);
          return valorDisponivel <= 0 && ant.status === 'ativa';
        })
        .map(ant => ant.id) || [];

      // Separar antecipações que precisam ser atualizadas para 'ativa'
      const idsParaAtiva = antecipacoesParaVerificar
        ?.filter(ant => {
          const valorDisponivel = Number(ant.valor_total) - Number(ant.valor_utilizado);
          return valorDisponivel > 0 && ant.status === 'utilizada';
        })
        .map(ant => ant.id) || [];

      // Atualizar para 'utilizada'
      if (idsParaUtilizada.length > 0) {
        console.log(`Atualizando ${idsParaUtilizada.length} antecipações para status 'utilizada'`);

        const { error: updateUtilizadaError } = await supabase
          .from("antecipacoes")
          .update({ status: "utilizada" })
          .in("id", idsParaUtilizada);

        if (updateUtilizadaError) {
          console.error("Erro ao atualizar status para 'utilizada':", updateUtilizadaError);
        } else {
          console.log("Status das antecipações atualizado para 'utilizada' com sucesso");
        }
      }

      // Atualizar para 'ativa'
      if (idsParaAtiva.length > 0) {
        console.log(`Atualizando ${idsParaAtiva.length} antecipações para status 'ativa'`);

        const { error: updateAtivaError } = await supabase
          .from("antecipacoes")
          .update({ status: "ativa" })
          .in("id", idsParaAtiva);

        if (updateAtivaError) {
          console.error("Erro ao atualizar status para 'ativa':", updateAtivaError);
        } else {
          console.log("Status das antecipações atualizado para 'ativa' com sucesso");
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status das antecipações:", error);
    }
  }

  // Função para criar uma data a partir de uma string YYYY-MM-DD sem conversão de timezone
  function criarDataSemTimezone(dataStr?: string): Date | undefined {
    if (!dataStr) return undefined;
    
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  async function carregarAntecipacoes() {
    try {
      setIsLoading(true);
      
      if (!currentCompany?.id) {
        console.log("Empresa não selecionada");
        return;
      }

      console.log("Carregando antecipações para empresa:", currentCompany.id);

      // Primeiro, atualizar status das antecipações
      await atualizarStatusAntecipacoes();

      // Buscar antecipações
      const { data: antecipacoesData, error: antecipacoesError } = await supabase
        .from("antecipacoes")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .order("created_at", { ascending: false });

      if (antecipacoesError) {
        console.error("Erro ao carregar antecipações:", antecipacoesError);
        throw antecipacoesError;
      }

      console.log("Dados de antecipações carregados:", antecipacoesData);

      // Buscar favorecidos
      const favorecidosIds = antecipacoesData
        ?.filter(item => item.favorecido_id)
        .map(item => item.favorecido_id) || [];

      let favorecidosMap: Record<string, string> = {};
      
      if (favorecidosIds.length > 0) {
        const { data: favorecidosData, error: favorecidosError } = await supabase
          .from("favorecidos")
          .select("id, nome")
          .in("id", favorecidosIds);

        if (favorecidosError) {
          console.error("Erro ao carregar favorecidos:", favorecidosError);
        } else {
          favorecidosMap = Object.fromEntries(
            favorecidosData?.map(fav => [fav.id, fav.nome]) || []
          );
        }
      }

      // Buscar tipos de títulos
      const tiposTitulosIds = antecipacoesData
        ?.filter(item => item.tipo_titulo_id)
        .map(item => item.tipo_titulo_id) || [];

      let tiposTitulosMap: Record<string, string> = {};
      
      if (tiposTitulosIds.length > 0) {
        const { data: tiposTitulosData, error: tiposTitulosError } = await supabase
          .from("tipos_titulos")
          .select("id, nome")
          .in("id", tiposTitulosIds);

        if (tiposTitulosError) {
          console.error("Erro ao carregar tipos de títulos:", tiposTitulosError);
        } else {
          tiposTitulosMap = Object.fromEntries(
            tiposTitulosData?.map(tipo => [tipo.id, tipo.nome]) || []
          );
        }
      }

      // Buscar contas correntes
      const contasCorrentesIds = antecipacoesData
        ?.filter(item => item.conta_corrente_id)
        .map(item => item.conta_corrente_id) || [];

      let contasCorrentesMap: Record<string, string> = {};
      
      if (contasCorrentesIds.length > 0) {
        const { data: contasCorrentesData, error: contasCorrentesError } = await supabase
          .from("contas_correntes")
          .select("id, nome, banco")
          .in("id", contasCorrentesIds);

        if (contasCorrentesError) {
          console.error("Erro ao carregar contas correntes:", contasCorrentesError);
        } else {
          contasCorrentesMap = Object.fromEntries(
            contasCorrentesData?.map(conta => [conta.id, `${conta.nome} - ${conta.banco}`]) || []
          );
        }
      }

      // Buscar status de conciliação no fluxo de caixa
      const antecipacoesIds = antecipacoesData?.map(item => item.id) || [];
      let conciliacaoMap: Record<string, boolean> = {};

      if (antecipacoesIds.length > 0) {
        const { data: fluxoCaixaData, error: fluxoCaixaError } = await supabase
          .from("fluxo_caixa")
          .select("antecipacao_id, situacao")
          .in("antecipacao_id", antecipacoesIds);

        if (!fluxoCaixaError && fluxoCaixaData) {
          conciliacaoMap = Object.fromEntries(
            fluxoCaixaData.map(item => [item.antecipacao_id, item.situacao === 'conciliado'])
          );
        }
      }

      // Transformar dados para o formato esperado pela tabela
      const antecipacoesMapeadas: Antecipacao[] = (antecipacoesData || []).map(item => {
        const valorTotal = Number(item.valor_total);
        const valorUtilizado = Number(item.valor_utilizado);
        const valorDisponivel = valorTotal - valorUtilizado;
        
        // Usar o status atualizado do banco de dados após a verificação automática
        const status = item.status as "ativa" | "utilizada";

        return {
          id: item.id,
          favorecido: favorecidosMap[item.favorecido_id] || "N/A",
          tipoOperacao: item.tipo_operacao as "receber" | "pagar",
          dataAntecipacao: new Date(item.data_lancamento + 'T12:00:00'),
          valorTotal,
          valorUtilizado,
          valorDisponivel,
          descricao: item.descricao || "",
          status,
          numeroDocumento: item.numero_documento || "",
          conciliada: conciliacaoMap[item.id] || false
        };
      });

      console.log("Antecipações mapeadas:", antecipacoesMapeadas);
      setAntecipacoes(antecipacoesMapeadas);
    } catch (error) {
      console.error('Erro ao carregar antecipações:', error);
      toast.error('Erro ao carregar as antecipações');
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (antecipacao: Antecipacao) => {
    setAntecipacaoSelecionada(antecipacao);
    setIsEditarModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // Encontrar a antecipação para verificar as regras de exclusão
    const antecipacao = antecipacoes.find(a => a.id === id);
    
    if (!antecipacao) {
      toast.error("Antecipação não encontrada");
      return;
    }

    // Verificar se está conciliada
    if (antecipacao.conciliada) {
      toast.error("Não é possível excluir uma antecipação que está conciliada no fluxo de caixa");
      return;
    }

    // Verificar se tem valor utilizado
    if (antecipacao.valorUtilizado > 0) {
      toast.error("Não é possível excluir uma antecipação que possui valor utilizado");
      return;
    }

    // Se passou por todas as validações, pode prosseguir com a exclusão
    setAntecipacaoParaExcluir(id);
  };

  const confirmarExclusao = async () => {
    if (!antecipacaoParaExcluir) return;

    try {
      console.log("Iniciando exclusão da antecipação:", antecipacaoParaExcluir);

      // Primeiro, excluir do fluxo de caixa
      const { error: fluxoCaixaError } = await supabase
        .from("fluxo_caixa")
        .delete()
        .eq("antecipacao_id", antecipacaoParaExcluir);

      if (fluxoCaixaError) {
        console.error("Erro ao excluir do fluxo de caixa:", fluxoCaixaError);
        throw fluxoCaixaError;
      }

      console.log("Registro do fluxo de caixa excluído com sucesso");

      // Depois, excluir a antecipação
      const { error: antecipacaoError } = await supabase
        .from("antecipacoes")
        .delete()
        .eq("id", antecipacaoParaExcluir);

      if (antecipacaoError) {
        console.error("Erro ao excluir antecipação:", antecipacaoError);
        throw antecipacaoError;
      }

      console.log("Antecipação excluída com sucesso");

      // Atualizar a lista local
      setAntecipacoes(prev => prev.filter(a => a.id !== antecipacaoParaExcluir));
      toast.success("Antecipação excluída com sucesso");
      setAntecipacaoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir antecipação:', error);
      toast.error("Erro ao excluir antecipação");
      setAntecipacaoParaExcluir(null);
    }
  };

  const handleVisualizar = (antecipacao: Antecipacao) => {
    setAntecipacaoSelecionada(antecipacao);
    setIsVisualizarModalOpen(true);
  };

  const handleNovaAntecipacao = () => {
    setIsModalOpen(true);
  };

  const handleSalvarAntecipacao = () => {
    // Recarregar dados após salvar
    carregarAntecipacoes();
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setStatusFilter("ativa");
    setTipoFilter("todas");
    setDataInicio("");
    setDataFim("");
    setIsFiltroAvancadoOpen(false);
  };

  const filteredAntecipacoes = useMemo(() => {
    return antecipacoes.filter((antecipacao) => {
      const textoBusca = (antecipacao.favorecido + (antecipacao.descricao || ''))
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || antecipacao.status === statusFilter;
      const tipoOk = tipoFilter === "todas" || antecipacao.tipoOperacao === tipoFilter;
      
      // Aplicar filtros de data
      let dataDentroRange = true;
      if (dataInicio) {
        const dataInicioDate = criarDataSemTimezone(dataInicio)!;
        dataDentroRange = dataDentroRange && antecipacao.dataAntecipacao >= dataInicioDate;
      }
      
      if (dataFim) {
        const dataFimDate = criarDataSemTimezone(dataFim)!;
        dataDentroRange = dataDentroRange && antecipacao.dataAntecipacao <= dataFimDate;
      }

      return textoBusca && statusOk && tipoOk && dataDentroRange;
    });
  }, [antecipacoes, searchTerm, statusFilter, tipoFilter, dataInicio, dataFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando antecipações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={!!antecipacaoParaExcluir} onOpenChange={() => setAntecipacaoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta antecipação? Esta ação também removerá o registro do fluxo de caixa e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAntecipacaoParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Antecipações</h1>
        <Button
          variant="blue"
          onClick={handleNovaAntecipacao}
        >
          Nova Antecipação
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative col-span-1 min-w-[240px]">
                <button
                  type="button"
                  className="absolute left-3 top-3 z-10 p-0 m-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-500"
                  style={{ lineHeight: 0 }}
                  onClick={handleLupaClick}
                  tabIndex={-1}
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Input
                  ref={inputBuscaRef}
                  placeholder="Buscar favorecido ou descrição"
                  className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white min-w-[180px] w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      inputBuscaRef.current?.blur();
                    }
                  }}
                  autoComplete="off"
                />
              </div>
              
              <div className="min-w-[160px]">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="todas">Todos Status</SelectItem>
                    <SelectItem value="ativa" className="text-blue-600">Ativa</SelectItem>
                    <SelectItem value="utilizada" className="text-green-600">Utilizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[160px]">
                <Select
                  value={tipoFilter}
                  onValueChange={(v) => setTipoFilter(v as any)}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="todas">Todos Tipos</SelectItem>
                    <SelectItem value="receber">Recebimento</SelectItem>
                    <SelectItem value="pagar">Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10"
                  onClick={() => setIsFiltroAvancadoOpen(!isFiltroAvancadoOpen)}
                >
                  {isFiltroAvancadoOpen ? (
                    <>Ocultar filtros <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Busca avançada <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={limparFiltros}
                  className="text-gray-500 hover:text-gray-700 h-10 w-10"
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isFiltroAvancadoOpen && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-2">
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="text-sm font-medium mb-2 text-gray-700">Data da Antecipação</div>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataInicio}
                        max={dataFim || undefined}
                        onChange={e => setDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">Até</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataFim}
                        min={dataInicio || undefined}
                        onChange={e => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            <div className="mt-6">
              <AntecipacaoTable
                antecipacoes={filteredAntecipacoes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onVisualizar={handleVisualizar}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AntecipacaoModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSalvarAntecipacao}
      />

      <VisualizarAntecipacaoModal
        open={isVisualizarModalOpen}
        onClose={() => {
          setIsVisualizarModalOpen(false);
          setAntecipacaoSelecionada(null);
        }}
        antecipacao={antecipacaoSelecionada}
      />

      <EditarAntecipacaoModal
        open={isEditarModalOpen}
        onClose={() => {
          setIsEditarModalOpen(false);
          setAntecipacaoSelecionada(null);
        }}
        onSave={handleSalvarAntecipacao}
        antecipacao={antecipacaoSelecionada}
      />
    </div>
  );
}
