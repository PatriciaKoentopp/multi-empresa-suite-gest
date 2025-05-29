
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ContasAReceberTable, ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaixarContaReceberModal } from "@/components/contas-a-receber/BaixarContaReceberModal";
import { RenegociarParcelasModal } from "@/components/contas-a-receber/RenegociarParcelasModal";
import { VisualizarBaixaModal } from "@/components/contas-a-receber/VisualizarBaixaModal";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDate } from "@/lib/utils";

export default function ContasAReceberPage() {
  const { currentCompany } = useCompany();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "recebido" | "recebido_em_atraso" | "em_aberto">("em_aberto");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataRecInicio, setDataRecInicio] = useState<string>("");
  const [dataRecFim, setDataRecFim] = useState<string>("");
  const [isFiltroAvancadoOpen, setIsFiltroAvancadoOpen] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Modal Baixar
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaReceber | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);

  // Modal Renegociar
  const [contaParaRenegociar, setContaParaRenegociar] = useState<ContaReceber | null>(null);
  const [modalRenegociarAberto, setModalRenegociarAberto] = useState(false);

  // Estado para controlar o dialog de confirmação
  const [contaParaExcluir, setContaParaExcluir] = useState<string | null>(null);

  // Estado para o modal Visualizar Baixa
  const [contaParaVisualizarBaixa, setContaParaVisualizarBaixa] = useState<ContaReceber | null>(null);
  const [modalVisualizarBaixaAberto, setModalVisualizarBaixaAberto] = useState(false);
  const [contaCorrenteNome, setContaCorrenteNome] = useState<string>("");

  useEffect(() => {
    if (currentCompany?.id) {
      carregarContasReceber();
    }
  }, [currentCompany]);

  // Função para criar uma data a partir de uma string YYYY-MM-DD sem conversão de timezone
  function criarDataSemTimezone(dataStr?: string): Date | undefined {
    if (!dataStr) return undefined;
    
    // Separar a data em partes (formato esperado: YYYY-MM-DD)
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    
    // Criar um objeto Date com ano, mês e dia (sem hora para evitar problemas de timezone)
    return new Date(ano, mes - 1, dia);
  }

  async function carregarContasReceber() {
    try {
      setIsLoading(true);
      
      // Buscar somente movimentações parcelas (contas a receber) ordenadas por data de vencimento
      const { data: movimentacoesParcelas, error: errorMovimentacoes } = await supabase
        .from('movimentacoes_parcelas')
        .select(`
          id,
          numero,
          valor,
          data_vencimento,
          data_pagamento,
          multa,
          juros,
          desconto,
          movimentacao_id,
          conta_corrente_id,
          forma_pagamento,
          movimentacao:movimentacoes (
            id,
            descricao,
            tipo_operacao,
            numero_documento,
            favorecido:favorecidos (
              id,
              nome
            )
          )
        `)
        .eq('movimentacao.empresa_id', currentCompany.id)
        .eq('movimentacao.tipo_operacao', 'receber')
        .order('data_vencimento', { ascending: true });
      
      if (errorMovimentacoes) throw errorMovimentacoes;

      // Converter movimentações parcelas para ContaReceber
      const contasReceber: ContaReceber[] = (movimentacoesParcelas || [])
        .filter(parcela => parcela.movimentacao)
        .map(parcela => {
          // Criar objeto Date sem conversão de timezone
          const dataVencimento = criarDataSemTimezone(parcela.data_vencimento);
          const dataRecebimento = criarDataSemTimezone(parcela.data_pagamento);
          
          return {
            id: parcela.id,
            cliente: parcela.movimentacao.favorecido?.nome || 'Cliente não identificado',
            descricao: parcela.movimentacao.descricao || '',
            dataVencimento: dataVencimento!,
            dataRecebimento,
            status: determinarStatus(parcela.data_vencimento, parcela.data_pagamento),
            valor: Number(parcela.valor),
            numeroParcela: `${parcela.movimentacao.numero_documento || '-'}/${parcela.numero}`,
            origem: 'movimentacao',
            movimentacao_id: parcela.movimentacao_id,
            multa: parcela.multa,
            juros: parcela.juros,
            desconto: parcela.desconto,
            contaCorrenteId: parcela.conta_corrente_id,
            formaPagamento: parcela.forma_pagamento
          };
        });

      setContas(contasReceber);
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      toast.error('Erro ao carregar as contas a receber');
    } finally {
      setIsLoading(false);
    }
  }

  function determinarStatus(dataVencimento: string, dataPagamento?: string): ContaReceber['status'] {
    if (!dataPagamento) return "em_aberto";
    
    // Separar as datas em partes (formato esperado: YYYY-MM-DD)
    const [anoVenc, mesVenc, diaVenc] = dataVencimento.split('-').map(Number);
    const [anoPag, mesPag, diaPag] = dataPagamento.split('-').map(Number);
    
    // Criar objetos Date usando ano, mês, dia (sem preocupação com timezone)
    const vencimento = new Date(anoVenc, mesVenc - 1, diaVenc);
    const pagamento = new Date(anoPag, mesPag - 1, diaPag);
    
    return pagamento > vencimento ? "recebido_em_atraso" : "recebido";
  }

  const handleEdit = async (conta: ContaReceber) => {
    try {
      // Buscar a movimentação completa no banco, similar à página de contas a pagar
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome),
          parcelas:movimentacoes_parcelas(*)
        `)
        .eq('id', conta.movimentacao_id)
        .single();
        
      if (error) throw error;
      
      if (movimentacao) {
        // Formato correto das parcelas para edição
        if (movimentacao.parcelas && Array.isArray(movimentacao.parcelas)) {
          movimentacao.parcelas = movimentacao.parcelas.map(parcela => ({
            ...parcela,
            // Assegurando que temos as datas em formato Date para a edição
            data_vencimento: parcela.data_vencimento
          }));
        }
        
        // Navegar para a página de edição com os dados da movimentação
        navigate("/financeiro/incluir-movimentacao", {
          state: { movimentacao }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast.error("Erro ao buscar dados da movimentação");
    }
  };

  const handleBaixar = (conta: ContaReceber) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  const handleRenegociarParcela = (conta: ContaReceber) => {
    setContaParaRenegociar(conta);
    setModalRenegociarAberto(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 1. Primeiro, buscar a parcela que está sendo excluída para obter o movimentacao_id
      const { data: parcela, error: parcelaError } = await supabase
        .from('movimentacoes_parcelas')
        .select('movimentacao_id')
        .eq('id', id)
        .single();

      if (parcelaError) throw parcelaError;
      
      // 2. Verificar se existe alguma parcela recebida para esta movimentação
      const { data: parcelasRecebidas, error: parcelasError } = await supabase
        .from('movimentacoes_parcelas')
        .select('data_pagamento')
        .eq('movimentacao_id', parcela.movimentacao_id)
        .not('data_pagamento', 'is', null);

      if (parcelasError) throw parcelasError;

      if (parcelasRecebidas && parcelasRecebidas.length > 0) {
        toast.error("Não é possível excluir título que já possui parcelas recebidas.");
        return;
      }

      // Se não houver parcelas recebidas, permite a exclusão de todas as parcelas
      setContaParaExcluir(parcela.movimentacao_id);

    } catch (error) {
      console.error('Erro ao verificar parcelas:', error);
      toast.error("Erro ao verificar parcelas para exclusão");
    }
  };

  const confirmarExclusao = async () => {
    if (!contaParaExcluir) return;

    try {
      // Excluir todas as parcelas da movimentação
      const { error: errorParcelas } = await supabase
        .from('movimentacoes_parcelas')
        .delete()
        .eq('movimentacao_id', contaParaExcluir);
      
      if (errorParcelas) throw errorParcelas;

      // Excluir a movimentação
      const { error: errorMovimentacao } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('id', contaParaExcluir);

      if (errorMovimentacao) throw errorMovimentacao;

      setContas(prev => prev.filter(c => c.movimentacao_id !== contaParaExcluir));
      toast.success("Título excluído com sucesso");
      setContaParaExcluir(null);
      
    } catch (error) {
      console.error('Erro ao excluir título:', error);
      toast.error("Erro ao excluir título");
      setContaParaExcluir(null);
    }
  };

  const handleVisualizar = async (conta: ContaReceber) => {
    try {
      // Buscar a movimentação completa no banco
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome),
          parcelas:movimentacoes_parcelas(*)
        `)
        .eq('id', conta.movimentacao_id)
        .single();
        
      if (error) throw error;
      
      if (movimentacao) {
        // Formato correto das parcelas para visualização
        if (movimentacao.parcelas && Array.isArray(movimentacao.parcelas)) {
          movimentacao.parcelas = movimentacao.parcelas.map(parcela => ({
            ...parcela,
            // Assegurando que preservamos o formato original da data
            data_vencimento: parcela.data_vencimento
          }));
        }
        
        // Navegar para a página de inclusão com os dados da movimentação e o modo visualização
        navigate("/financeiro/incluir-movimentacao", {
          state: { 
            movimentacao,
            modoVisualizacao: true
          }
        });
      }
    } catch (error) {
      console.error("Erro ao buscar movimentação:", error);
      toast.error("Erro ao buscar dados da movimentação para visualização");
    }
  };

  function realizarBaixa({ dataRecebimento, contaCorrenteId, multa, juros, desconto, formaPagamento }: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    formaPagamento: string;
    multa: number;
    juros: number;
    desconto: number;
  }) {
    if (!contaParaBaixar) return;

    // Formatar data para YYYY-MM-DD (sem timezone)
    const dia = String(dataRecebimento.getDate()).padStart(2, '0');
    const mes = String(dataRecebimento.getMonth() + 1).padStart(2, '0');
    const ano = dataRecebimento.getFullYear();
    const dataFormated = `${ano}-${mes}-${dia}`;

    // Atualiza no banco
    supabase
      .from('movimentacoes_parcelas')
      .update({
        data_pagamento: dataFormated,
        multa,
        juros,
        desconto,
        conta_corrente_id: contaCorrenteId,
        forma_pagamento: formaPagamento
      })
      .eq('id', contaParaBaixar.id)
      .then(({ error }) => {
        if (error) {
          console.error('Erro ao baixar conta:', error);
          toast.error("Erro ao baixar conta");
          return;
        }

        // Atualiza estado local
        setContas(prev =>
          prev.map(conta =>
            conta.id === contaParaBaixar.id
              ? {
                  ...conta,
                  dataRecebimento,
                  status: determinarStatus(
                    `${conta.dataVencimento.getFullYear()}-${String(conta.dataVencimento.getMonth() + 1).padStart(2, '0')}-${String(conta.dataVencimento.getDate()).padStart(2, '0')}`,
                    dataFormated
                  ),
                  multa,
                  juros,
                  desconto,
                  contaCorrenteId,
                  formaPagamento
                }
              : conta
          )
        );
        
        toast.success("Recebimento registrado com sucesso!");
        setModalBaixarAberto(false);
      });
  }

  const handleDesfazerBaixa = async (conta: ContaReceber) => {
    try {
      if (!conta.movimentacao_id) {
        toast.error("Não foi possível identificar a movimentação");
        return;
      }

      // 1. Verificar se algum registro do fluxo de caixa está conciliado
      const { data: fluxoCaixaRegistros, error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .select('situacao')
        .eq('movimentacao_parcela_id', conta.id);

      if (fluxoError) {
        console.error('Erro ao verificar situação:', fluxoError);
        toast.error("Erro ao verificar situação do título");
        return;
      }

      // Verificar se há algum registro conciliado
      const temRegistroConciliado = fluxoCaixaRegistros?.some(registro => registro.situacao === 'conciliado');

      if (temRegistroConciliado) {
        toast.error("Não é possível desfazer a baixa de um título conciliado");
        return;
      }

      // 2. Buscar as antecipações utilizadas na nova tabela de relacionamento
      const { data: relacionamentos, error: relError } = await supabase
        .from("movimentacoes_parcelas_antecipacoes")
        .select("antecipacao_id, valor_utilizado")
        .eq("movimentacao_parcela_id", conta.id);

      if (relError) {
        console.error("Erro ao buscar relacionamentos de antecipação:", relError);
      }

      // 3. Reverter valores das antecipações utilizadas
      if (relacionamentos && relacionamentos.length > 0) {
        for (const rel of relacionamentos) {
          // Buscar valor atual utilizado da antecipação
          const { data: antecipacao, error: antError } = await supabase
            .from("antecipacoes")
            .select("valor_utilizado")
            .eq("id", rel.antecipacao_id)
            .single();

          if (!antError && antecipacao) {
            // Subtrair o valor que estava sendo utilizado
            const novoValorUtilizado = antecipacao.valor_utilizado - rel.valor_utilizado;
            
            const { error: updateAntError } = await supabase
              .from("antecipacoes")
              .update({ valor_utilizado: Math.max(0, novoValorUtilizado) })
              .eq("id", rel.antecipacao_id);

            if (updateAntError) {
              console.error("Erro ao reverter antecipação:", updateAntError);
            }
          }
        }

        // 4. Excluir os relacionamentos da nova tabela
        const { error: deleteRelError } = await supabase
          .from("movimentacoes_parcelas_antecipacoes")
          .delete()
          .eq("movimentacao_parcela_id", conta.id);

        if (deleteRelError) {
          console.error("Erro ao excluir relacionamentos:", deleteRelError);
        }
      }

      // 5. Limpar campos antigos de compatibilidade na parcela
      const { error: updateError } = await supabase
        .from('movimentacoes_parcelas')
        .update({
          data_pagamento: null,
          forma_pagamento: null,
          multa: null,
          juros: null,
          desconto: null,
          conta_corrente_id: null,
          antecipacao_id: null,
          valor_antecipacao_utilizado: null
        })
        .eq('id', conta.id);

      if (updateError) throw updateError;

      // 6. Excluir todos os registros do fluxo de caixa relacionados a esta parcela
      const { error: deleteError } = await supabase
        .from('fluxo_caixa')
        .delete()
        .eq('movimentacao_parcela_id', conta.id);

      if (deleteError) throw deleteError;

      // 7. Atualizar a lista local
      setContas(prev => prev.map(c => 
        c.id === conta.id
          ? { ...c, dataRecebimento: undefined, status: "em_aberto" as const, formaPagamento: null, multa: null, juros: null, desconto: null, contaCorrenteId: null }
          : c
      ));

      toast.success("Baixa desfeita com sucesso!");

    } catch (error) {
      console.error('Erro ao desfazer baixa:', error);
      toast.error("Erro ao desfazer baixa");
    }
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setStatusFilter("em_aberto");
    setDataVencInicio("");
    setDataVencFim("");
    setDataRecInicio("");
    setDataRecFim("");
    setIsFiltroAvancadoOpen(false);
  };

  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.cliente + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      
      // Aplicar filtros de data sem problemas de timezone
      let vencimentoDentroRange = true;
      if (dataVencInicio) {
        const dataInicio = criarDataSemTimezone(dataVencInicio)!;
        vencimentoDentroRange = vencimentoDentroRange && conta.dataVencimento >= dataInicio;
      }
      
      if (dataVencFim) {
        const dataFim = criarDataSemTimezone(dataVencFim)!;
        vencimentoDentroRange = vencimentoDentroRange && conta.dataVencimento <= dataFim;
      }
      
      let recebimentoDentroRange = true;
      if (dataRecInicio && conta.dataRecebimento) {
        const dataInicio = criarDataSemTimezone(dataRecInicio)!;
        recebimentoDentroRange = recebimentoDentroRange && conta.dataRecebimento >= dataInicio;
      }
      
      if (dataRecFim && conta.dataRecebimento) {
        const dataFim = criarDataSemTimezone(dataRecFim)!;
        recebimentoDentroRange = recebimentoDentroRange && conta.dataRecebimento <= dataFim;
      }
      
      // Se não há data de recebimento e temos filtros de recebimento, 
      // este item não deve aparecer nos resultados
      if ((dataRecInicio || dataRecFim) && !conta.dataRecebimento) {
        recebimentoDentroRange = false;
      }

      return textoBusca && statusOk && vencimentoDentroRange && recebimentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataRecInicio, dataRecFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  const handleVisualizarBaixa = async (conta: ContaReceber) => {
    try {
      setContaParaVisualizarBaixa(conta);
      
      // Buscar informações da conta corrente
      if (conta.contaCorrenteId) {
        const { data: contaCorrente, error } = await supabase
          .from('contas_correntes')
          .select('nome')
          .eq('id', conta.contaCorrenteId)
          .single();
        
        if (!error && contaCorrente) {
          setContaCorrenteNome(contaCorrente.nome);
        }
      } else {
        setContaCorrenteNome("");
      }
      
      setModalVisualizarBaixaAberto(true);
    } catch (error) {
      console.error("Erro ao buscar dados da conta corrente:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando contas a receber...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={!!contaParaExcluir} onOpenChange={() => setContaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este título? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContaParaExcluir(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <Button
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Conta a Receber
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
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
                  placeholder="Buscar cliente ou descrição"
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
              
              <div className="flex items-center gap-2">
                <div className="min-w-[180px]">
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
                      <SelectItem value="em_aberto" className="text-blue-600">Em Aberto</SelectItem>
                      <SelectItem value="recebido" className="text-green-600">Recebido</SelectItem>
                      <SelectItem value="recebido_em_atraso" className="text-red-600">Recebido em Atraso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="text-sm font-medium mb-2 text-gray-700">Data de Vencimento</div>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataVencInicio}
                        max={dataVencFim || undefined}
                        onChange={e => setDataVencInicio(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">Até</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataVencFim}
                        min={dataVencInicio || undefined}
                        onChange={e => setDataVencFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-3 bg-gray-50 shadow-sm">
                  <div className="text-sm font-medium mb-2 text-gray-700">Data de Recebimento</div>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataRecInicio}
                        max={dataRecFim || undefined}
                        onChange={e => setDataRecInicio(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">Até</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataRecFim}
                        min={dataRecInicio || undefined}
                        onChange={e => setDataRecFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            <div className="mt-6">
              <ContasAReceberTable
                contas={filteredContas}
                onEdit={handleEdit}
                onBaixar={handleBaixar}
                onDelete={handleDelete}
                onVisualizar={handleVisualizar}
                onDesfazerBaixa={handleDesfazerBaixa}
                onRenegociarParcela={handleRenegociarParcela}
                onVisualizarBaixa={handleVisualizarBaixa}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <BaixarContaReceberModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
      />
      
      <RenegociarParcelasModal
        parcela={contaParaRenegociar}
        open={modalRenegociarAberto}
        onClose={() => setModalRenegociarAberto(false)}
        onConfirmar={carregarContasReceber}
      />

      <VisualizarBaixaModal
        conta={contaParaVisualizarBaixa}
        open={modalVisualizarBaixaAberto}
        onClose={() => setModalVisualizarBaixaAberto(false)}
        contaCorrenteNome={contaCorrenteNome}
      />
    </div>
  );
}
