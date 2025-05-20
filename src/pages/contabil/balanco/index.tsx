
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useBalancoPatrimonial } from "@/hooks/useBalancoPatrimonial";

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

// Gerar array de anos (do ano atual até 2021)
const obterAnos = (): string[] => {
  const anos: string[] = [];
  const anoAtual = new Date().getFullYear();
  for (let a = anoAtual; a >= 2021; a--) anos.push(a.toString());
  return anos;
};

export default function BalancoPage() {
  const { 
    contasBalanco, 
    isLoading, 
    carregarDados, 
    periodo, 
    setPeriodo, 
    ano, 
    setAno, 
    mes, 
    setMes 
  } = useBalancoPatrimonial();
  
  const anos = obterAnos();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Balanço Patrimonial</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={carregarDados}
          className="text-blue-500 hover:bg-blue-100 h-[42px] w-[42px]"
          title="Atualizar dados"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>
    
      <Card>
        <CardHeader>
          <CardTitle>Balanço Patrimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4 mb-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Visualização</label>
              <Select
                value={periodo}
                onValueChange={(v) => setPeriodo(v as "acumulado" | "mensal")}
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
            {periodo === "mensal" && (
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

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div>
              {/* Tabela Ativo */}
              <h3 className="font-semibold mt-0 mb-1 text-[17px] text-blue-700 flex">
                Ativo
                <span className="ml-2 text-gray-500 font-normal">
                  (Total: {contasBalanco.totalAtivo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                </span>
              </h3>
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
                  {contasBalanco.contasAtivo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhuma conta de Ativo encontrada
                      </TableCell>
                    </TableRow>
                  ) : contasBalanco.contasAtivo.map(c => (
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
              <h3 className="font-semibold mt-6 mb-1 text-[17px] text-blue-700 flex">
                Passivo
                <span className="ml-2 text-gray-500 font-normal">
                  (Total: {contasBalanco.totalPassivo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                </span>
              </h3>
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
                  {contasBalanco.contasPassivo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhuma conta de Passivo encontrada
                      </TableCell>
                    </TableRow>
                  ) : contasBalanco.contasPassivo.map(c => (
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
              
              {/* Totais */}
              <div className="mt-6 text-right">
                <div className="text-lg font-semibold">
                  Ativo + Passivo: {(contasBalanco.totalAtivo + contasBalanco.totalPassivo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-sm text-gray-500">
                  Diferença: {(contasBalanco.totalAtivo - contasBalanco.totalPassivo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
