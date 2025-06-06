import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/movimentacao/DateInput";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FluxoCaixaPage() {
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataInicial, setDataInicial] = useState<Date | null>(startOfMonth(subMonths(new Date(), 1)));
  const [dataFinal, setDataFinal] = useState<Date | null>(endOfMonth(new Date()));
  const [contaCorrente, setContaCorrente] = useState("todas");
  const [situacao, setSituacao] = useState<"todos" | "conciliado" | "nao_conciliado">("todos");
  const [contasCorrentes, setContasCorrentes] = useState([]);
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  useEffect(() => {
    async function fetchContasCorrentes() {
      if (!currentCompany?.id) return;
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("id, nome, banco")
        .eq("empresa_id", currentCompany.id);

      if (error) {
        toast({
          title: "Erro ao carregar contas correntes",
          description: error.message,
        });
        return;
      }

      setContasCorrentes(data);
    }

    fetchContasCorrentes();
  }, [currentCompany?.id]);

  useEffect(() => {
    async function fetchFluxoCaixa() {
      if (!currentCompany?.id) return;

      let query = supabase
        .from("fluxo_caixa")
        .select(
          `
          id,
          data_movimentacao,
          descricao,
          tipo_operacao,
          forma_pagamento,
          situacao,
          valor,
          saldo,
          conta_corrente_id,
          movimentacao_id,
          contas_correntes (
            nome,
            banco
          )
        `
        )
        .eq("empresa_id", currentCompany.id)
        .order("data_movimentacao", { ascending: false });

      if (dataInicial && dataFinal) {
        query = query.gte("data_movimentacao", format(dataInicial, "yyyy-MM-dd"));
        query = query.lte("data_movimentacao", format(dataFinal, "yyyy-MM-dd"));
      }

      if (contaCorrente !== "todas") {
        query = query.eq("conta_corrente_id", contaCorrente);
      }

      if (situacao !== "todos") {
        query = query.eq("situacao", situacao);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro ao carregar fluxo de caixa",
          description: error.message,
        });
        return;
      }

      setFluxoCaixa(data);
    }

    fetchFluxoCaixa();
  }, [currentCompany?.id, dataInicial, dataFinal, contaCorrente, situacao]);

  const totalEntradas = useMemo(() => {
    return fluxoCaixa.reduce((acc, item) => {
      if (item.tipo_operacao === "receber") {
        return acc + item.valor;
      }
      return acc;
    }, 0);
  }, [fluxoCaixa]);

  const totalSaidas = useMemo(() => {
    return fluxoCaixa.reduce((acc, item) => {
      if (item.tipo_operacao === "pagar") {
        return acc + item.valor;
      }
      return acc;
    }, 0);
  }, [fluxoCaixa]);

  const saldoFinal = useMemo(() => {
    return totalEntradas - totalSaidas;
  }, [totalEntradas, totalSaidas]);

  const filteredFluxoCaixa = useMemo(() => {
    return fluxoCaixa.filter((item) => {
      const termo = searchTerm.toLowerCase();
      return (
        item.descricao.toLowerCase().includes(termo) ||
        item.contas_correntes?.nome.toLowerCase().includes(termo) ||
        item.contas_correntes?.banco.toLowerCase().includes(termo)
      );
    });
  }, [fluxoCaixa, searchTerm]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          <Button
            variant="blue"
            onClick={() => navigate("/financeiro/incluir-movimentacao")}
          >
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Primeira linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Busca por texto */}
              <div className="col-span-1">
                <Input
                  placeholder="Buscar descrição, banco ou conta"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro de Conta Corrente */}
              <div className="col-span-1">
                <Select value={contaCorrente} onValueChange={setContaCorrente}>
                  <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                    <Filter className="mr-2 h-5 w-5 text-neutral-400" />
                    <SelectValue placeholder="Conta Corrente" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="todas">Todas as Contas</SelectItem>
                    {contasCorrentes.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.nome} ({conta.banco})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de Situação */}
              <div className="col-span-1">
                <Select 
                  value={situacao} 
                  onValueChange={(value: string) => setSituacao(value as "todos" | "conciliado" | "nao_conciliado")}
                >
                  <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                    <Filter className="mr-2 h-5 w-5 text-neutral-400" />
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="todos">Todas as Situações</SelectItem>
                    <SelectItem value="conciliado">Conciliado</SelectItem>
                    <SelectItem value="nao_conciliado">Não Conciliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro de Data Inicial */}
              <div>
                <DateInput label="Data Inicial" value={dataInicial} onChange={setDataInicial} />
              </div>

              {/* Filtro de Data Final */}
              <div>
                <DateInput label="Data Final" value={dataFinal} onChange={setDataFinal} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="space-y-1">
            <h3 className="text-lg font-semibold">Total de Entradas</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalEntradas)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1">
            <h3 className="text-lg font-semibold">Total de Saídas</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalSaidas)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-1">
            <h3 className="text-lg font-semibold">Saldo Final</h3>
            <p
              className={`text-2xl font-bold ${
                saldoFinal >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(saldoFinal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Fluxo de Caixa */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Conta Corrente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFluxoCaixa.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.data_movimentacao)}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>
                  {item.contas_correntes?.nome} ({item.contas_correntes?.banco})
                </TableCell>
                <TableCell>
                  {item.tipo_operacao === "receber" ? "Entrada" : "Saída"}
                </TableCell>
                <TableCell>{item.forma_pagamento}</TableCell>
                <TableCell>{item.situacao}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          navigate(`/financeiro/incluir-movimentacao`, {
                            state: { id: item.movimentacao_id },
                          })
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Conciliar Lançamento (Em breve)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
