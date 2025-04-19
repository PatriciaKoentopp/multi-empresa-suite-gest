
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Filter, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    valor: -800.00,
    saldo: 2500.00,
  },
  {
    id: "2",
    data: "2024-04-03",
    favorecido: "Cliente Gama",
    descricao: "Recebimento Serviço",
    formaPagamento: "Boleto",
    situacao: "conciliado",
    valor: 2200.00,
    saldo: 4700.00,
  },
  {
    id: "3",
    data: "2024-04-05",
    favorecido: "Fornecedor XPTO",
    descricao: "Pagamento Manutenção",
    formaPagamento: "Pix",
    situacao: "nao_conciliado",
    valor: -950.00,
    saldo: 3750.00,
  },
  {
    id: "4",
    data: "2024-03-25",
    favorecido: "Empresa Beta",
    descricao: "Recebimento Venda",
    formaPagamento: "Dinheiro",
    situacao: "conciliado",
    valor: 1900.00,
    saldo: 4100.00,
  }
];

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

export default function FluxoCaixaPage() {
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<"mes_atual" | "mes_anterior" | "personalizado">("mes_atual");
  const [dataInicial, setDataInicial] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [situacao, setSituacao] = useState<"todos"|"conciliado"|"nao_conciliado">("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Filtro de extrato mockado apenas para exibir funcionalidade
  const filteredExtrato = useMemo(() => {
    return mockExtrato.filter(linha => {
      const buscaOk = (
        linha.favorecido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        linha.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Situação
      const sitOk = situacao === "todos" || linha.situacao === situacao;
      // Conta corrente (mock não diferencia, mas poderia filtrar por id)
      // Data
      const dataLinha = linha.data;
      const dataIniOk = !dataInicial || dataLinha >= dataInicial;
      const dataFimOk = !dataFinal || dataLinha <= dataFinal;
      return buscaOk && sitOk && dataIniOk && dataFimOk;
    });
  }, [searchTerm, situacao, dataInicial, dataFinal]);

  function handleEdit(id: string) {
    toast.info("Ação de editar: " + id);
    navigate("/financeiro/incluir-movimentacao", { state: { id } });
  }

  function handleDelete(id: string) {
    toast.success("Lançamento excluído!");
    // Aqui faria lógica de exclusão real do extrato, se não fosse mock.
  }

  // Manipular seleção de período para setar datas padrão
  function handlePeriodoChange(v: "mes_atual" | "mes_anterior" | "personalizado") {
    setPeriodo(v);
    const hoje = new Date();
    if (v === "mes_atual") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setDataInicial(inicio.toISOString().slice(0, 10));
      setDataFinal(fim.toISOString().slice(0, 10));
    } else if (v === "mes_anterior") {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      setDataInicial(inicio.toISOString().slice(0, 10));
      setDataFinal(fim.toISOString().slice(0, 10));
    } else {
      setDataInicial("");
      setDataFinal("");
    }
  }

  // Inicia com datas do mês atual
  if (!dataInicial && !dataFinal && periodo === "mes_atual") {
    handlePeriodoChange("mes_atual");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
        <Button 
          variant="blue"
          onClick={() => navigate("/financeiro/incluir-movimentacao")}
        >
          Nova Movimentação
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {/* Linha 1 filtros: conta, período, situação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 min-w-[180px]">
              <Select
                value={contaCorrenteId}
                onValueChange={setContaCorrenteId}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Conta Corrente" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todos">Todas Contas</SelectItem>
                  {mockContasCorrentes.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 min-w-[180px]">
              <Select
                value={periodo}
                onValueChange={v => handlePeriodoChange(v as any)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="mes_atual">Mês Atual</SelectItem>
                  <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                  <SelectItem value="personalizado">Selecionar Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 flex flex-row gap-2">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Data Inicial</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataInicial}
                  onChange={e => setDataInicial(e.target.value)}
                  disabled={periodo !== "personalizado"}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-medium">Data Final</label>
                <Input
                  type="date"
                  className="min-w-[120px] max-w-[140px]"
                  value={dataFinal}
                  onChange={e => setDataFinal(e.target.value)}
                  disabled={periodo !== "personalizado"}
                />
              </div>
            </div>
            <div className="col-span-1 min-w-[160px]">
              <Select
                value={situacao}
                onValueChange={v => setSituacao(v as any)}
              >
                <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="conciliado" className="text-green-600">Conciliados</SelectItem>
                  <SelectItem value="nao_conciliado" className="text-blue-600">Não Conciliados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Linha de busca opcional abaixo */}
          <div className="mt-4 flex flex-row gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <button
                type="button"
                className="absolute left-3 top-3 z-10 p-0 m-0 bg-transparent border-none cursor-pointer text-muted-foreground"
                style={{ lineHeight: 0 }}
                tabIndex={-1}
                aria-label="Buscar"
                onClick={() => document.getElementById("busca-extrato")?.focus()}
              >
                <Search className="h-5 w-5" />
              </button>
              <Input
                id="busca-extrato"
                placeholder="Buscar favorecido ou descrição"
                className="pl-10 bg-white border-gray-300 shadow-sm focus:bg-white min-w-[180px] w-full"
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
                    filteredExtrato.map(linha => (
                      <TableRow key={linha.id}>
                        <TableCell>{formatDateBR(linha.data)}</TableCell>
                        <TableCell>{linha.favorecido}</TableCell>
                        <TableCell>{linha.descricao}</TableCell>
                        <TableCell>{linha.formaPagamento}</TableCell>
                        <TableCell>{getStatusBadge(linha.situacao)}</TableCell>
                        <TableCell>{formatCurrency(linha.valor)}</TableCell>
                        <TableCell>{formatCurrency(linha.saldo)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-500 hover:bg-blue-100"
                              onClick={() => handleEdit(linha.id)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-100"
                              onClick={() => handleDelete(linha.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
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
