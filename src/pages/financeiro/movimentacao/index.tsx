import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
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
import { DateInput } from "@/components/movimentacao/DateInput";

export default function MovimentacaoPage() {
  const [movimentacoes, setMovimentacoes] = useState<ContaPagar[]>([]);
  const navigate = useNavigate();
  const { tiposTitulos } = useMovimentacaoDados();

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoTituloId, setTipoTituloId] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<"mes_atual" | "mes_anterior" | "personalizado">("mes_atual");
  const [dataInicial, setDataInicial] = useState<Date | undefined>();
  const [dataFinal, setDataFinal] = useState<Date | undefined>();
  
  // Estado para o modal de confirmação de exclusão
  const [movimentacaoParaExcluir, setMovimentacaoParaExcluir] = useState<string | null>(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Definir datas iniciais conforme o período selecionado
  useEffect(() => {
    const hoje = new Date();
    if (periodo === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicial(inicio);
      setDataFinal(fim);
    } else if (periodo === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicial(inicio);
      setDataFinal(fim);
    } else if (periodo === "personalizado") {
      // Mantém as datas atuais quando for personalizado
    }
  }, [periodo]);

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
        navigate("/financeiro/incluir-movimentacao", {
          state: { movimentacao: movimentacaoCompleta }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast.error("Erro ao buscar dados da movimentação");
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
        navigate("/financeiro/incluir-movimentacao", {
          state: { 
            movimentacao: movimentacaoCompleta,
            modoVisualizacao: true
          }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast.error("Erro ao buscar dados da movimentação para visualização");
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
            movimentacao_id: mov.id,
            favorecido: mov.favorecido?.nome || 'Não informado',
            descricao: mov.descricao || '',
            dataVencimento: mov.primeiro_vencimento || undefined,
            dataPagamento: mov.data_lancamento || undefined,
            status: 'em_aberto',
            valor: Number(mov.valor),
            numeroParcela: mov.numero_documento,
            tipo_operacao: mov.tipo_operacao,
            mes_referencia: mov.mes_referencia,
            documento_pdf: mov.documento_pdf,
            tipo_titulo_id_interno: mov.tipo_titulo_id
          }));

          setMovimentacoes(movimentacoesFormatadas);
        }
      } catch (error: any) {
        console.error('Erro ao carregar movimentacoes:', error);
        toast.error('Erro ao carregar as movimentacoes');
      }
    }

    carregarMovimentacoes();
  }, []);

  // Limpar todos os filtros
  const limparFiltros = () => {
    setSearchTerm("");
    setTipoTituloId("todos");
    setPeriodo("mes_atual");
    
    // Resetar para o mês atual
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicial(inicio);
    setDataFinal(fim);
  };

  // Filtro com o novo campo de tipo de título e filtro de datas
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter((movimentacao) => {
      const textoBusca = (movimentacao.favorecido + " " + (movimentacao.descricao || "") + " " + ((movimentacao as any).mes_referencia || ""))
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const tipoTituloOk = tipoTituloId === "todos" || (movimentacao as any).tipo_titulo_id_interno === tipoTituloId;
      
      // Aplicar filtro de data de lançamento
      let dataLancamentoOk = true;
      if (dataInicial && movimentacao.dataPagamento) {
        // Comparar apenas as datas, ignorando as horas
        const dataInicioComparacao = new Date(dataInicial);
        dataInicioComparacao.setHours(0, 0, 0, 0);
        const dataMovComparacao = new Date(movimentacao.dataPagamento);
        dataMovComparacao.setHours(0, 0, 0, 0);
        dataLancamentoOk = dataLancamentoOk && dataMovComparacao >= dataInicioComparacao;
      }
      
      if (dataFinal && movimentacao.dataPagamento) {
        // Comparar apenas as datas, ignorando as horas
        const dataFimComparacao = new Date(dataFinal);
        dataFimComparacao.setHours(23, 59, 59, 999); // Fim do dia
        const dataMovComparacao = new Date(movimentacao.dataPagamento);
        dataMovComparacao.setHours(0, 0, 0, 0);
        dataLancamentoOk = dataLancamentoOk && dataMovComparacao <= dataFimComparacao;
      }

      return textoBusca && tipoTituloOk && dataLancamentoOk;
    });
  }, [movimentacoes, searchTerm, tipoTituloId, dataInicial, dataFinal]);

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
      
      // Buscar o tipo de operação da movimentação
      const { data: movimentacao, error: movError } = await supabase
        .from("movimentacoes")
        .select("tipo_operacao")
        .eq("id", movimentacaoParaExcluir)
        .single();
      
      if (movError) throw movError;
      
      // Verificar se pode excluir baseado no tipo de operação
      if (movimentacao.tipo_operacao === "transferencia") {
        // Para transferências, verificar se os lançamentos no fluxo de caixa estão conciliados
        const { data: fluxoCaixaLancamentos, error: fluxoError } = await supabase
          .from("fluxo_caixa")
          .select("id, situacao")
          .eq("movimentacao_id", movimentacaoParaExcluir);
        
        if (fluxoError) throw fluxoError;
        
        // Verificar se algum lançamento está conciliado
        const temLancamentoConciliado = fluxoCaixaLancamentos.some(
          lancamento => lancamento.situacao !== "nao_conciliado"
        );
        
        if (temLancamentoConciliado) {
          toast.error("Esta transferência não pode ser excluída pois já foi conciliada.");
          return;
        }
        
        // Excluir os lançamentos do fluxo de caixa
        const { error: errorFluxo } = await supabase
          .from("fluxo_caixa")
          .delete()
          .eq("movimentacao_id", movimentacaoParaExcluir);

        if (errorFluxo) throw errorFluxo;
      } else {
        // Para outras operações, verificar se alguma parcela já foi paga
        const { data: movimentacaoParcelas, error: parcelasError } = await supabase
          .from("movimentacoes_parcelas")
          .select("id, data_pagamento")
          .eq("movimentacao_id", movimentacaoParaExcluir);
        
        if (parcelasError) throw parcelasError;

        const parcelasBaixadas = movimentacaoParcelas.some(parcela => parcela.data_pagamento !== null);
        
        if (parcelasBaixadas) {
          toast.error("Esta movimentação não pode ser excluída pois já foi baixada.");
          return;
        }
        
        // Excluir as parcelas associadas à movimentação
        const { error: errorParcelas } = await supabase
          .from("movimentacoes_parcelas")
          .delete()
          .eq("movimentacao_id", movimentacaoParaExcluir);

        if (errorParcelas) {
          if (errorParcelas.code === "23503" && errorParcelas.message.includes("fluxo_caixa")) {
            toast.error("Esta movimentação não pode ser excluída pois já foi baixada.");
            return;
          }
          throw errorParcelas;
        }
      }
      
      // Depois de excluir as parcelas ou fluxo de caixa, excluir a movimentação principal
      const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", movimentacaoParaExcluir);

      if (error) throw error;

      // Atualizar a lista local removendo o item excluído
      setMovimentacoes(prevMovimentacoes => prevMovimentacoes.filter(movimentacao => movimentacao.id !== movimentacaoParaExcluir));
      
      toast.success("Movimentação excluída com sucesso!");
    } catch (error: any) {
      console.error("Erro ao excluir movimentação:", error);
      if (error.code === "23503" && error.message.includes("fluxo_caixa")) {
        toast.error("Esta movimentação não pode ser excluída pois já foi baixada.");
      } else {
        toast.error("Erro ao excluir a movimentação");
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
          <div className="space-y-4">
            {/* Primeira linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end">
              {/* Busca por texto */}
              <div className="md:col-span-3 relative">
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
                  placeholder="Buscar favorecido, descrição ou referência"
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
              
              {/* Filtro por tipo de título */}
              <div className="md:col-span-2">
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

              {/* Seletor de período */}
              <div className="md:col-span-2">
                <Select 
                  value={periodo} 
                  onValueChange={(value) => setPeriodo(value as "mes_atual" | "mes_anterior" | "personalizado")}
                >
                  <SelectTrigger className="w-full bg-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecionar Período" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border">
                    <SelectItem value="mes_atual">Mês Atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                    <SelectItem value="personalizado">Selecionar Período</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão para limpar filtros */}
              <div className="md:col-span-1 flex justify-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={limparFiltros}
                  className="text-gray-500 hover:text-gray-700"
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Segunda linha com filtros de data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Inicial */}
              <div>
                <DateInput 
                  label="Data Inicial"
                  value={dataInicial}
                  onChange={setDataInicial}
                  disabled={periodo !== "personalizado"}
                />
              </div>
              
              {/* Data Final */}
              <div>
                <DateInput 
                  label="Data Final"
                  value={dataFinal}
                  onChange={setDataFinal}
                  disabled={periodo !== "personalizado"}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <MovimentacaoTable
                movimentacoes={filteredMovimentacoes}
                onEdit={handleEdit}
                onDelete={prepararExclusao}
                onVisualizar={handleVisualizar}
              />
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
