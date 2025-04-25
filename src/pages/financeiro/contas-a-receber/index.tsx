import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Check } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContasAReceberTable, ContaReceber } from "@/components/contas-a-receber/contas-a-receber-table";
import { BaixarContaReceberModal } from "@/components/contas-a-receber/BaixarContaReceberModal";

// Função para formatar datas (DD/MM/YYYY)
function formatDateBR(dateStr: string) {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// Função utilitária para formatar Date para string DD/MM/YYYY
function dateToBR(date?: Date) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Função para parsear string DD/MM/YYYY para Date
function brToDate(value: string): Date | undefined {
  const [dd, mm, yyyy] = value.split("/");
  if (!dd || !mm || !yyyy) return undefined;
  const d = Number(dd), m = Number(mm) - 1, y = Number(yyyy);
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 0 || m > 11 || y < 1000 || y > 3000) return undefined;
  const dt = new Date(y, m, d);
  // Checa se realmente bate com o digitado (para casos como 31/02 etc)
  if (dt.getDate() !== d || dt.getMonth() !== m || dt.getFullYear() !== y) return undefined;
  return dt;
}

// Função para aplicar máscara automaticamente
function maskDateInput(value: string): string {
  value = value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) return value.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
  if (value.length > 2) return value.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
  return value;
}

// Função para obter badge de status
function getStatusBadge(status: "conciliado" | "nao_conciliado") {
  return status === "conciliado" ? (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
      Conciliado
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
      Não Conciliado
    </span>
  );
}

export default function ContasAReceberPage() {
  const [clienteId, setClienteId] = useState<string>("");
  const [periodo, setPeriodo] = useState<"mes_atual" | "mes_anterior" | "personalizado">("mes_atual");
  const [dataInicial, setDataInicial] = useState<Date | undefined>(undefined);
  const [dataFinal, setDataFinal] = useState<Date | undefined>(undefined);
  const [dataInicialStr, setDataInicialStr] = useState("");
  const [dataFinalStr, setDataFinalStr] = useState("");
  const [situacao, setSituacao] = useState<"todos" | "conciliado" | "nao_conciliado">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contaParaBaixar, setContaParaBaixar] = useState<ContaReceber | null>(null);
  const [isBaixarModalOpen, setIsBaixarModalOpen] = useState(false);

  // Buscar contas a receber
  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["contas-a-receber", currentCompany?.id, clienteId, dataInicial, dataFinal],
    queryFn: async () => {
      let query = supabase
        .from("movimentacoes_parcelas")
        .select(`
          *,
          movimentacoes (
            descricao,
            favorecido_id
          )
        `)
        .eq("empresa_id", currentCompany?.id)
        .eq("tipo_operacao", "receber");

      if (clienteId) {
        query = query.eq("favorecido_id", clienteId);
      }

      if (dataInicial) {
        query = query.gte("data_vencimento", dataInicial.toISOString().split("T")[0]);
      }

      if (dataFinal) {
        query = query.lte("data_vencimento", dataFinal.toISOString().split("T")[0]);
      }

      const { data, error } = await query.order("data_vencimento", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar contas a receber");
        console.error(error);
        return [];
      }

      // Formatar os dados para o formato esperado pelo componente ContasAReceberTable
      const contasReceberFormatadas: ContaReceber[] = (data || []).map(item => ({
        id: item.id,
        cliente: item.movimentacoes?.favorecido_id || "Cliente Desconhecido",
        descricao: item.movimentacoes?.descricao || "Sem descrição",
        dataVencimento: new Date(item.data_vencimento),
        dataRecebimento: item.data_pagamento ? new Date(item.data_pagamento) : undefined,
        valor: item.valor,
        status: item.data_pagamento ? "recebido" : "em_aberto",
        numeroParcela: item.numero.toString(),
        origem: "movimentacoes_parcelas",
        movimentacao_id: item.movimentacao_id
      }));

      setContasReceber(contasReceberFormatadas);
      return contasReceberFormatadas;
    },
    enabled: !!currentCompany?.id,
  });

  // Função para atualizar datas automáticas ao mudar período
  useEffect(() => {
    const hoje = new Date();
    if (periodo === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    }
    else if (periodo === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    }
    else if (periodo === "personalizado") {
      // Limpa as datas para campos vazios
      setDataInicial(undefined);
      setDataInicialStr("");
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }, [periodo]);

  // Atualiza o estado da data inicial ao digitar (com máscara e parse)
  function onChangeDataInicialStr(e: React.ChangeEvent<HTMLInputElement>) {
    const val = maskDateInput(e.target.value);
    setDataInicialStr(val);
    const dt = brToDate(val);
    setDataInicial(dt);
  }
  function onBlurDataInicial(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value && !brToDate(e.target.value)) {
      setDataInicial(undefined);
      setDataInicialStr("");
    }
  }

  function onChangeDataFinalStr(e: React.ChangeEvent<HTMLInputElement>) {
    const val = maskDateInput(e.target.value);
    setDataFinalStr(val);
    const dt = brToDate(val);
    setDataFinal(dt);
  }
  function onBlurDataFinal(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value && !brToDate(e.target.value)) {
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }

  // Filtro das contas a receber
  const contasFiltradas = useMemo(() => {
    return contasReceber.filter((linha) => {
      const descricao = linha.descricao || "";
      const cliente = linha.cliente || "";
      
      const buscaOk =
        !searchTerm ||
        descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.toLowerCase().includes(searchTerm.toLowerCase());
      
      return buscaOk;
    });
  }, [contasReceber, searchTerm]);

  function handleEdit(conta: ContaReceber) {
    navigate("/financeiro/incluir-movimentacao", { state: { id: conta.movimentacao_id } });
  }

  function handleBaixar(conta: ContaReceber) {
    setContaParaBaixar(conta);
    setIsBaixarModalOpen(true);
  }

  function handleDelete(id: string) {
    toast.info("Ação de excluir conta a receber: " + id);
  }

  function handleVisualizar(conta: ContaReceber) {
    toast.info("Ação de visualizar conta a receber: " + conta.id);
  }

  const onBaixarConta = async (dados: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    formaPagamento: string;
    multa: number;
    juros: number;
    desconto: number;
  }) => {
    setIsBaixarModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["contas-a-receber"] });
  };

  // Adicionar função para desfazer baixa
  const handleDesfazerBaixa = async (conta: ContaReceber) => {
    try {
      // 1. Primeiro, verificamos se existe registro no fluxo_caixa
      const { data: fluxoCaixa, error: fluxoError } = await supabase
        .from("fluxo_caixa")
        .select("*")
        .eq("movimentacao_parcela_id", conta.id);

      if (fluxoError) throw fluxoError;

      // 2. Excluímos o registro do fluxo de caixa, se existir
      if (fluxoCaixa && fluxoCaixa.length > 0) {
        const { error: deleteError } = await supabase
          .from("fluxo_caixa")
          .delete()
          .eq("movimentacao_parcela_id", conta.id);

        if (deleteError) throw deleteError;
      }

      // 3. Resetamos os campos de pagamento na parcela da movimentação
      const { error: updateError } = await supabase
        .from("movimentacoes_parcelas")
        .update({
          data_pagamento: null,
          conta_corrente_id: null,
          multa: null,
          juros: null,
          desconto: null,
          forma_pagamento: null
        })
        .eq("id", conta.id);

      if (updateError) throw updateError;

      toast.success("Baixa desfeita com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contas-a-receber"] });
    } catch (error) {
      console.error("Erro ao desfazer baixa:", error);
      toast.error("Erro ao desfazer baixa do título");
    }
  };

  return (
    <div className="space-y-4">
      <BaixarContaReceberModal
        conta={contaParaBaixar}
        open={isBaixarModalOpen}
        onClose={() => setIsBaixarModalOpen(false)}
        onBaixar={onBaixarConta}
      />
      {/* Título e botão de nova movimentação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Contas a Receber</h1>
        <Button
          variant="blue"
          className="rounded-md px-6 py-2 text-base font-semibold"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Conta a Receber
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6 pb-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Filtro de Situação */}
            <div className="col-span-1">
              <Select value={situacao} onValueChange={v => setSituacao(v as "todos" | "conciliado" | "nao_conciliado")}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <Filter className="mr-2 h-5 w-5 text-neutral-400" />
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent className="bg-white border">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conciliado" className="text-green-600">Conciliados</SelectItem>
                  <SelectItem value="nao_conciliado" className="text-blue-600">Não Conciliados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="col-span-1">
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <CalendarIcon className="mr-2 h-5 w-5 text-neutral-400" />
                  <SelectValue placeholder="Selecionar Período" />
                </SelectTrigger>
                <SelectContent className="bg-white border">
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="personalizado">Selecionar Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Data Inicial */}
            <div className="col-span-1 flex flex-col">
              <label className="text-xs font-medium mb-1 ml-1">Data Inicial</label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  className="bg-white border rounded-lg h-[52px] pl-10 text-base font-normal"
                  placeholder="DD/MM/AAAA"
                  disabled={periodo !== "personalizado"}
                  value={dataInicialStr}
                  maxLength={10}
                  onChange={onChangeDataInicialStr}
                  onFocus={e => {
                    if (!dataInicialStr) setDataInicialStr("");
                  }}
                  onBlur={onBlurDataInicial}
                  style={{ minHeight: 52 }}
                  autoComplete="off"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            {/* Data Final */}
            <div className="col-span-1 flex flex-col">
              <label className="text-xs font-medium mb-1 ml-1">Data Final</label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  className="bg-white border rounded-lg h-[52px] pl-10 text-base font-normal"
                  placeholder="DD/MM/AAAA"
                  disabled={periodo !== "personalizado"}
                  value={dataFinalStr}
                  maxLength={10}
                  onChange={onChangeDataFinalStr}
                  onFocus={e => {
                    if (!dataFinalStr) setDataFinalStr("");
                  }}
                  onBlur={onBlurDataFinal}
                  style={{ minHeight: 52 }}
                  autoComplete="off"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Linha de busca */}
          <div className="mt-4 flex flex-row gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none cursor-pointer text-neutral-400"
                style={{ lineHeight: 0 }}
                tabIndex={-1}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </span>
              <Input
                id="busca-extrato"
                placeholder="Buscar cliente ou descrição"
                className="pl-10 bg-white border rounded-lg h-[52px] text-base font-normal border-gray-300 shadow-sm focus:bg-white min-w-[180px] w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          {/* Separador */}
          <div className="mb-4" />

          {/* Tabela */}
          <div className="mt-6">
            <ContasAReceberTable 
              contas={contasFiltradas} 
              onEdit={handleEdit} 
              onBaixar={handleBaixar} 
              onDelete={handleDelete} 
              onVisualizar={handleVisualizar} 
              onDesfazerBaixa={handleDesfazerBaixa}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
