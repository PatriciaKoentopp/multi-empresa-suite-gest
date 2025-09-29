
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ContasAPagarTable, ContaPagar } from "@/components/contas-a-pagar/contas-a-pagar-table";
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
import { BaixarContaPagarModal } from "@/components/contas-a-pagar/BaixarContaPagarModal";
import { RenegociarParcelasModal } from "@/components/contas-a-pagar/RenegociarParcelasModal";
import { VisualizarBaixaModal } from "@/components/contas-a-pagar/VisualizarBaixaModal";
import { supabase } from "@/integrations/supabase/client";
import { Movimentacao, MovimentacaoParcela } from "@/types/movimentacoes";
import { useCompany } from "@/contexts/company-context";
import { formatDate } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContaCorrente } from "@/types/conta-corrente";
import { AntecipacaoSelecionada } from "@/types/financeiro";
import { useExcelContasPagar } from "@/hooks/useExcelContasPagar";

export default function ContasAPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filtros com valor padrão definido para "em_aberto"
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "pago" | "pago_em_atraso" | "em_aberto">("em_aberto");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataPagInicio, setDataPagInicio] = useState<string>("");
  const [dataPagFim, setDataPagFim] = useState<string>("");
  const [isFiltroAvancadoOpen, setIsFiltroAvancadoOpen] = useState(false);

  const [contaParaExcluir, setContaParaExcluir] = useState<string | null>(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const [contaParaBaixar, setContaParaBaixar] = useState<ContaPagar | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);
  
  const [contaParaRenegociar, setContaParaRenegociar] = useState<ContaPagar | null>(null);
  const [modalRenegociarAberto, setModalRenegociarAberto] = useState(false);

  // Novo estado para o modal de visualizar baixa
  const [contaParaVisualizarBaixa, setContaParaVisualizarBaixa] = useState<ContaPagar | null>(null);
  const [modalVisualizarBaixaAberto, setModalVisualizarBaixaAberto] = useState(false);
  const [contasCorrente, setContasCorrente] = useState<ContaCorrente[]>([]);
  const [contaCorrenteNome, setContaCorrenteNome] = useState<string>("");

  const { currentCompany } = useCompany();
  const { exportToExcel, isGenerating } = useExcelContasPagar();

  // Buscar contas correntes
  useEffect(() => {
    if (currentCompany) {
      const fetchContasCorrentes = async () => {
        const { data, error } = await supabase
          .from('contas_correntes')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativo');

        if (error) {
          console.error('Erro ao buscar contas correntes:', error);
          return;
        }

        // Mapear para o tipo ContaCorrente
        const contasCorrentesFormatadas: ContaCorrente[] = (data || []).map(conta => ({
          id: conta.id,
          nome: conta.nome,
          banco: conta.banco,
          agencia: conta.agencia,
          numero: conta.numero,
          contaContabilId: conta.conta_contabil_id,
          status: conta.status as "ativo" | "inativo",
          createdAt: new Date(conta.created_at),
          updatedAt: new Date(conta.updated_at),
          data: conta.data ? new Date(conta.data) : undefined,
          saldoInicial: conta.saldo_inicial,
          considerar_saldo: conta.considerar_saldo
        }));

        setContasCorrente(contasCorrentesFormatadas);
      };

      fetchContasCorrentes();
    }
  }, [currentCompany]);

  const handleBaixar = (conta: ContaPagar) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  const handleVisualizarBaixa = (conta: ContaPagar) => {
    setContaParaVisualizarBaixa(conta);
    
    // Se temos contaCorrenteId, buscar o nome da conta
    if (conta.contaCorrenteId) {
      const contaCorrenteSelecionada = contasCorrente.find(c => c.id === conta.contaCorrenteId);
      setContaCorrenteNome(contaCorrenteSelecionada ? 
        `${contaCorrenteSelecionada.nome} - ${contaCorrenteSelecionada.banco} - ${contaCorrenteSelecionada.agencia}/${contaCorrenteSelecionada.numero}` : 
        "");
    } else {
      setContaCorrenteNome("");
    }
    
    setModalVisualizarBaixaAberto(true);
  };

  function realizarBaixa({ dataPagamento, contaCorrenteId, multa, juros, desconto, formaPagamento, antecipacoesSelecionadas }: {
    dataPagamento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
    formaPagamento: string;
    antecipacoesSelecionadas?: AntecipacaoSelecionada[];
  }) {
    if (!contaParaBaixar || !currentCompany) return;

    const atualizarMovimentacao = async () => {
      try {
        // Formatar data para YYYY-MM-DD (sem timezone)
        const dia = String(dataPagamento.getDate()).padStart(2, '0');
        const mes = String(dataPagamento.getMonth() + 1).padStart(2, '0');
        const ano = dataPagamento.getFullYear();
        const dataFormated = `${ano}-${mes}-${dia}`;

        // Atualiza a parcela com os dados do pagamento
        const { error: errorParcela } = await supabase
          .from('movimentacoes_parcelas')
          .update({
            data_pagamento: dataFormated,
            multa,
            juros,
            desconto,
            conta_corrente_id: contaCorrenteId || null,
            forma_pagamento: formaPagamento
          })
          .eq('id', contaParaBaixar.id);

        if (errorParcela) throw errorParcela;

        // Se utilizar antecipações, processar cada uma
        if (antecipacoesSelecionadas && antecipacoesSelecionadas.length > 0) {
          for (const antecipacao of antecipacoesSelecionadas) {
            if (antecipacao.valor > 0) {
              // Atualizar o valor utilizado da antecipação
              const { data: antecipacaoAtual, error: antecipacaoError } = await supabase
                .from('antecipacoes')
                .select('valor_utilizado')
                .eq('id', antecipacao.id)
                .single();

              if (antecipacaoError) throw antecipacaoError;

              const novoValorUtilizado = Number(antecipacaoAtual.valor_utilizado) + antecipacao.valor;

              const { error: updateAntecipacaoError } = await supabase
                .from('antecipacoes')
                .update({ valor_utilizado: novoValorUtilizado })
                .eq('id', antecipacao.id);

              if (updateAntecipacaoError) throw updateAntecipacaoError;

              // Criar registro na tabela de relacionamento
              const { error: relacionamentoError } = await supabase
                .from('movimentacoes_parcelas_antecipacoes')
                .insert({
                  movimentacao_parcela_id: contaParaBaixar.id,
                  antecipacao_id: antecipacao.id,
                  valor_utilizado: antecipacao.valor
                });

              if (relacionamentoError) throw relacionamentoError;

              // Criar entrada no fluxo de caixa para a antecipação
              const { error: fluxoAntecipacaoError } = await supabase
                .from('fluxo_caixa')
                .insert({
                  empresa_id: currentCompany.id,
                  data_movimentacao: dataFormated,
                  valor: -antecipacao.valor,
                  origem: 'antecipacao',
                  tipo_operacao: 'pagar',
                  movimentacao_parcela_id: contaParaBaixar.id,
                  antecipacao_id: antecipacao.id,
                  situacao: 'nao_conciliado',
                  descricao: `Antecipação utilizada: ${contaParaBaixar.descricao}`,
                  saldo: 0
                });

              if (fluxoAntecipacaoError) throw fluxoAntecipacaoError;
            }
          }
        }

        // Recarregar as contas após a baixa
        await carregarContasAPagar();

        toast({
          title: "Sucesso",
          description: "Título baixado com sucesso!"
        });

        // Fecha o modal
        setModalBaixarAberto(false);
        setContaParaBaixar(null);

      } catch (error) {
        console.error("Erro ao baixar título:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao baixar o título"
        });
      }
    };

    atualizarMovimentacao();
  }

  const handleRenegociar = (conta: ContaPagar) => {
    setContaParaRenegociar(conta);
    setModalRenegociarAberto(true);
  };

  const realizarRenegociacao = async (id: string, dataVencimento: string, valor: number) => {
    if (!currentCompany) return;

    try {
      // Atualiza a parcela com os novos dados
      const { error } = await supabase
        .from('movimentacoes_parcelas')
        .update({
          data_vencimento: dataVencimento,
          valor: valor
        })
        .eq('id', id);

      if (error) throw error;

      // Recarregar as contas após a renegociação
      await carregarContasAPagar();

      toast({
        title: "Sucesso",
        description: "Parcela renegociada com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao renegociar parcela:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao renegociar a parcela"
      });
      throw error;
    }
  };

  const prepararExclusao = (id: string) => {
    setContaParaExcluir(id);
    setConfirmarExclusaoAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!contaParaExcluir) return;
    
    try {
      // Primeiro, excluir as parcelas associadas à movimentação
      const { error: errorParcelas } = await supabase
        .from("movimentacoes_parcelas")
        .delete()
        .eq("movimentacao_id", contaParaExcluir);

      if (errorParcelas) throw errorParcelas;
      
      // Depois de excluir as parcelas, excluir a movimentação principal
      const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", contaParaExcluir);

      if (error) throw error;

      // Recarregar as contas após a exclusão
      await carregarContasAPagar();
      
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir a conta"
      });
    } finally {
      // Fechar o modal e limpar o estado
      setConfirmarExclusaoAberto(false);
      setContaParaExcluir(null);
    }
  };

  const handleEdit = async (conta: ContaPagar) => {
    try {
      // Buscar a movimentação completa no banco
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome)
        `)
        .eq('id', conta.movimentacao_id)
        .single();
        
      if (error) throw error;
      
      if (movimentacao) {
        // Navega para a página de edição com os dados da movimentação
        navigate("/financeiro/incluir-movimentacao", {
          state: { movimentacao }
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

  const handleVisualizar = async (conta: ContaPagar) => {
    try {
      // Buscar a movimentação completa no banco, exatamente como em handleEdit
      const { data: movimentacao, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(id, nome)
        `)
        .eq('id', conta.movimentacao_id)
        .single();
        
      if (error) throw error;
      
      if (movimentacao) {
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao buscar dados da movimentação para visualização"
      });
    }
  };

  const handleDesfazerBaixa = async (conta: ContaPagar) => {
    try {
      if (!conta.movimentacao_id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível identificar a movimentação"
        });
        return;
      }

      // 1. Verificar se algum registro do fluxo de caixa está conciliado
      const { data: fluxoCaixaRegistros, error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .select('situacao')
        .eq('movimentacao_parcela_id', conta.id);

      if (fluxoError) {
        console.error('Erro ao verificar situação:', fluxoError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao verificar situação do título"
        });
        return;
      }

      // Verificar se há algum registro conciliado
      const temRegistroConciliado = fluxoCaixaRegistros?.some(registro => registro.situacao === 'conciliado');

      if (temRegistroConciliado) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não é possível desfazer a baixa de um título conciliado"
        });
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

      // 5. Limpar campos de pagamento na parcela
      const { error: updateError } = await supabase
        .from('movimentacoes_parcelas')
        .update({
          data_pagamento: null,
          forma_pagamento: null,
          multa: null,
          juros: null,
          desconto: null,
          conta_corrente_id: null
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
          ? { ...c, dataPagamento: undefined, status: "em_aberto" as const, formaPagamento: null, multa: null, juros: null, desconto: null, contaCorrenteId: null }
          : c
      ));

      toast({
        title: "Sucesso",
        description: "Baixa desfeita com sucesso!"
      });

    } catch (error) {
      console.error('Erro ao desfazer baixa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao desfazer baixa"
      });
    }
  };

  // Carregar dados do Supabase
  const carregarContasAPagar = async () => {
    try {
      // Buscar movimentações ordenadas por data de vencimento das parcelas
      const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          favorecido:favorecidos(nome),
          movimentacoes_parcelas(
            id,
            numero,
            valor,
            data_vencimento,
            data_pagamento,
            multa,
            juros,
            desconto,
            conta_corrente_id,
            forma_pagamento
          )
        `)
        .eq('tipo_operacao', 'pagar')
        .eq('empresa_id', currentCompany?.id);

      if (error) throw error;

      if (movimentacoes) {
        const contasFormatadas: ContaPagar[] = movimentacoes.flatMap((mov: any) => {
          return mov.movimentacoes_parcelas.map((parcela: any) => ({
            id: parcela.id,
            movimentacao_id: mov.id,
            favorecido: mov.favorecido?.nome || 'Não informado',
            descricao: mov.descricao || '',
            // Criar datas sem ajuste de timezone
            dataVencimento: parcela.data_vencimento ? new Date(parcela.data_vencimento + "T12:00:00Z") : new Date(),
            dataPagamento: parcela.data_pagamento ? new Date(parcela.data_pagamento + "T12:00:00Z") : undefined,
            status: parcela.data_pagamento 
              ? (new Date(parcela.data_vencimento + "T12:00:00Z") < new Date(parcela.data_pagamento + "T12:00:00Z") ? 'pago_em_atraso' : 'pago') 
              : 'em_aberto',
            valor: Number(parcela.valor),
            multa: Number(parcela.multa || 0),
            juros: Number(parcela.juros || 0),
            desconto: Number(parcela.desconto || 0),
            numeroParcela: parcela.numero,
            numeroTitulo: mov.numero_documento,
            contaCorrenteId: parcela.conta_corrente_id,
            formaPagamento: parcela.forma_pagamento
          }));
        });

        // Ordenar por data de vencimento em ordem crescente
        contasFormatadas.sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime());

        setContas(contasFormatadas);
      }
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: 'Erro ao carregar as contas a pagar'
      });
    }
  };

  // Carregar dados quando o componente montar ou a empresa mudar
  useEffect(() => {
    if (currentCompany) {
      carregarContasAPagar();
    }
  }, [currentCompany]);

  // Limpar todos os filtros
  const limparFiltros = () => {
    setSearchTerm("");
    setStatusFilter("em_aberto");
    setDataVencInicio("");
    setDataVencFim("");
    setDataPagInicio("");
    setDataPagFim("");
    setIsFiltroAvancadoOpen(false);
  };

  // Filtro de contas
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.favorecido + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      
      // Aplicar filtros de data sem problemas de timezone
      let vencimentoDentroRange = true;
      if (dataVencInicio) {
        const dataInicio = new Date(dataVencInicio + 'T12:00:00Z');
        vencimentoDentroRange = vencimentoDentroRange && conta.dataVencimento >= dataInicio;
      }
      
      if (dataVencFim) {
        const dataFim = new Date(dataVencFim + 'T12:00:00Z');
        vencimentoDentroRange = vencimentoDentroRange && conta.dataVencimento <= dataFim;
      }
      
      let pagamentoDentroRange = true;
      if (dataPagInicio && conta.dataPagamento) {
        const dataInicio = new Date(dataPagInicio + 'T12:00:00Z');
        pagamentoDentroRange = pagamentoDentroRange && conta.dataPagamento >= dataInicio;
      }
      
      if (dataPagFim && conta.dataPagamento) {
        const dataFim = new Date(dataPagFim + 'T12:00:00Z');
        pagamentoDentroRange = pagamentoDentroRange && conta.dataPagamento <= dataFim;
      }
      
      // Se não há data de pagamento e temos filtros de pagamento, 
      // este item não deve aparecer nos resultados
      if ((dataPagInicio || dataPagFim) && !conta.dataPagamento) {
        pagamentoDentroRange = false;
      }

      return textoBusca && statusOk && vencimentoDentroRange && pagamentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataPagInicio, dataPagFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(filteredContas, {
              searchTerm,
              statusFilter,
              dataVencInicio,
              dataVencFim
            })}
            disabled={isGenerating}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? "Gerando..." : "Exportar Excel"}
          </Button>
          <Button
            variant="blue"
            onClick={() => navigate("/financeiro/incluir-movimentacao")}
          >
            Nova Conta a Pagar
          </Button>
        </div>
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
                      <SelectItem value="pago" className="text-green-600">Pago</SelectItem>
                      <SelectItem value="pago_em_atraso" className="text-red-600">Pago em Atraso</SelectItem>
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
                  <div className="text-sm font-medium mb-2 text-gray-700">Data de Pagamento</div>
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataPagInicio}
                        max={dataPagFim || undefined}
                        onChange={e => setDataPagInicio(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-medium text-gray-500">Até</label>
                      <Input
                        type="date"
                        className="bg-white"
                        value={dataPagFim}
                        min={dataPagInicio || undefined}
                        onChange={e => setDataPagFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            <div className="mt-6">
              <ContasAPagarTable
                contas={filteredContas}
                onEdit={handleEdit}
                onBaixar={handleBaixar}
                onDelete={prepararExclusao}
                onVisualizar={handleVisualizar}
                onDesfazerBaixa={handleDesfazerBaixa}
                onRenegociar={handleRenegociar}
                onVisualizarBaixa={handleVisualizarBaixa}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <BaixarContaPagarModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
      />

      <RenegociarParcelasModal
        conta={contaParaRenegociar}
        open={modalRenegociarAberto}
        onClose={() => setModalRenegociarAberto(false)}
        onRenegociar={realizarRenegociacao}
      />

      <VisualizarBaixaModal
        conta={contaParaVisualizarBaixa}
        open={modalVisualizarBaixaAberto}
        onClose={() => setModalVisualizarBaixaAberto(false)}
        contaCorrenteNome={contaCorrenteNome}
      />

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={confirmarExclusaoAberto} onOpenChange={setConfirmarExclusaoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
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
