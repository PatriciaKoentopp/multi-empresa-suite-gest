
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, FilterIcon, Calendar as CalendarIcon } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

type Cliente = {
  id: string;
  nome: string;
  nome_fantasia: string;
  totalVendas: number;
  quantidadeCompras: number;
  ticketMedio: number;
  ultimaCompra: string;
  frequenciaCompra: number;
  classificacao: "A" | "B" | "C";
};

export default function ClassificacaoABC() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 12));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  const calculateFrequency = (totalDays: number, quantidadeCompras: number): number => {
    if (quantidadeCompras <= 1) return 0;
    return Math.round(totalDays / (quantidadeCompras - 1) / 30);
  };

  const classifyCustomers = (data: Cliente[]): Cliente[] => {
    // Ordenar por valor total de vendas (decrescente)
    const sortedData = [...data].sort((a, b) => b.totalVendas - a.totalVendas);
    
    const totalVendas = sortedData.reduce((sum, cliente) => sum + cliente.totalVendas, 0);
    let acumulado = 0;
    
    return sortedData.map(cliente => {
      acumulado += cliente.totalVendas;
      const percentual = acumulado / totalVendas;
      
      let classificacao: "A" | "B" | "C";
      if (percentual <= 0.8) {
        classificacao = "A";
      } else if (percentual <= 0.95) {
        classificacao = "B";
      } else {
        classificacao = "C";
      }
      
      return {
        ...cliente,
        classificacao
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Primeiro, buscar todas as vendas no período
      const { data: vendas, error: vendasError } = await supabase
        .from("orcamentos")
        .select("id, data_venda, favorecido_id, favorecido:favorecidos(id, nome, nome_fantasia)")
        .eq("tipo", "venda")
        .eq("status", "ativo")
        .gte("data_venda", format(startDate, "yyyy-MM-dd"))
        .lte("data_venda", format(endDate, "yyyy-MM-dd"));

      if (vendasError) throw vendasError;

      // Buscar os itens de cada venda para calcular o valor total
      const { data: itens, error: itensError } = await supabase
        .from("orcamentos_itens")
        .select("orcamento_id, valor");

      if (itensError) throw itensError;

      // Mapear vendas por cliente
      const clientesMap = new Map();
      
      vendas.forEach(venda => {
        if (!venda.favorecido) return;
        
        const clienteId = venda.favorecido.id;
        const clienteNome = venda.favorecido.nome;
        const clienteNomeFantasia = venda.favorecido.nome_fantasia || venda.favorecido.nome;
        const dataVenda = venda.data_venda;
        
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            id: clienteId,
            nome: clienteNome,
            nome_fantasia: clienteNomeFantasia,
            totalVendas: 0,
            quantidadeCompras: 0,
            vendas: [],
            ultimaCompra: null
          });
        }
        
        const vendaItens = itens.filter(item => item.orcamento_id === venda.id);
        const valorTotal = vendaItens.reduce((sum, item) => sum + item.valor, 0);
        
        const cliente = clientesMap.get(clienteId);
        cliente.totalVendas += valorTotal;
        cliente.quantidadeCompras += 1;
        cliente.vendas.push({
          data: dataVenda,
          valor: valorTotal
        });
        
        if (!cliente.ultimaCompra || new Date(dataVenda) > new Date(cliente.ultimaCompra)) {
          cliente.ultimaCompra = dataVenda;
        }
      });
      
      // Calcular as métricas para cada cliente
      const clientesList = Array.from(clientesMap.values()).map(cliente => {
        const ticketMedio = cliente.totalVendas / cliente.quantidadeCompras;
        const totalDays = Math.max(1, Math.round((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
        const frequenciaCompra = calculateFrequency(totalDays, cliente.quantidadeCompras);
        
        return {
          id: cliente.id,
          nome: cliente.nome,
          nome_fantasia: cliente.nome_fantasia,
          totalVendas: cliente.totalVendas,
          quantidadeCompras: cliente.quantidadeCompras,
          ticketMedio: ticketMedio,
          ultimaCompra: cliente.ultimaCompra,
          frequenciaCompra: frequenciaCompra,
          classificacao: "C" as "A" | "B" | "C" // será atualizado na classificação
        };
      });
      
      const classificados = classifyCustomers(clientesList);
      setClientes(classificados);
      setFilteredClientes(classificados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(cliente => 
        cliente.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  const exportToCSV = () => {
    // Preparar os dados
    const headers = [
      "Cliente",
      "Classificação",
      "Vendas",
      "Qtde",
      "Ticket",
      "Frequência (meses)",
      "Última Compra"
    ].join(";");

    const rows = filteredClientes.map(cliente => [
      cliente.nome_fantasia,
      cliente.classificacao,
      cliente.totalVendas.toFixed(2).replace(".", ","),
      cliente.quantidadeCompras,
      cliente.ticketMedio.toFixed(2).replace(".", ","),
      cliente.frequenciaCompra,
      cliente.ultimaCompra ? formatDate(cliente.ultimaCompra) : "-"
    ].join(";"));

    const csvContent = [headers, ...rows].join("\n");
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `classificacao_abc_clientes_${format(new Date(), "dd-MM-yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotaisPorClassificacao = () => {
    const totais = {
      A: { clientes: 0, vendas: 0 },
      B: { clientes: 0, vendas: 0 },
      C: { clientes: 0, vendas: 0 }
    };
    
    clientes.forEach(cliente => {
      totais[cliente.classificacao].clientes++;
      totais[cliente.classificacao].vendas += cliente.totalVendas;
    });
    
    return totais;
  };
  
  const totaisPorClassificacao = getTotaisPorClassificacao();
  const totalVendas = clientes.reduce((sum, cliente) => sum + cliente.totalVendas, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classificação ABC de Clientes</h1>
          <p className="text-muted-foreground">
            Análise de clientes por volume de vendas e frequência de compra
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Classe A
              <Badge className="ml-2 bg-green-500">
                {Math.round((totaisPorClassificacao.A.vendas / totalVendas) * 100)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisPorClassificacao.A.clientes} clientes</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totaisPorClassificacao.A.vendas)} em vendas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Classe B
              <Badge className="ml-2 bg-blue-500">
                {Math.round((totaisPorClassificacao.B.vendas / totalVendas) * 100)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisPorClassificacao.B.clientes} clientes</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totaisPorClassificacao.B.vendas)} em vendas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Classe C
              <Badge className="ml-2 bg-orange-500">
                {Math.round((totaisPorClassificacao.C.vendas / totalVendas) * 100)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totaisPorClassificacao.C.clientes} clientes</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totaisPorClassificacao.C.vendas)} em vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">De:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[200px]",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => setStartDate(date || new Date())}
                disabled={(date) =>
                  date > new Date() || (endDate ? date > endDate : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Até:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[200px]",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => setEndDate(date || new Date())}
                disabled={(date) =>
                  date > new Date() || (startDate ? date < startDate : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1">
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead className="text-right">Vendas</TableHead>
              <TableHead className="text-right">Qtde</TableHead>
              <TableHead className="text-right">Ticket</TableHead>
              <TableHead className="text-right">Frequência (meses)</TableHead>
              <TableHead>Última Compra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-6 w-[220px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                  </TableRow>
                ))
            ) : filteredClientes.length > 0 ? (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.nome_fantasia || cliente.nome}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        cliente.classificacao === "A"
                          ? "bg-green-500"
                          : cliente.classificacao === "B"
                          ? "bg-blue-500"
                          : "bg-orange-500"
                      )}
                    >
                      {cliente.classificacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(cliente.totalVendas)}
                  </TableCell>
                  <TableCell className="text-right">{cliente.quantidadeCompras}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(cliente.ticketMedio)}
                  </TableCell>
                  <TableCell className="text-right">
                    {cliente.frequenciaCompra > 0 ? cliente.frequenciaCompra : "-"}
                  </TableCell>
                  <TableCell>
                    {cliente.ultimaCompra ? formatDate(cliente.ultimaCompra) : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
