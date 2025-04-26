import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ContaPagar } from "@/components/contas-a-pagar/contas-a-pagar-table";
import { MovimentacaoTable } from "@/components/movimentacao/movimentacao-table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMovimentacaoDados } from "@/hooks/useMovimentacaoDados";
import { formatDate } from "@/lib/utils";

export default function MovimentacaoPage() {
  const [movimentacoes, setMovimentacoes] = useState<ContaPagar[]>([]);
  const navigate = useNavigate();
  const { tiposTitulos } = useMovimentacaoDados();

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoTituloId, setTipoTituloId] = useState<string>("todos");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataPagInicio, setDataPagInicio] = useState<string>("");
  const [dataPagFim, setDataPagFim] = useState<string>("");

  // Estado para o modal de confirmação de exclusão
  const [movimentacaoParaExcluir, setMovimentacaoParaExcluir] = useState<string | null>(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  function formatInputDate(date: Date | undefined) {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  }

  // Adapta a função handleEdit para passar a movimentação completa
  const handleEdit = async (movimentacao: ContaPagar) => {
    try {
      // Buscar a movimentação completa no banco
      const { data: movimentacaoCompleta, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome)
        `)
        .eq('id', movimentacao.id)
        .single();
        
      if (error) throw error;
      
      if (movimentacaoCompleta) {
        // Importante: Não precisamos ajustar as datas aqui, pois vamos usar formatDate no componente
        navigate("/financeiro/incluir-movimentacao", {
          state: { movimentacao: movimentacaoCompleta }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar dados da movimentação"
      });
    }
  };

  // Modificar a função handleVisualizar para buscar os dados completos antes de navegar
  const handleVisualizar = async (movimentacao: ContaPagar) => {
    try {
      // Buscar a movimentação completa no banco, exatamente como em handleEdit
      const { data: movimentacaoCompleta, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome)
        `)
        .eq('id', movimentacao.id)
        .single();
        
      if (error) throw error;
      
      if (movimentacaoCompleta) {
        // Importante: Não precisamos ajustar as datas aqui, pois vamos usar formatDate no componente
        navigate("/financeiro/incluir-movimentacao", {
          state: { 
            movimentacao: movimentacaoCompleta,
            modoVisualizacao: true
          }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar dados da movimentação para visualização"
      });
    }
  };

  // Carregar dados do Supabase
  useEffect(() => {
    async function carregarMovimentacoes() {
      try {
        const { data: movimentacoesData, error } = await supabase
          .from('movimentacoes')
          .select(`
            *,
            favorecido:favorecidos(nome)
          `);

        if (error) throw error;

        if (movimentacoesData) {
          // Converter movimentações para o formato esperado
          const movimentacoesFormatadas: ContaPagar[] = movimentacoesData.map((mov: any) => ({
            id: mov.id,
            favorecido: mov.favorecido?.nome || 'Não informado',
            descricao: mov.descricao || '',
            dataVencimento: mov.primeiro_vencimento ? new Date(mov.primeiro_vencimento) : undefined,
            dataPagamento: undefined,
            status: 'em_aberto',
            valor: Number(mov.valor),
            numeroParcela: mov.numero_documento,
            tipo_operacao: mov.tipo_operacao,
            tipo_titulo_id: mov.tipo_titulo_id
          }));

          setMovimentacoes(movimentacoesFormatadas);
        }
      } catch (error: any) {
        console.error('Erro ao carregar movimentacoes:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: 'Erro ao carregar as movimentacoes'
        });
      }
    }

    carregarMovimentacoes();
  }, []);

  // Filtro com o novo campo de tipo de título
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter((movimentacao) => {
      const textoBusca = (movimentacao.favorecido + movimentacao.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const tipoTituloOk = tipoTituloId === "todos" || movimentacao.tipo_titulo_id === tipoTituloId;
      const vencimentoDentroRange =
        (!dataVencInicio || movimentacao.dataVencimento >= new Date(dataVencInicio)) &&
        (!dataVencFim || movimentacao.dataVencimento <= new Date(dataVencFim));
      const pagamentoDentroRange =
        (!dataPagInicio || (movimentacao.dataPagamento && movimentacao.dataPagamento >= new Date(dataPagInicio))) &&
        (!dataPagFim || (movimentacao.dataPagamento && movimentacao.dataPagamento <= new Date(dataPagFim)));

      return textoBusca && tipoTituloOk && vencimentoDentroRange && pagamentoDentroRange;
    });
  }, [movimentacoes, searchTerm, tipoTituloId, dataVencInicio, dataVencFim, dataPagInicio, dataPagFim]);

  // Prepara a exclusão abrindo o modal de confirmação
  const prepararExclusao = (id: string) => {
    setMovimentacaoParaExcluir(id);
    setConfirmarExclusaoAberto(true);
  };

  // Função para excluir uma movimentacao após confirmação
  const confirmarExclusao = async () => {
    if (!movimentacaoParaExcluir) return;
    
    try {
      setIsLoading(true);
      
      // Verificar se a movimentação já foi baixada antes de tentar excluir
      const { data: movimentacaoParcelas, error: parcelasError } = await supabase
        .from("movimentacoes_parcelas")
        .select("id, data_pagamento")
        .eq("movimentacao_id", movimentacaoParaExcluir);
      
      if (parcelasError) {
        throw parcelasError;
      }

      // Verificar se alguma parcela já foi paga
      const parcelasBaixadas = movimentacaoParcelas.some(parcela => parcela.data_pagamento !== null);
      
      if (parcelasBaixadas) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Esta movimentação não pode ser excluída pois já foi baixada."
        });
        return;
      }
      
      // Excluir as parcelas associadas à movimentação
      const { error: errorParcelas } = await supabase
        .from("movimentacoes_parcelas")
        .delete()
        .eq("movimentacao_id", movimentacaoParaExcluir);

      if (errorParcelas) {
        // Verifica se o erro é devido à movimentação já estar baixada
        if (errorParcelas.code === "23503" && errorParcelas.message.includes("fluxo_caixa")) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Esta movimentação não pode ser excluída pois já foi baixada."
          });
          return;
        }
        throw errorParcelas;
      }
      
      // Depois de excluir as parcelas, excluir a movimentação principal
      const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", movimentacaoParaExcluir);

      if (error) throw error;

      // Atualizar a lista local removendo o item excluído
      setMovimentacoes(prevMovimentacoes => prevMovimentacoes.filter(movimentacao => movimentacao.id !== movimentacaoParaExcluir));
      
      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao excluir movimentação:", error);
      // Verifica se o erro é devido à movimentação já estar baixada
      if (error.code === "23503" && error.message.includes("fluxo_caixa")) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Esta movimentação não pode ser excluída pois já foi baixada."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao excluir a movimentação"
        });
      }
    } finally {
      // Fechar o modal e limpar o estado
      setConfirmarExclusaoAberto(false);
      setMovimentacaoParaExcluir(null);
      setIsLoading(false);
    }
  };

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Movimentação</h1>
        <Button
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Movimentação
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="col-span-1 min-w-[180px]">
              <Select
                value={tipoTituloId}
                onValueChange={setTipoTituloId}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo de Título" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {tiposTitulos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div /> {/* Espaço para organizar em tela grande */}
          </div>

          {/* Linha única de filtros de datas, sempre abaixo da busca */}
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            {/* Vencimento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Venc. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataVencInicio}
                  max={dataVencFim || undefined}
                  onChange={e => setDataVencInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataVencFim}
                  min={dataVencInicio || undefined}
                  onChange={e => setDataVencFim(e.target.value)}
                />
              </div>
            </div>
            {/* Pagamento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Pagto. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataPagInicio}
                  max={dataPagFim || undefined}
                  onChange={e => setDataPagInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataPagFim}
                  min={dataPagInicio || undefined}
                  onChange={e => setDataPagFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Separador para dar respiro visual */}
          <div className="mb-4" />
          <div className="mt-6">
            <MovimentacaoTable
              movimentacoes={filteredMovimentacoes}
              onEdit={handleEdit}
              onDelete={prepararExclusao}
              onVisualizar={handleVisualizar}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={confirmarExclusaoAberto} onOpenChange={setConfirmarExclusaoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="px-6">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusao} 
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
