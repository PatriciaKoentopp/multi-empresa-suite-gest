import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarIcon, FileSpreadsheet, FileText, AlertCircle, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRelatorioContasReceber } from "@/hooks/useRelatorioContasReceber";
import * as XLSX from "xlsx";

export default function RelatorioContasReceber() {
  const navigate = useNavigate();
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const { isLoading, contas, resumo, gerarRelatorio } = useRelatorioContasReceber();

  const handleGerarRelatorio = () => {
    gerarRelatorio(dataReferencia);
  };

  const exportarExcel = () => {
    if (contas.length === 0) return;

    const dados = contas.map((conta) => ({
      Vencimento: format(conta.dataVencimento, "dd/MM/yyyy"),
      Parcela: conta.numeroParcela,
      Cliente: conta.cliente,
      Descrição: conta.descricao,
      Situação: conta.situacao === "vencida" ? "Vencida" : "A Vencer",
      Valor: conta.valor,
    }));

    // Adicionar linha de totais
    dados.push({
      Vencimento: "",
      Parcela: "",
      Cliente: "",
      Descrição: "TOTAL",
      Situação: "",
      Valor: resumo.valorTotal,
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas a Receber");
    XLSX.writeFile(wb, `contas-a-receber-${format(dataReferencia, "yyyy-MM-dd")}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Contas a Receber</h1>
          <p className="text-muted-foreground">
            Posição das contas a receber em aberto em uma data específica
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Referência</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dataReferencia && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataReferencia ? (
                      format(dataReferencia, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataReferencia}
                    onSelect={(date) => date && setDataReferencia(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleGerarRelatorio} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            {contas.length > 0 && (
              <Button variant="outline" onClick={exportarExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      {contas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalContas}</div>
              <p className="text-xs text-muted-foreground">contas</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.valorTotal)}</div>
              <p className="text-xs text-muted-foreground">a receber</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{resumo.contasVencidas}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(resumo.valorVencido)}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">A Vencer</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{resumo.contasAVencer}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(resumo.valorAVencer)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Dados */}
      {contas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Contas a Receber em Aberto em {format(dataReferencia, "dd/MM/yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Situação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell>{format(conta.dataVencimento, "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-mono text-sm">{conta.numeroParcela}</TableCell>
                      <TableCell>{conta.cliente}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{conta.descricao}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={conta.situacao === "vencida" ? "destructive" : "outline"}
                          className={conta.situacao === "a_vencer" ? "border-amber-500 text-amber-600" : ""}
                        >
                          {conta.situacao === "vencida" ? "Vencida" : "A Vencer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Rodapé com totais */}
            <div className="mt-4 flex justify-end border-t pt-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {!isLoading && contas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Selecione uma data de referência e clique em "Gerar Relatório" para visualizar as contas a receber em aberto.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
