
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Search, Filter, X } from "lucide-react";
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
  TableFooter,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Check } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

// Função para formatar valores monetários com cor
function formatCurrencyWithColor(value: number, addColor: boolean = false) {
  const formattedValue = value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
  
  if (!addColor) {
    return formattedValue;
  }
  
  const color = value < 0 ? "text-red-600" : "text-blue-600";
  
  return <span className={color}>{formattedValue}</span>;
}

export default function FluxoCaixaPage() {
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
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
  const [favorecidosCache, setFavorecidosCache] = useState<Record<string, any>>({});
  const [contaCorrenteSelecionada, setContaCorrenteSelecionada] = useState<any>(null);
  const [documentosCache, setDocumentosCache] = useState<Record<string, any>>({});
  const [parcelasCache, setParcelasCache] = useState<Record<string, any>>({});

  // Buscar contas correntes
  const { data: contasCorrentes = [] } = useQuery({
    queryKey: ["contas-correntes", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("*")
        .eq("empresa_id", currentCompany?.id)
        .eq("status", "ativo");

      if (error) {
        toast.error("Erro ao carregar contas correntes");
        console.error(error);
        return [];
      }

      return data;
    },
    enabled: !!currentCompany?.id,
  });

  // Atualizar conta corrente selecionada quando o ID mudar
  useEffect(() => {
    if (contaCorrenteId && contasCorrentes.length > 0) {
      const conta = contasCorrentes.find(c => c.id === contaCorrenteId);
      setContaCorrenteSelecionada(conta || null);
    } else {
      setContaCorrenteSelecionada(null);
    }
  }, [contaCorrenteId, contasCorrentes]);

  // Buscar TODAS as movimentações do fluxo de caixa para a conta selecionada
  const { data: todasMovimentacoes = [], isLoading: isLoadingTodasMovimentacoes } = useQuery({
    queryKey: ["fluxo-caixa-todas", currentCompany?.id, contaCorrenteId],
    queryFn: async () => {
      if (!contaCorrenteId) return [];

      let query = supabase
        .from("fluxo_caixa")
        .select(`
          *,
          movimentacoes (
            descricao,
            favorecido_id,
            numero_documento,
            numero_parcelas
          ),
          movimentacoes_parcelas (
            numero
          ),
          antecipacoes (
            favorecido_id,
            numero_documento
          )
        `)
        .eq("empresa_id", currentCompany?.id)
        .eq("conta_corrente_id", contaCorrenteId)
        .order("data_movimentacao", { ascending: true });

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar todas as movimentações");
        console.error(error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentCompany?.id && !!contaCorrenteId,
  });

  // Buscar movimentações do fluxo de caixa para o período selecionado
  const { data: movimentacoesPeriodo = [], isLoading } = useQuery({
    queryKey: ["fluxo-caixa-periodo", currentCompany?.id, contaCorrenteId, dataInicial, dataFinal],
    queryFn: async () => {
      if (!contaCorrenteId) return [];

      let query = supabase
        .from("fluxo_caixa")
        .select(`
          *,
          movimentacoes (
            id,
            descricao,
            favorecido_id,
            numero_documento,
            numero_parcelas
          ),
          movimentacoes_parcelas (
            id,
            numero,
            movimentacao_id
          ),
          antecipacoes (
            id,
            favorecido_id,
            numero_documento
          )
        `)
        .eq("empresa_id", currentCompany?.id)
        .eq("conta_corrente_id", contaCorrenteId);

      if (dataInicial) {
        query = query.gte("data_movimentacao", dataInicial.toISOString().split("T")[0]);
      }

      if (dataFinal) {
        query = query.lte("data_movimentacao", dataFinal.toISOString().split("T")[0]);
      }

      const { data, error } = await query.order("data_movimentacao", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar movimentações do período");
        console.error(error);
        return [];
      }

      // Coletar todos os IDs de favorecidos - incluindo das antecipações
      const favorecidosIds = [];
      
      // IDs das movimentações normais
      data.filter(item => item.movimentacoes?.favorecido_id)
        .forEach(item => favorecidosIds.push(item.movimentacoes.favorecido_id));
      
      // IDs das antecipações
      data.filter(item => item.antecipacoes?.favorecido_id)
        .forEach(item => favorecidosIds.push(item.antecipacoes.favorecido_id));

      // Buscar os dados dos favorecidos se existirem IDs
      if (favorecidosIds.length > 0) {
        const uniqueIds = [...new Set(favorecidosIds)];
        const { data: favorecidosData, error: favError } = await supabase
          .from("favorecidos")
          .select("id, nome")
          .in("id", uniqueIds);

        if (!favError && favorecidosData) {
          const favMap: Record<string, any> = {};
          favorecidosData.forEach(fav => {
            favMap[fav.id] = fav;
          });
          setFavorecidosCache(favMap);
        }
      }
      
      const movimentacoesIds = new Set<string>();
      
      data.filter(item => item.movimentacao_id).forEach(item => {
        movimentacoesIds.add(item.movimentacao_id);
      });
      
      const parcelasIds = data
        .filter(item => item.movimentacao_parcela_id)
        .map(item => item.movimentacao_parcela_id);
      
      if (parcelasIds.length > 0) {
        const { data: parcelasData } = await supabase
          .from("movimentacoes_parcelas")
          .select("id, movimentacao_id, numero, data_pagamento")
          .in("id", parcelasIds);
          
        if (parcelasData) {
          const parcelasMap: Record<string, any> = {...parcelasCache};
          parcelasData.forEach(parcela => {
            parcelasMap[parcela.id] = parcela;
            if (parcela.movimentacao_id) {
              movimentacoesIds.add(parcela.movimentacao_id);
            }
          });
          setParcelasCache(parcelasMap);
        }
      }
      
      if (movimentacoesIds.size > 0) {
        const { data: movsData } = await supabase
          .from("movimentacoes")
          .select("id, numero_documento")
          .in("id", Array.from(movimentacoesIds));
          
        if (movsData) {
          const docsMap: Record<string, any> = {...documentosCache};
          movsData.forEach(mov => {
            docsMap[mov.id] = mov;
          });
          setDocumentosCache(docsMap);
        }
      }

      return data || [];
    },
    enabled: !!currentCompany?.id && !!contaCorrenteId,
  });

  // Calcular saldo acumulado até a data inicial da consulta
  const saldoInicial = useMemo(() => {
    if (!contaCorrenteSelecionada || !todasMovimentacoes.length || !dataInicial) return 0;

    let saldo = contaCorrenteSelecionada.saldo_inicial ? Number(contaCorrenteSelecionada.saldo_inicial) : 0;
    
    const dataInicialISO = dataInicial.toISOString().split('T')[0];
    
    for (const mov of todasMovimentacoes) {
      if (mov.data_movimentacao >= dataInicialISO) continue;
      saldo += Number(mov.valor);
    }
    
    return saldo;
  }, [contaCorrenteSelecionada, todasMovimentacoes, dataInicial, contaCorrenteId]);

  // Calcular saldo acumulado para cada movimentação do período
  const movimentacoesComSaldo = useMemo(() => {
    if (!movimentacoesPeriodo || movimentacoesPeriodo.length === 0) return [];

    const movimentacoesOrdenadas = [...movimentacoesPeriodo].sort((a, b) => {
      const dataA = new Date(a.data_movimentacao).getTime();
      const dataB = new Date(b.data_movimentacao).getTime();
      return dataA - dataB;
    });

    let saldoAcumulado = saldoInicial;
    
    return movimentacoesOrdenadas.map(movimentacao => {
      saldoAcumulado += Number(movimentacao.valor);
      
      return {
        ...movimentacao,
        saldo_calculado: saldoAcumulado
      };
    });
  }, [movimentacoesPeriodo, saldoInicial]);

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
      setDataInicial(undefined);
      setDataInicialStr("");
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }, [periodo]);

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

  const limparFiltros = () => {
    setSearchTerm("");
    setSituacao("todos");
    setContaCorrenteId("");
    setPeriodo("mes_atual");
  };

  // Filtro das movimentações
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoesComSaldo.filter((linha) => {
      const descricao = linha.descricao || linha.movimentacoes?.descricao || "";
      
      // Buscar o favorecido correto baseado na origem
      let favorecidoNome = "";
      if (linha.origem === "antecipacao" && linha.antecipacoes?.favorecido_id) {
        // Para antecipações, buscar da tabela antecipacoes
        const favorecido = favorecidosCache[linha.antecipacoes.favorecido_id];
        favorecidoNome = favorecido?.nome || "";
      } else if (linha.movimentacoes?.favorecido_id) {
        // Para movimentações normais
        const favorecido = favorecidosCache[linha.movimentacoes.favorecido_id];
        favorecidoNome = favorecido?.nome || "";
      }
      
      const buscaOk =
        !searchTerm ||
        descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorecidoNome.toLowerCase().includes(searchTerm.toLowerCase());
      
      const sitOk = situacao === "todos" || linha.situacao === situacao;
      
      return buscaOk && sitOk;
    });
  }, [movimentacoesComSaldo, searchTerm, situacao, favorecidosCache]);

  // Função para conciliar movimento
  async function handleConciliar(id: string) {
    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .update({ situacao: "conciliado" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Movimento conciliado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa-todas"] });
    } catch (error) {
      console.error("Erro ao conciliar:", error);
      toast.error("Erro ao conciliar movimento");
    }
  }

  async function handleDesfazerConciliacao(id: string) {
    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .update({ situacao: "nao_conciliado" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Conciliação desfeita com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa-todas"] });
    } catch (error) {
      console.error("Erro ao desfazer conciliação:", error);
      toast.error("Erro ao desfazer conciliação");
    }
  }

  // Função para obter o nome do favorecido
  function getFavorecidoNome(linha: any) {
    if (linha.origem === "antecipacao" && linha.antecipacoes?.favorecido_id) {
      const favorecido = favorecidosCache[linha.antecipacoes.favorecido_id];
      return favorecido?.nome || "-";
    } else if (linha.movimentacoes?.favorecido_id) {
      const favorecido = favorecidosCache[linha.movimentacoes.favorecido_id];
      return favorecido?.nome || "-";
    }
    return "-";
  }

  function getDescricao(linha: any) {
    if (linha.descricao) {
      return linha.descricao;
    }
    if (linha.movimentacoes?.descricao) {
      return linha.movimentacoes.descricao;
    }
    return "-";
  }
  
  function getTituloParcela(linha: any) {
    // Caso 1: Antecipação
    if (linha.origem === "antecipacao" && linha.antecipacoes?.numero_documento) {
      return `${linha.antecipacoes.numero_documento}/1`;
    }
    
    // Caso 2: Temos uma movimentação de parcela
    if (linha.movimentacao_parcela_id) {
      const parcela = parcelasCache[linha.movimentacao_parcela_id];
      if (parcela && parcela.movimentacao_id) {
        const movimentacaoId = parcela.movimentacao_id;
        const movPai = documentosCache[movimentacaoId];
        const numeroDoc = movPai?.numero_documento || '-';
        const numeroParcela = parcela.numero || '1';
        return `${numeroDoc}/${numeroParcela}`;
      }
    }
    
    // Caso 3: Temos uma movimentação principal
    if (linha.movimentacao_id) {
      const movimento = documentosCache[linha.movimentacao_id];
      if (movimento) {
        return `${movimento.numero_documento || '-'}/1`;
      }
    }
    
    return "-";
  }

  return (
    <div className="space-y-4">
      {/* Título e botão de nova movimentação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
        <Button
          variant="blue"
          className="rounded-md px-6 py-2 text-base font-semibold"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Movimentação
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

            {/* Conta Corrente */}
            <div className="col-span-1">
              <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <Filter className="mr-2 h-5 w-5 text-neutral-400" />
                  <SelectValue placeholder="Conta Corrente" />
                </SelectTrigger>
                <SelectContent className="bg-white border">
                  {contasCorrentes.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
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
            <div className="relative flex-1">
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
                placeholder="Buscar favorecido ou descrição"
                className="pl-10 bg-white border rounded-lg h-[52px] text-base font-normal border-gray-300 shadow-sm focus:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={limparFiltros}
              className="text-gray-500 hover:text-gray-700 h-[52px] w-10"
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabela principal */}
          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Título/Parcela</TableHead>
                      <TableHead>Favorecido</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-center w-[60px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!contaCorrenteId ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Selecione uma conta corrente para visualizar o fluxo de caixa
                        </TableCell>
                      </TableRow>
                    ) : filteredMovimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Nenhuma movimentação encontrada no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovimentacoes.map((linha) => (
                        <TableRow key={linha.id}>
                          <TableCell>
                            {formatDateBR(linha.data_movimentacao)}
                          </TableCell>
                          <TableCell>
                            {getTituloParcela(linha)}
                          </TableCell>
                          <TableCell>
                            {getFavorecidoNome(linha)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {getDescricao(linha)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrencyWithColor(linha.valor, true)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(linha.saldo_calculado)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(linha.situacao)}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                {linha.situacao === "nao_conciliado" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleConciliar(linha.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Conciliar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleDesfazerConciliacao(linha.id)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    Desfazer Conciliação
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {filteredMovimentacoes.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="font-medium">
                          Saldo Final
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {filteredMovimentacoes.length > 0 ? 
                            formatCurrency(filteredMovimentacoes[filteredMovimentacoes.length - 1]?.saldo_calculado || 0) 
                            : formatCurrency(0)
                          }
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
