
import { useEffect, useState } from "react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, FileDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface Cliente {
  id: string;
  nome: string;
  totalVendas: number;
  quantidadeVendas: number;
  ticketMedio: number;
  frequenciaCompra: number;
  primeiraCompra: string;
  ultimaCompra: string;
  classificacao: string;
  percentualFaturamento: number;
  percentualAcumulado: number;
}

export default function ClassificacaoABC() {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [totalFaturamento, setTotalFaturamento] = useState(0);
  
  // Filtros
  const [dataInicial, setDataInicial] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1) // Primeiro dia do ano atual
  );
  const [dataFinal, setDataFinal] = useState<Date | undefined>(new Date());
  const [busca, setBusca] = useState("");
  const [classificacaoFiltro, setClassificacaoFiltro] = useState<string[]>([]);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarDados();
    }
  }, [currentCompany?.id, dataInicial, dataFinal]);

  useEffect(() => {
    aplicarFiltros();
  }, [clientes, busca, classificacaoFiltro]);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // Validar datas
      if (!dataInicial || !dataFinal) {
        toast({
          title: "Data inválida",
          description: "Selecione um período de datas válido",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Formatar datas para o formato ISO (YYYY-MM-DD)
      const dataInicialFormatada = format(dataInicial, "yyyy-MM-dd");
      const dataFinalFormatada = format(dataFinal, "yyyy-MM-dd");

      // Buscar as vendas no período selecionado
      const { data: vendas, error: vendasError } = await supabase
        .from("orcamentos")
        .select(`
          id,
          data_venda,
          favorecido_id,
          favorecido:favorecidos(id, nome),
          orcamentos_itens(valor)
        `)
        .eq("empresa_id", currentCompany.id)
        .eq("tipo", "venda")
        .eq("status", "ativo")
        .gte("data_venda", dataInicialFormatada)
        .lte("data_venda", dataFinalFormatada)
        .order("data_venda", { ascending: true });

      if (vendasError) throw vendasError;

      // Processar vendas para agrupar por cliente
      const clientesMap: Record<string, any> = {};
      let somaTotal = 0;

      if (vendas && vendas.length > 0) {
        vendas.forEach(venda => {
          const favorecidoId = venda.favorecido_id;
          const favorecidoNome = venda.favorecido?.nome || "Cliente não identificado";
          const dataVenda = venda.data_venda;
          
          // Calcular o valor total da venda
          const valorVenda = venda.orcamentos_itens.reduce(
            (acc, item) => acc + Number(item.valor || 0),
            0
          );

          somaTotal += valorVenda;

          // Se o cliente não está no mapa, inicializá-lo
          if (!clientesMap[favorecidoId]) {
            clientesMap[favorecidoId] = {
              id: favorecidoId,
              nome: favorecidoNome,
              totalVendas: 0,
              quantidadeVendas: 0,
              primeiraCompra: dataVenda,
              ultimaCompra: dataVenda,
              dataCompras: [dataVenda], // Array com as datas de compra
              classificacao: "",
              percentualFaturamento: 0,
              percentualAcumulado: 0
            };
          }

          // Atualizar dados do cliente
          clientesMap[favorecidoId].totalVendas += valorVenda;
          clientesMap[favorecidoId].quantidadeVendas += 1;
          
          // Atualizar primeira e última compra
          if (dataVenda < clientesMap[favorecidoId].primeiraCompra) {
            clientesMap[favorecidoId].primeiraCompra = dataVenda;
          }
          if (dataVenda > clientesMap[favorecidoId].ultimaCompra) {
            clientesMap[favorecidoId].ultimaCompra = dataVenda;
          }
          
          // Adicionar a data da compra ao array (sem duplicatas)
          if (!clientesMap[favorecidoId].dataCompras.includes(dataVenda)) {
            clientesMap[favorecidoId].dataCompras.push(dataVenda);
          }
        });

        // Calcular ticket médio e frequência de compra para cada cliente
        Object.values(clientesMap).forEach((cliente: any) => {
          // Ticket médio
          cliente.ticketMedio = cliente.totalVendas / cliente.quantidadeVendas;
          
          // Frequência de compra (em meses)
          // Calcular o intervalo médio entre compras
          if (cliente.dataCompras.length > 1) {
            const datasOrdenadas = cliente.dataCompras.sort();
            const primeiraData = new Date(datasOrdenadas[0]);
            const ultimaData = new Date(datasOrdenadas[datasOrdenadas.length - 1]);
            const mesesTotal = (ultimaData.getTime() - primeiraData.getTime()) / (1000 * 60 * 60 * 24 * 30);
            cliente.frequenciaCompra = mesesTotal / (cliente.dataCompras.length - 1);
          } else {
            cliente.frequenciaCompra = 0; // Comprou apenas uma vez
          }
          
          // Calcular percentual do faturamento
          cliente.percentualFaturamento = (cliente.totalVendas / somaTotal) * 100;
        });

        // Ordenar clientes por valor total de vendas (decrescente)
        const clientesOrdenados = Object.values(clientesMap).sort(
          (a: any, b: any) => b.totalVendas - a.totalVendas
        );

        // Calcular percentual acumulado e classificação ABC
        let percentualAcumulado = 0;
        clientesOrdenados.forEach((cliente: any) => {
          percentualAcumulado += cliente.percentualFaturamento;
          cliente.percentualAcumulado = percentualAcumulado;
          
          // Classificação ABC
          if (percentualAcumulado <= 80) {
            cliente.classificacao = "A";
          } else if (percentualAcumulado <= 95) {
            cliente.classificacao = "B";
          } else {
            cliente.classificacao = "C";
          }
        });

        setClientes(clientesOrdenados as Cliente[]);
        setTotalFaturamento(somaTotal);
      } else {
        setClientes([]);
        setTotalFaturamento(0);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao buscar os dados dos clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...clientes];

    // Aplicar filtro de busca
    if (busca) {
      resultado = resultado.filter(cliente => 
        cliente.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Aplicar filtro de classificação
    if (classificacaoFiltro.length > 0) {
      resultado = resultado.filter(cliente => 
        classificacaoFiltro.includes(cliente.classificacao)
      );
    }

    setFilteredClientes(resultado);
  };

  const toggleClassificacaoFiltro = (classificacao: string) => {
    setClassificacaoFiltro(prev => {
      if (prev.includes(classificacao)) {
        return prev.filter(item => item !== classificacao);
      } else {
        return [...prev, classificacao];
      }
    });
  };

  const limparFiltros = () => {
    setBusca("");
    setClassificacaoFiltro([]);
  };

  const exportarCSV = () => {
    // Criar cabeçalho do CSV
    const cabecalho = "Nome,Total Vendas,Quantidade Vendas,Ticket Médio,Frequência (meses),Primeira Compra,Última Compra,Classificação,% Faturamento,% Acumulado\n";
    
    // Criar linhas de dados
    const linhas = filteredClientes.map(cliente => {
      return [
        `"${cliente.nome}"`, // Nome entre aspas para evitar problemas com vírgulas
        cliente.totalVendas.toFixed(2).replace(".", ","),
        cliente.quantidadeVendas,
        cliente.ticketMedio.toFixed(2).replace(".", ","),
        cliente.frequenciaCompra.toFixed(2).replace(".", ","),
        formatDate(cliente.primeiraCompra),
        formatDate(cliente.ultimaCompra),
        cliente.classificacao,
        cliente.percentualFaturamento.toFixed(2).replace(".", ","),
        cliente.percentualAcumulado.toFixed(2).replace(".", ",")
      ].join(",");
    }).join("\n");
    
    // Combinar cabeçalho e linhas
    const csv = cabecalho + linhas;
    
    // Criar blob e link para download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `classificacao-abc-clientes_${format(new Date(), "dd-MM-yyyy")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getClassificacaoBadge = (classificacao: string) => {
    switch (classificacao) {
      case "A":
        return <Badge className="bg-green-500 hover:bg-green-600">A</Badge>;
      case "B":
        return <Badge className="bg-blue-500 hover:bg-blue-600">B</Badge>;
      case "C":
        return <Badge className="bg-amber-500 hover:bg-amber-600">C</Badge>;
      default:
        return <Badge>{classificacao}</Badge>;
    }
  };

  const getResumoClassificacao = (tipo: string) => {
    const clientesFiltrados = clientes.filter(c => c.classificacao === tipo);
    const quantidade = clientesFiltrados.length;
    const percentualClientes = (quantidade / clientes.length) * 100;
    const valorTotal = clientesFiltrados.reduce((acc, cliente) => acc + cliente.totalVendas, 0);
    const percentualFaturamento = (valorTotal / totalFaturamento) * 100;

    return {
      quantidade,
      percentualClientes,
      valorTotal,
      percentualFaturamento
    };
  };

  const dadosA = getResumoClassificacao("A");
  const dadosB = getResumoClassificacao("B");
  const dadosC = getResumoClassificacao("C");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classificação ABC de Clientes</h1>
          <p className="text-muted-foreground">
            Análise de clientes por volume de compras, frequência e ticket médio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportarCSV()}
            disabled={isLoading || filteredClientes.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm">Inicial</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {dataInicial ? (
                              format(dataInicial, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={ptBR}
                            mode="single"
                            selected={dataInicial}
                            onSelect={setDataInicial}
                            disabled={(date) => date > new Date() || (dataFinal ? date > dataFinal : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm">Final</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {dataFinal ? (
                              format(dataFinal, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={ptBR}
                            mode="single"
                            selected={dataFinal}
                            onSelect={setDataFinal}
                            disabled={(date) => date > new Date() || (dataInicial ? date < dataInicial : false)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Busca por nome</Label>
                  <Input
                    placeholder="Pesquisar cliente"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Classificação</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={`cursor-pointer ${classificacaoFiltro.includes("A") ? "bg-green-500" : "bg-gray-300 text-gray-700"}`}
                      onClick={() => toggleClassificacaoFiltro("A")}
                    >
                      A
                    </Badge>
                    <Badge
                      className={`cursor-pointer ${classificacaoFiltro.includes("B") ? "bg-blue-500" : "bg-gray-300 text-gray-700"}`}
                      onClick={() => toggleClassificacaoFiltro("B")}
                    >
                      B
                    </Badge>
                    <Badge
                      className={`cursor-pointer ${classificacaoFiltro.includes("C") ? "bg-amber-500" : "bg-gray-300 text-gray-700"}`}
                      onClick={() => toggleClassificacaoFiltro("C")}
                    >
                      C
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      carregarDados();
                    }}
                  >
                    Aplicar
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={limparFiltros}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge className="bg-green-500">A</Badge> Clientes A
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{dadosA.quantidade} ({dadosA.percentualClientes.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="font-medium">{formatCurrency(dadosA.valorTotal)} ({dadosA.percentualFaturamento.toFixed(1)}%)</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge className="bg-blue-500">B</Badge> Clientes B
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{dadosB.quantidade} ({dadosB.percentualClientes.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="font-medium">{formatCurrency(dadosB.valorTotal)} ({dadosB.percentualFaturamento.toFixed(1)}%)</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge className="bg-amber-500">C</Badge> Clientes C
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className="font-medium">{dadosC.quantidade} ({dadosC.percentualClientes.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="font-medium">{formatCurrency(dadosC.valorTotal)} ({dadosC.percentualFaturamento.toFixed(1)}%)</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barra de filtros rápidos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar cliente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-[300px]"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className={`cursor-pointer ${classificacaoFiltro.includes("A") ? "bg-green-500" : "bg-gray-300 text-gray-700"}`}
            onClick={() => toggleClassificacaoFiltro("A")}
          >
            A
          </Badge>
          <Badge
            className={`cursor-pointer ${classificacaoFiltro.includes("B") ? "bg-blue-500" : "bg-gray-300 text-gray-700"}`}
            onClick={() => toggleClassificacaoFiltro("B")}
          >
            B
          </Badge>
          <Badge
            className={`cursor-pointer ${classificacaoFiltro.includes("C") ? "bg-amber-500" : "bg-gray-300 text-gray-700"}`}
            onClick={() => toggleClassificacaoFiltro("C")}
          >
            C
          </Badge>
          {(busca || classificacaoFiltro.length > 0) && (
            <Button variant="ghost" size="sm" onClick={limparFiltros}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle>Clientes ({filteredClientes.length})</CardTitle>
            <div className="text-sm text-muted-foreground">
              Período: {dataInicial ? format(dataInicial, "dd/MM/yyyy") : "N/A"} até {dataFinal ? format(dataFinal, "dd/MM/yyyy") : "N/A"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Qt. Vendas</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Frequência (meses)</TableHead>
                <TableHead className="text-center">Primeira Compra</TableHead>
                <TableHead className="text-center">Última Compra</TableHead>
                <TableHead className="text-center">Classificação</TableHead>
                <TableHead className="text-right">% Faturamento</TableHead>
                <TableHead className="text-right">% Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={10}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Nenhum cliente encontrado para o período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cliente.totalVendas)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.quantidadeVendas}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cliente.ticketMedio)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.frequenciaCompra === 0 
                        ? "Compra única" 
                        : cliente.frequenciaCompra.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(cliente.primeiraCompra)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(cliente.ultimaCompra)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getClassificacaoBadge(cliente.classificacao)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.percentualFaturamento.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.percentualAcumulado.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
