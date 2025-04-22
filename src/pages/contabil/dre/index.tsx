
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

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

const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString()); // últimos anos

// Mock de dados contábeis (padrão DRE)
const mockDRE = [
  { tipo: "Receita Bruta", valor: 100000 },
  { tipo: "(-) Deduções", valor: -2000 },
  { tipo: "Receita Líquida", valor: 98000 },
  { tipo: "(-) Custos", valor: -30000 },
  { tipo: "Lucro Bruto", valor: 68000 },
  { tipo: "(-) Despesas Operacionais", valor: -35000 },
  { tipo: "Resultado Operacional", valor: 33000 },
  { tipo: "(-) Despesas financeiras", valor: -8000 },
  { tipo: "Resultado Antes IR", valor: 25000 },
  { tipo: "(-) IRPJ/CSLL", valor: -3000 },
  { tipo: "Lucro Líquido do Exercício", valor: 22000 }
];

// Mock DRE Mensal (simples: um array para cada mês)
const mockDREMensal = [
  {
    mes: "01",
    dados: [
      { tipo: "Receita Bruta", valor: 8000 },
      { tipo: "(-) Deduções", valor: -150 },
      { tipo: "Receita Líquida", valor: 7850 },
      { tipo: "(-) Custos", valor: -2500 },
      { tipo: "Lucro Bruto", valor: 5350 },
      { tipo: "(-) Despesas Operacionais", valor: -2900 },
      { tipo: "Resultado Operacional", valor: 2450 },
      { tipo: "(-) Despesas financeiras", valor: -600 },
      { tipo: "Resultado Antes IR", valor: 1850 },
      { tipo: "(-) IRPJ/CSLL", valor: -220 },
      { tipo: "Lucro Líquido do Exercício", valor: 1630 }
    ]
  },
  {
    mes: "02",
    dados: [
      { tipo: "Receita Bruta", valor: 9000 },
      { tipo: "(-) Deduções", valor: -180 },
      { tipo: "Receita Líquida", valor: 8820 },
      { tipo: "(-) Custos", valor: -2650 },
      { tipo: "Lucro Bruto", valor: 6170 },
      { tipo: "(-) Despesas Operacionais", valor: -3050 },
      { tipo: "Resultado Operacional", valor: 3120 },
      { tipo: "(-) Despesas financeiras", valor: -500 },
      { tipo: "Resultado Antes IR", valor: 2620 },
      { tipo: "(-) IRPJ/CSLL", valor: -360 },
      { tipo: "Lucro Líquido do Exercício", valor: 2260 }
    ]
  }
  // Adicione outros meses conforme necessário
];

export default function DrePage() {
  const [visualizacao, setVisualizacao] = useState<"acumulado" | "mensal">("acumulado");
  const [ano, setAno] = useState(anoAtual.toString());
  const [mes, setMes] = useState(meses[0].value);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>DRE - Demonstração do Resultado do Exercício</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Visualização
              </label>
              <Select
                value={visualizacao}
                onValueChange={v => setVisualizacao(v as "acumulado" | "mensal")}
              >
                <SelectTrigger className="min-w-[160px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acumulado">Resultado Acumulado</SelectItem>
                  <SelectItem value="mensal">Resultado por Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Ano
              </label>
              <Select value={ano} onValueChange={val => setAno(val)}>
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
            {visualizacao === "mensal" && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Mês
                </label>
                <Select value={mes} onValueChange={val => setMes(val)}>
                  <SelectTrigger className="min-w-[120px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>

          {/* Exibição do DRE */}
          <div>
            {visualizacao === "acumulado" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDRE.map(item => (
                    <TableRow key={item.tipo}>
                      <TableCell>{item.tipo}</TableCell>
                      <TableCell className="text-right">
                        {item.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {visualizacao === "mensal" && (
              // Busca o mock do mês selecionado
              (() => {
                const dadosMes = mockDREMensal.find(m => m.mes === mes);
                if (!dadosMes) {
                  return (
                    <div className="text-muted-foreground py-4">Sem dados para este mês.</div>
                  );
                }
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosMes.dados.map(item => (
                        <TableRow key={item.tipo}>
                          <TableCell>{item.tipo}</TableCell>
                          <TableCell className="text-right">
                            {item.valor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
