
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  { label: "Todos os meses", value: "todos" },
  ...meses
];

const anos: string[] = [];
const anoAtual = new Date().getFullYear();
for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());

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

// Contas DRE padrão (para garantir que todos os meses apareçam na horizontal)
const contasDRE = mockDRE.map(c => c.tipo);

// Mock DRE Mensal - garantir todos os meses do ano
const mesesNumericos = meses.map(m => m.value);

const mockDREMensalBase = [
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
  // Adicione outros meses preenchidos ou zeros
];

// Garante que mockDREMensal tenha todos os meses, preenche valores zerados se faltar algum mês
const mockDREMensal: { mes: string, dados: { tipo: string, valor: number }[] }[] = mesesNumericos.map(mesVal => {
  const encontrado = mockDREMensalBase.find(mx => mx.mes === mesVal);
  if (encontrado) return encontrado;
  // Se não tiver para o mês, retorna todas as contas zeradas
  return {
    mes: mesVal,
    dados: contasDRE.map(c => ({ tipo: c, valor: 0 }))
  };
});

export default function DrePage() {
  const [visualizacao, setVisualizacao] = useState<"acumulado" | "mensal">("acumulado");
  const [ano, setAno] = useState(anoAtual.toString());
  const [mes, setMes] = useState("01");

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
                  <SelectTrigger className="min-w-[140px] bg-white">
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
            {visualizacao === "mensal" && mes !== "todos" && (
              (() => {
                const dadosMes = mockDREMensal.find(mObj => mObj.mes === mes);
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
            {visualizacao === "mensal" && mes === "todos" && (
              // Tabela horizontal comparando todos os meses
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    {meses.map(m => (
                      <TableHead key={m.value} className="text-center">{m.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasDRE.map(conta => (
                    <TableRow key={conta}>
                      <TableCell>{conta}</TableCell>
                      {meses.map(m => {
                        const dadoMes = mockDREMensal.find(x => x.mes === m.value);
                        const linha = dadoMes?.dados.find(i => i.tipo === conta);
                        return (
                          <TableCell key={m.value} className="text-right">
                            {linha
                              ? linha.valor.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL"
                                })
                              : "R$ 0,00"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// O arquivo ficou longo; recomendo considerar refatoração em componentes menores após esta alteração.

