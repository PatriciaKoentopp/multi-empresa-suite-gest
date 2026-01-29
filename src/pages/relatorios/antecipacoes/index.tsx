import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarIcon, FileSpreadsheet, FileText, Wallet, ArrowDownCircle, ArrowUpCircle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRelatorioAntecipacoes } from "@/hooks/useRelatorioAntecipacoes";
import * as XLSX from "xlsx";

export default function RelatorioAntecipacoes() {
  const navigate = useNavigate();
  const [dataReferencia, setDataReferencia] = useState<Date>(new Date());
  const { isLoading, antecipacoes, resumo, gerarRelatorio } = useRelatorioAntecipacoes();

  const handleGerarRelatorio = () => {
    gerarRelatorio(dataReferencia);
  };

  const exportarExcel = () => {
    if (antecipacoes.length === 0) return;

    const dados = antecipacoes.map((ant) => ({
      Data: format(ant.dataLancamento, "dd/MM/yyyy"),
      Tipo: ant.tipoOperacao === "receber" ? "Recebimento" : "Pagamento",
      Favorecido: ant.favorecido,
      Descrição: ant.descricao,
      "Valor Total": ant.valorTotal,
      "Valor Utilizado": ant.valorUtilizado,
      "Valor Disponível": ant.valorDisponivel,
      Status: ant.status === "ativa" ? "Ativa" : "Utilizada",
    }));

    // Adicionar linha de totais
    dados.push({
      Data: "",
      Tipo: "",
      Favorecido: "",
      Descrição: "TOTAL",
      "Valor Total": antecipacoes.reduce((sum, a) => sum + a.valorTotal, 0),
      "Valor Utilizado": antecipacoes.reduce((sum, a) => sum + a.valorUtilizado, 0),
      "Valor Disponível": resumo.valorTotalDisponivel,
      Status: "",
    });

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Antecipações");
    XLSX.writeFile(wb, `antecipacoes-${format(dataReferencia, "yyyy-MM-dd")}.xlsx`);
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
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Antecipações</h1>
          <p className="text-muted-foreground">
            Posição das antecipações em aberto em uma data específica
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
            {antecipacoes.length > 0 && (
              <Button variant="outline" onClick={exportarExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      {antecipacoes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.totalAntecipacoes}</div>
              <p className="text-xs text-muted-foreground">antecipações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.valorTotalDisponivel)}</div>
              <p className="text-xs text-muted-foreground">total disponível</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Recebimentos</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resumo.antecipacoesRecebimento}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(resumo.valorRecebimento)}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Pagamentos</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{resumo.antecipacoesPagamento}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(resumo.valorPagamento)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Dados */}
      {antecipacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Antecipações em Aberto em {format(dataReferencia, "dd/MM/yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Favorecido</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Utilizado</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {antecipacoes.map((ant) => (
                    <TableRow key={ant.id}>
                      <TableCell>{format(ant.dataLancamento, "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ant.tipoOperacao === "receber" 
                            ? "border-green-500 text-green-600" 
                            : "border-blue-500 text-blue-600"
                          }
                        >
                          {ant.tipoOperacao === "receber" ? "Recebimento" : "Pagamento"}
                        </Badge>
                      </TableCell>
                      <TableCell>{ant.favorecido}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{ant.descricao}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ant.valorTotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ant.valorUtilizado)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(ant.valorDisponivel)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={ant.status === "ativa" ? "default" : "secondary"}
                        >
                          {ant.status === "ativa" ? "Ativa" : "Utilizada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Rodapé com totais */}
            <div className="mt-4 flex justify-end gap-8 border-t pt-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold">{formatCurrency(resumo.valorTotalDisponivel)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {!isLoading && antecipacoes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Selecione uma data de referência e clique em "Gerar Relatório" para visualizar as antecipações em aberto.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
