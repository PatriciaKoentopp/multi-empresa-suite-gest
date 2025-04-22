
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock dos meses e anos
const meses = [
  { label: "Janeiro", value: "01" },
  { label: "Fevereiro", value: "02" },
  { label: "Março", value: "03" },
  { label: "Abril", value: "04" },
  { label: "Maio", value: "05" },
  { label: "Junho", value: "06" },
  { label: "Julho", value: "07" },
  { label: "Agosto", value: "08" },
  { label: "Setembro", value: "09" },
  { label: "Outubro", value: "10" },
  { label: "Novembro", value: "11" },
  { label: "Dezembro", value: "12" },
];
const mesesComTodos = [
  { label: "Todo o ano", value: "todos" },
  ...meses
];

const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

// Estrutura básica para contas contábeis - Ativo e Passivo
type ContaBalanco = {
  codigo: string;
  descricao: string;
  grupo: "Ativo" | "Passivo";
  saldoInicial: number;
  debito: number;
  credito: number;
  saldoFinal: number;
};

// Mock de contas (exemplo)
const contasMock: ContaBalanco[] = [
  {
    codigo: "1.1.1",
    descricao: "Caixa",
    grupo: "Ativo",
    saldoInicial: 12000,
    debito: 38000,
    credito: 28500,
    saldoFinal: 21500
  },
  {
    codigo: "1.1.2",
    descricao: "Banco Conta Movimento",
    grupo: "Ativo",
    saldoInicial: 25000,
    debito: 22900,
    credito: 20000,
    saldoFinal: 27900
  },
  {
    codigo: "1.2.1",
    descricao: "Clientes",
    grupo: "Ativo",
    saldoInicial: 31000,
    debito: 1900,
    credito: 6000,
    saldoFinal: 25900
  },
  {
    codigo: "2.1.1",
    descricao: "Fornecedores",
    grupo: "Passivo",
    saldoInicial: 18000,
    debito: 11000,
    credito: 8000,
    saldoFinal: 21000
  },
  {
    codigo: "2.2.1",
    descricao: "Empréstimos Bancários",
    grupo: "Passivo",
    saldoInicial: 12000,
    debito: 7000,
    credito: 4000,
    saldoFinal: 15000
  }
];

// Utilitários para mock mensal/acumulado
const getDadosBalanço = (
  tipoVisualizacao: "acumulado" | "mensal",
  ano: string,
  mes: string
) => {
  // Para mock: Se "mensal", apenas multiplicar por 0.12; senão, retorna mock normal
  if (tipoVisualizacao === "mensal" && mes !== "todos") {
    const fator = 0.11 + Number(mes) * 0.059;
    return contasMock.map(c => ({
      ...c,
      saldoInicial: Math.round(c.saldoInicial * fator),
      debito: Math.round(c.debito * fator),
      credito: Math.round(c.credito * fator),
      saldoFinal: Math.round(c.saldoFinal * fator)
    }));
  }
  // Acumulado do ano
  return contasMock;
};

export default function BalancoPage() {
  const [visualizacao, setVisualizacao] = useState<"acumulado" | "mensal">("acumulado");
  const [ano, setAno] = useState(anoAtual.toString());
  const [mes, setMes] = useState("todos");

  const dadosBalanco = getDadosBalanço(visualizacao, ano, mes);

  // Separar contas por grupo para exibição
  const contasAtivo = dadosBalanco.filter(c => c.grupo === "Ativo");
  const contasPassivo = dadosBalanco.filter(c => c.grupo === "Passivo");

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Balanço Patrimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Visualização</label>
              <Select
                value={visualizacao}
                onValueChange={(v) => setVisualizacao(v as "acumulado" | "mensal")}
              >
                <SelectTrigger className="min-w-[150px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acumulado">Balanço Acumulado</SelectItem>
                  <SelectItem value="mensal">Balanço Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Ano</label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="min-w-[90px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anos.map(a => (
                    <SelectItem value={a} key={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Só exibe filtro de mês na visualização mensal */}
            {visualizacao === "mensal" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Mês</label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="min-w-[120px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesComTodos.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>

          {/* Tabela Ativo */}
          <h3 className="font-semibold mt-0 mb-1 text-[17px] text-blue-700 flex">Ativo</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Saldo Inicial (R$)</TableHead>
                <TableHead className="text-right">Débitos (R$)</TableHead>
                <TableHead className="text-right">Créditos (R$)</TableHead>
                <TableHead className="text-right">Saldo Final (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasAtivo.map(c => (
                <TableRow key={c.codigo}>
                  <TableCell>{c.codigo}</TableCell>
                  <TableCell>{c.descricao}</TableCell>
                  <TableCell className="text-right">{c.saldoInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.debito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.saldoFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Tabela Passivo */}
          <h3 className="font-semibold mt-6 mb-1 text-[17px] text-blue-700 flex">Passivo</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Saldo Inicial (R$)</TableHead>
                <TableHead className="text-right">Débitos (R$)</TableHead>
                <TableHead className="text-right">Créditos (R$)</TableHead>
                <TableHead className="text-right">Saldo Final (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasPassivo.map(c => (
                <TableRow key={c.codigo}>
                  <TableCell>{c.codigo}</TableCell>
                  <TableCell>{c.descricao}</TableCell>
                  <TableCell className="text-right">{c.saldoInicial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.debito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{c.saldoFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
