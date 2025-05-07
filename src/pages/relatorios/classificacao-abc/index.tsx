
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/movimentacao/DateInput";
import { Download } from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  totalVendas: number;
  quantidade: number;
  ticketMedio: number;
  frequencia: number;
  classificacao: "A" | "B" | "C";
}

export default function ClassificacaoABC() {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [classificacaoFiltro, setClassificacaoFiltro] = useState<string>("todos");
  
  // Dados simulados para demonstração
  const clientes: Cliente[] = [
    {
      id: "1",
      nome: "Empresa ABC Ltda.",
      totalVendas: 120000,
      quantidade: 42,
      ticketMedio: 2857.14,
      frequencia: 1,
      classificacao: "A"
    },
    {
      id: "2",
      nome: "Comércio XYZ",
      totalVendas: 85000,
      quantidade: 36,
      ticketMedio: 2361.11,
      frequencia: 2,
      classificacao: "A"
    },
    {
      id: "3",
      nome: "Indústria Nacional",
      totalVendas: 65000,
      quantidade: 28,
      ticketMedio: 2321.43,
      frequencia: 2,
      classificacao: "B"
    },
    {
      id: "4",
      nome: "Distribuidora Central",
      totalVendas: 45000,
      quantidade: 25,
      ticketMedio: 1800,
      frequencia: 3,
      classificacao: "B"
    },
    {
      id: "5",
      nome: "Pequeno Varejo Ltda.",
      totalVendas: 25000,
      quantidade: 15,
      ticketMedio: 1666.67,
      frequencia: 4,
      classificacao: "C"
    }
  ];

  const clientesFiltrados = clientes.filter(cliente => {
    if (classificacaoFiltro !== "todos") {
      return cliente.classificacao === classificacaoFiltro;
    }
    return true;
  });

  const exportarCSV = () => {
    // Implementação de exportação para CSV
    const headers = ["Nome", "Total de Vendas", "Quantidade", "Ticket Médio", "Frequência (meses)", "Classificação"];
    const dados = clientesFiltrados.map(cliente => [
      cliente.nome,
      cliente.totalVendas.toFixed(2),
      cliente.quantidade.toString(),
      cliente.ticketMedio.toFixed(2),
      cliente.frequencia.toString(),
      cliente.classificacao
    ]);
    
    const csvContent = [
      headers.join(","),
      ...dados.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "classificacao_abc_clientes.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Classificação ABC de Clientes</h1>
        <p className="text-muted-foreground">
          Analise o valor e frequência de compra dos clientes para melhor gestão de relacionamento
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <DateInput
              label="Data Início"
              value={dataInicio}
              onChange={setDataInicio}
            />
            <DateInput
              label="Data Fim"
              value={dataFim}
              onChange={setDataFim}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Classificação</label>
              <Select value={classificacaoFiltro} onValueChange={setClassificacaoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resultados</h2>
        <Button variant="outline" onClick={exportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total de Vendas</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Frequência (meses)</TableHead>
                <TableHead>Classificação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell className="text-right">R$ {cliente.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">{cliente.quantidade}</TableCell>
                  <TableCell className="text-right">R$ {cliente.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">{cliente.frequencia}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${cliente.classificacao === 'A' ? 'bg-green-100 text-green-800' : 
                        cliente.classificacao === 'B' ? 'bg-blue-100 text-blue-800' : 
                        'bg-amber-100 text-amber-800'}`}>
                      {cliente.classificacao}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
