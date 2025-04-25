import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ContasAReceberTable, ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaixarContaReceberModal } from "@/components/contas-a-receber/BaixarContaReceberModal";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";

export default function ContasAReceberPage() {
  const { currentCompany } = useCompany();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | "recebido" | "recebido_em_atraso" | "em_aberto">("todas");
  const [dataVencInicio, setDataVencInicio] = useState<string>("");
  const [dataVencFim, setDataVencFim] = useState<string>("");
  const [dataRecInicio, setDataRecInicio] = useState<string>("");
  const [dataRecFim, setDataRecFim] = useState<string>("");

  const inputBuscaRef = useRef<HTMLInputElement>(null);

  // Modal Baixar
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaReceber | null>(null);
  const [modalBaixarAberto, setModalBaixarAberto] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarContasReceber();
    }
  }, [currentCompany]);

  async function carregarContasReceber() {
    try {
      setIsLoading(true);
      
      // Buscar somente movimentações parcelas (contas a receber)
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
        .eq('movimentacao.tipo_operacao', 'receber');
      
      if (errorMovimentacoes) throw errorMovimentacoes;

      // Converter movimentações parcelas para ContaReceber
      const contasReceber: ContaReceber[] = (movimentacoesParcelas || [])
        .filter(parcela => parcela.movimentacao)
        .map(parcela => ({
          id: parcela.id,
          cliente: parcela.movimentacao.favorecido?.nome || 'Cliente não identificado',
          descricao: parcela.movimentacao.descricao || '',
          dataVencimento: new Date(parcela.data_vencimento),
          dataRecebimento: parcela.data_pagamento ? new Date(parcela.data_pagamento) : undefined,
          status: determinarStatus(parcela.data_vencimento, parcela.data_pagamento),
          valor: Number(parcela.valor),
          numeroParcela: `${parcela.movimentacao.numero_documento || '-'}/${parcela.numero}`,
          origem: 'movimentacao'
        }));

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
    
    const vencimento = new Date(dataVencimento);
    const pagamento = new Date(dataPagamento);
    
    return pagamento > vencimento ? "recebido_em_atraso" : "recebido";
  }

  // Ações
  const handleEdit = (conta: ContaReceber) => {
    navigate("/financeiro/incluir-movimentacao", {
      state: { contaReceber: conta }
    });
  };

  const handleBaixar = (conta: ContaReceber) => {
    setContaParaBaixar(conta);
    setModalBaixarAberto(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('movimentacoes_parcelas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      setContas(prev => prev.filter(c => c.id !== id));
      toast.success("Conta excluída com sucesso");
      
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error("Erro ao excluir conta");
    }
  };

  function realizarBaixa({ dataRecebimento, contaCorrenteId, multa, juros, desconto }: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
  }) {
    if (!contaParaBaixar) return;

    // Atualiza no banco
    supabase
      .from('movimentacoes_parcelas')
      .update({
        data_pagamento: format(dataRecebimento, 'yyyy-MM-dd'),
        multa,
        juros,
        desconto,
        conta_corrente_id: contaCorrenteId
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
                    conta.dataVencimento.toISOString(),
                    dataRecebimento.toISOString()
                  ),
                }
              : conta
          )
        );
        
        toast.success("Recebimento registrado com sucesso!");
        setModalBaixarAberto(false);
      });
  }

  // Filtro
  const filteredContas = useMemo(() => {
    return contas.filter((conta) => {
      const textoBusca = (conta.cliente + conta.descricao)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusOk = statusFilter === "todas" || conta.status === statusFilter;
      const vencimentoDentroRange =
        (!dataVencInicio || conta.dataVencimento >= new Date(dataVencInicio)) &&
        (!dataVencFim || conta.dataVencimento <= new Date(dataVencFim));
      const recebimentoDentroRange =
        (!dataRecInicio || (conta.dataRecebimento && conta.dataRecebimento >= new Date(dataRecInicio))) &&
        (!dataRecFim || (conta.dataRecebimento && conta.dataRecebimento <= new Date(dataRecFim)));

      return textoBusca && statusOk && vencimentoDentroRange && recebimentoDentroRange;
    });
  }, [contas, searchTerm, statusFilter, dataVencInicio, dataVencFim, dataRecInicio, dataRecFim]);

  function handleLupaClick() {
    inputBuscaRef.current?.focus();
  }

  const handleVisualizar = (conta: ContaReceber) => {
    navigate("/financeiro/incluir-movimentacao", {
      state: { 
        contaReceber: conta,
        modoVisualizacao: true
      }
    });
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
                  <SelectItem value="recebido" className="text-green-600">Recebido</SelectItem>
                  <SelectItem value="recebido_em_atraso" className="text-red-600">Recebido em Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>
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
            {/* Recebimento: de - até */}
            <div className="flex flex-row gap-2 flex-1 min-w-[240px]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Rec. de</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataRecInicio}
                  max={dataRecFim || undefined}
                  onChange={e => setDataRecInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">até</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataRecFim}
                  min={dataRecInicio || undefined}
                  onChange={e => setDataRecFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mb-4" />
          <div className="mt-6">
            <ContasAReceberTable
              contas={filteredContas}
              onEdit={handleEdit}
              onBaixar={handleBaixar}
              onDelete={handleDelete}
              onVisualizar={handleVisualizar}
            />
          </div>
        </CardContent>
      </Card>
      <BaixarContaReceberModal
        conta={contaParaBaixar}
        open={modalBaixarAberto}
        onClose={() => setModalBaixarAberto(false)}
        onBaixar={realizarBaixa}
      />
    </div>
  );
}
