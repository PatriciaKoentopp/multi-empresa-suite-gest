import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter, Undo } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Movimentacao, MovimentacaoParcela } from "@/types/movimentacoes";
import { useCompany } from "@/contexts/company-context";
import { formatDate } from "@/lib/utils";

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

  const [contaParaExcluir, setContaParaExcluir] = useState<string | null>(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  const [contaParaBaixar, setContaParaBaixar] = useState<ContaPagar | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);

  const { currentCompany } = useCompany();

  const handleBaixar = (conta: ContaPagar) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  function realizarBaixa({ dataPagamento, contaCorrenteId, multa, juros, desconto }: {
    dataPagamento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
  }) {
    if (!contaParaBaixar || !currentCompany) return;

    const atualizarMovimentacao = async () => {
      try {
        // Atualiza a parcela com os dados do pagamento
        const { error: errorParcela } = await supabase
          .from('movimentacoes_parcelas')
          .update({
            data_pagamento: format(dataPagamento, 'yyyy-MM-dd'),
            multa,
            juros,
            desconto,
            conta_corrente_id: contaCorrenteId,
          })
          .eq('id', contaParaBaixar.id);

        if (errorParcela) throw errorParcela;

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

      // 1. Verificar se o registro está conciliado no fluxo de caixa
      const { data: fluxoCaixa, error: fluxoError } = await supabase
        .from('fluxo_caixa')
        .select('situacao')
        .eq('movimentacao_parcela_id', conta.id)
        .single();

      if (fluxoError) {
        console.error('Erro ao verificar situação:', fluxoError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao verificar situação do título"
        });
        return;
      }

      if (fluxoCaixa?.situacao === 'conciliado') {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não é possível desfazer a baixa de um título conciliado"
        });
        return;
      }

      // 2. Se não estiver conciliado, prosseguir com a operação de desfazer baixa
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

      // 3. Excluir o registro do fluxo de caixa
      const { error: deleteError } = await supabase
        .from('fluxo_caixa')
        .delete()
        .eq('movimentacao_parcela_id', conta.id);

      if (deleteError) throw deleteError;

      // 4. Atualizar a lista local
      setContas(prev => prev.map(c => 
        c.id === conta.id
          ? { ...c, dataPagamento: undefined, status: "em_aberto" as const }
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
            conta_corrente_id
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
            numeroTitulo: mov.numero_documento
          }));
        });

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

  // Filtro de contas
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.favorecido + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      const vencimentoDentroRange =
        (!dataVencInicio || conta.dataVencimento >= new Date(dataVencInicio + "T12:00:00Z")) &&
        (!dataVencFim || conta.dataVencimento <= new Date(dataVencFim + "T23:59:59Z"));
      const pagamentoDentroRange =
        (!dataPagInicio || (conta.dataPagamento && conta.dataPagamento >= new Date(dataPagInicio + "T12:00:00Z"))) &&
        (!dataPagFim || (conta.dataPagamento && conta.dataPagamento <= new Date(dataPagFim + "T23:59:59Z")));

      return textoBusca && statusOk && vencimentoDentroRange && pagamentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataPagInicio, dataPagFim]);

  function formatInputDate(date: Date | undefined) {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  }

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <Button
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Conta a Pagar
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {/* Primeira linha: Busca + Status */}
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
            <div /> {/* Espaço só para organizar em tela grande */}
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
            <ContasAPagarTable
              contas={filteredContas}
              onEdit={handleEdit}
              onBaixar={handleBaixar}
              onDelete={prepararExclusao}
              onVisualizar={handleVisualizar}
              onDesfazerBaixa={handleDesfazerBaixa}
            />
          </div>
        </CardContent>
      </Card>

      <BaixarContaPagarModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
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
