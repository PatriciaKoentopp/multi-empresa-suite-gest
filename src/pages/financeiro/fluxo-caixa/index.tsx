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

  // Buscar movimentações do fluxo de caixa
  const { data: movimentacoes = [], isLoading } = useQuery({
    queryKey: ["fluxo-caixa", currentCompany?.id, contaCorrenteId, dataInicial, dataFinal],
    queryFn: async () => {
      let query = supabase
        .from("fluxo_caixa")
        .select(`
          *,
          movimentacoes (
            descricao,
            favorecido_id
          ),
          movimentacoes_parcelas (
            numero
          )
        `)
        .eq("empresa_id", currentCompany?.id);

      if (contaCorrenteId) {
        query = query.eq("conta_corrente_id", contaCorrenteId);
      }

      if (dataInicial) {
        query = query.gte("data_movimentacao", dataInicial.toISOString().split("T")[0]);
      }

      if (dataFinal) {
        query = query.lte("data_movimentacao", dataFinal.toISOString().split("T")[0]);
      }

      const { data, error } = await query.order("data_movimentacao", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar movimentações");
        console.error(error);
        return [];
      }

      // Coletar todos os IDs de favorecidos relacionados às movimentações
      const favorecidosIds = data
        .filter(item => item.movimentacoes?.favorecido_id)
        .map(item => item.movimentacoes.favorecido_id);

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

      return data;
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

  // Filtro das movimentações
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter((linha) => {
      const descricao = linha.descricao || linha.movimentacoes?.descricao || "";
      
      // Buscar o favorecido a partir do cache
      let favorecidoNome = "";
      if (linha.movimentacoes?.favorecido_id) {
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
  }, [movimentacoes, searchTerm, situacao, favorecidosCache]);

  // Função para conciliar movimento
  async function handleConciliar(id: string) {
    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .update({ situacao: "conciliado" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Movimento conciliado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
    } catch (error) {
      console.error("Erro ao conciliar:", error);
      toast.error("Erro ao conciliar movimento");
    }
  }

  // Nova função para desfazer conciliação
  async function handleDesfazerConciliacao(id: string) {
    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .update({ situacao: "nao_conciliado" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Conciliação desfeita com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
    } catch (error) {
      console.error("Erro ao desfazer conciliação:", error);
      toast.error("Erro ao desfazer conciliação");
    }
  }

  function handleEdit(id: string) {
    navigate("/financeiro/incluir-movimentacao", { state: { id } });
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("fluxo_caixa")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Movimento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["fluxo-caixa"] });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir movimento");
    }
  }

  // Função para obter o nome do favorecido
  function getFavorecidoNome(linha: any) {
    if (linha.movimentacoes?.favorecido_id) {
      const favorecido = favorecidosCache[linha.movimentacoes.favorecido_id];
      return favorecido?.nome || "-";
    }
    return "-";
  }

  // Função para obter a descrição
  function getDescricao(linha: any) {
    if (linha.descricao) {
      return linha.descricao;
    }
    if (linha.movimentacoes?.descricao) {
      return linha.movimentacoes.descricao;
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
                placeholder="Buscar favorecido ou descrição"
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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Favorecido</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right w-[120px]">Valor</TableHead>
                    <TableHead className="text-right w-[120px]">Saldo</TableHead>
                    <TableHead className="text-center w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimentacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Nenhum resultado encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovimentacoes.map((linha) => (
                      <TableRow key={linha.id}>
                        <TableCell>{formatDateBR(linha.data_movimentacao)}</TableCell>
                        <TableCell>{getFavorecidoNome(linha)}</TableCell>
                        <TableCell>{getDescricao(linha)}</TableCell>
                        <TableCell>{linha.forma_pagamento}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            linha.situacao === "conciliado"
                              ? "conciliado"
                              : "nao_conciliado"
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(linha.valor)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(linha.saldo)}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-500 hover:bg-blue-100"
                                aria-label="Ações"
                              >
                                <MoreVertical size={20} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white z-50 min-w-[160px]">
                              <DropdownMenuItem
                                onClick={() => handleEdit(linha.id)}
                                className="cursor-pointer"
                              >
                                <span className="text-blue-500 mr-2"><svg className="inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} d="M16.862 4.487a2.5 2.5 0 1 1 3.535 3.536L7.5 20.918l-4.242.707.707-4.243L16.862 4.487z" /></svg></span>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(linha.id)}
                                className="cursor-pointer"
                              >
                                <span className="text-red-500 mr-2"><svg className="inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></span>
                                Excluir
                              </DropdownMenuItem>
                              {linha.situacao === "nao_conciliado" ? (
                                <DropdownMenuItem
                                  onClick={() => handleConciliar(linha.id)}
                                  className="cursor-pointer"
                                >
                                  <span className="text-green-600 mr-2"><Check className="inline" size={16} /></span>
                                  Conciliar movimento
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleDesfazerConciliacao(linha.id)}
                                  className="cursor-pointer"
                                >
                                  <span className="text-blue-500 mr-2">
                                    <svg className="inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                  </span>
                                  Desfazer conciliação
                              </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
