import { useState, useMemo } from "react";
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

// Dados mockados de contas correntes e extrato
const mockContasCorrentes = [
  { id: "1", nome: "Conta Principal" },
  { id: "2", nome: "Conta Pagamentos" },
  { id: "3", nome: "Conta Recebimentos" },
];

const mockExtrato = [
  {
    id: "1",
    data: "2024-04-01",
    favorecido: "Fornecedor ABC",
    descricao: "Compra de Material",
    formaPagamento: "Transferência",
    situacao: "conciliado",
    valor: -800.0,
    saldo: 2500.0,
  },
  {
    id: "2",
    data: "2024-04-03",
    favorecido: "Cliente Gama",
    descricao: "Recebimento Serviço",
    formaPagamento: "Boleto",
    situacao: "conciliado",
    valor: 2200.0,
    saldo: 4700.0,
  },
  {
    id: "3",
    data: "2024-04-05",
    favorecido: "Fornecedor XPTO",
    descricao: "Pagamento Manutenção",
    formaPagamento: "Pix",
    situacao: "nao_conciliado",
    valor: -950.0,
    saldo: 3750.0,
  },
  {
    id: "4",
    data: "2024-03-25",
    favorecido: "Empresa Beta",
    descricao: "Recebimento Venda",
    formaPagamento: "Dinheiro",
    situacao: "conciliado",
    valor: 1900.0,
    saldo: 4100.0,
  },
];

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

function getStatusBadge(status: "conciliado" | "nao_conciliado") {
  if (status === "conciliado") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
        Conciliado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
      Não Conciliado
    </span>
  );
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

export default function FluxoCaixaPage() {
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("1");
  const [periodo, setPeriodo] = useState<"mes_atual" | "mes_anterior" | "personalizado">("mes_atual");
  const [dataInicial, setDataInicial] = useState<Date | undefined>(undefined);
  const [dataFinal, setDataFinal] = useState<Date | undefined>(undefined);
  const [situacao, setSituacao] = useState<"todos" | "conciliado" | "nao_conciliado">("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Controle dos campos de data (no formato DD/MM/YYYY)
  const [dataInicialStr, setDataInicialStr] = useState("");
  const [dataFinalStr, setDataFinalStr] = useState("");

  // Corrigir atualização das datas ao mudar o período usando useEffect
  // Sempre que o período mudar, atualizar datas e campos se não for personalizado
  import { useEffect } from "react";
  useEffect(() => {
    const hoje = new Date();
    if (periodo === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    } else if (periodo === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicial(inicio);
      setDataInicialStr(dateToBR(inicio));
      setDataFinal(fim);
      setDataFinalStr(dateToBR(fim));
    } else if (periodo === "personalizado") {
      // Ao trocar para personalizado, limpa os campos (mantém o controle para digitação manual)
      setDataInicial(undefined);
      setDataInicialStr("");
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }, [periodo]);

  // Função de conciliação mockada
  function handleConciliar(id: string) {
    toast.success("Movimento conciliado!");
    // Aqui atualizaria o status no extrato real.
  }

  // Mantém sincronização interno quando estado muda por calendário
  function setDataInicialBR(date?: Date) {
    setDataInicial(date);
    setDataInicialStr(dateToBR(date));
  }
  function setDataFinalBR(date?: Date) {
    setDataFinal(date);
    setDataFinalStr(dateToBR(date));
  }

  // Ajusta datas ao selecionar período
  function handlePeriodoChange(v: "mes_atual" | "mes_anterior" | "personalizado") {
    setPeriodo(v);
    const hoje = new Date();
    if (v === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicialBR(inicio);
      setDataFinalBR(fim);
    } else if (v === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicialBR(inicio);
      setDataFinalBR(fim);
    } else {
      setDataInicial(undefined);
      setDataInicialStr("");
      setDataFinal(undefined);
      setDataFinalStr("");
    }
  }

  // Filtro do extrato mockado
  const filteredExtrato = useMemo(() => {
    return mockExtrato.filter((linha) => {
      const buscaOk =
        linha.favorecido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        linha.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const sitOk = situacao === "todos" || linha.situacao === situacao;
      // Conta corrente (mock não diferencia, mas poderia filtrar por id se necessário)
      const dataLinha = new Date(
        linha.data.substring(0, 4) +
          "-" +
          linha.data.substring(5, 7) +
          "-" +
          linha.data.substring(8, 10)
      );
      const dataIniOk = !dataInicial || dataLinha >= dataInicial;
      const dataFimOk = !dataFinal || dataLinha <= dataFinal;
      return buscaOk && sitOk && dataIniOk && dataFimOk;
    });
  }, [searchTerm, situacao, dataInicial, dataFinal]);

  function handleEdit(id: string) {
    toast.info("Ação de editar: " + id);
    // Abre incluir-movimentacao para edição
    navigate("/financeiro/incluir-movimentacao", { state: { id } });
  }

  function handleDelete(id: string) {
    toast.success("Lançamento excluído!");
    // Aqui faria lógica de exclusão real do extrato, se não fosse mock.
  }

  // Função para strings das datas nos inputs (formato dd/mm/aaaa)
  function valueDateInput(date?: Date) {
    if (!date) return "";
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  }
  function valueDatePlaceholder(date?: Date) {
    if (!date) return "";
    return format(date, "dd/MM/yyyy");
  }
  function parseDateFromInput(value: string): Date | undefined {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map((v) => Number(v));
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  }

  return (
    <div className="space-y-4">
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
          {/* Filtros: novo layout, grid 5 colunas, todos alinhados */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Conta Corrente */}
            <div className="col-span-1">
              <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
                <SelectTrigger className="w-full bg-white border rounded-lg h-[52px] shadow-sm pl-4 text-base font-normal">
                  <Filter className="mr-2 h-5 w-5 text-neutral-400" />
                  <SelectValue placeholder="Conta Corrente" />
                </SelectTrigger>
                <SelectContent className="bg-white border">
                  {mockContasCorrentes.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Período */}
            <div className="col-span-1">
              <Select value={periodo} onValueChange={(v) => handlePeriodoChange(v as any)}>
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
                  onChange={e => {
                    let val = maskDateInput(e.target.value);
                    setDataInicialStr(val);
                    const dt = brToDate(val);
                    setDataInicial(dt);
                  }}
                  onFocus={e => {
                    if (!dataInicialStr) setDataInicialStr("");
                  }}
                  onBlur={e => {
                    // Se não for válido e não vazio, limpa a data e campo
                    if (e.target.value && !brToDate(e.target.value)) {
                      setDataInicial(undefined);
                      setDataInicialStr("");
                    }
                  }}
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
                  onChange={e => {
                    let val = maskDateInput(e.target.value);
                    setDataFinalStr(val);
                    const dt = brToDate(val);
                    setDataFinal(dt);
                  }}
                  onFocus={e => {
                    if (!dataFinalStr) setDataFinalStr("");
                  }}
                  onBlur={e => {
                    if (e.target.value && !brToDate(e.target.value)) {
                      setDataFinal(undefined);
                      setDataFinalStr("");
                    }
                  }}
                  style={{ minHeight: 52 }}
                  autoComplete="off"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
            {/* Situação */}
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
                    <TableHead>Valor</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="text-center w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExtrato.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        Nenhum resultado encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExtrato.map((linha) => (
                      <TableRow key={linha.id}>
                        <TableCell>{formatDateBR(linha.data)}</TableCell>
                        <TableCell>{linha.favorecido}</TableCell>
                        <TableCell>{linha.descricao}</TableCell>
                        <TableCell>{linha.formaPagamento}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            linha.situacao === "conciliado"
                              ? "conciliado"
                              : "nao_conciliado"
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(linha.valor)}</TableCell>
                        <TableCell>{formatCurrency(linha.saldo)}</TableCell>
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
                            <DropdownMenuContent className="bg-white z-50 min-w-[160px]">
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
                              {linha.situacao !== "conciliado" && (
                                <DropdownMenuItem
                                  onClick={() => handleConciliar(linha.id)}
                                  className="cursor-pointer"
                                >
                                  <span className="text-green-600 mr-2"><Check className="inline" size={16} /></span>
                                  Conciliar movimento
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
