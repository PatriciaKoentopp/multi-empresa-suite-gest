
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useLancamentosContabeis } from "@/hooks/useLancamentosContabeis";
import { usePdfLancamentos } from "@/hooks/usePdfLancamentos";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";

type PeriodoFiltro = "mes_atual" | "mes_anterior" | "personalizado";

interface ContaAgrupada {
  contaCodigo: string;
  contaNome: string;
  lancamentos: Array<{
    id: string;
    data: string | Date;
    historico: string;
    tipo: "debito" | "credito";
    valor: number;
    saldo: number;
    favorecido?: string;
    tipo_lancamento?: string;
    numero_documento?: string;
    numero_parcela?: number;
  }>;
  totalDebitos: number;
  totalCreditos: number;
  saldoFinal: number;
}

export default function RazaoContabil() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const { lancamentos, planosContas, isLoading, carregarDados } = useLancamentosContabeis();
  const { gerarPdfLancamentos } = usePdfLancamentos();

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("mes_atual");
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dataFim, setDataFim] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDataInicio, setTempDataInicio] = useState<Date | undefined>(dataInicio);
  const [tempDataFim, setTempDataFim] = useState<Date | undefined>(dataFim);

  useEffect(() => {
    if (periodo === "mes_atual") {
      const now = new Date();
      setDataInicio(new Date(now.getFullYear(), now.getMonth(), 1));
      setDataFim(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (periodo === "mes_anterior") {
      const now = new Date();
      setDataInicio(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      setDataFim(new Date(now.getFullYear(), now.getMonth(), 0));
    }
  }, [periodo]);

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value as PeriodoFiltro);
  };

  const handleCustomDateApply = () => {
    if (tempDataInicio && tempDataFim) {
      setDataInicio(tempDataInicio);
      setDataFim(tempDataFim);
      setDatePickerOpen(false);
    }
  };

  // Parse date string to comparable date (without timezone issues)
  const parseDataLancamento = (data: string | Date): Date => {
    if (data instanceof Date) return data;
    if (typeof data === "string") {
      // DD/MM/YYYY
      if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [d, m, y] = data.split("/").map(Number);
        return new Date(y, m - 1, d);
      }
      // YYYY-MM-DD
      if (data.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [y, m, d] = data.split("T")[0].split("-").map(Number);
        return new Date(y, m - 1, d);
      }
    }
    return new Date(data);
  };

  // Contas ativas do plano de contas para o select
  const contasAtivas = useMemo(() => {
    return planosContas
      .filter(c => c.status === "ativo")
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [planosContas]);

  // Filtrar e agrupar lançamentos
  const contasAgrupadas = useMemo<ContaAgrupada[]>(() => {
    if (!lancamentos || lancamentos.length === 0) return [];

    // Filtrar por período
    const lancFiltrados = lancamentos.filter(lanc => {
      const dataLanc = parseDataLancamento(lanc.data);
      return dataLanc >= dataInicio && dataLanc <= dataFim;
    });

    // Filtrar por conta se necessário
    const lancPorConta = contaSelecionadaId !== "todas"
      ? lancFiltrados.filter(lanc => {
          const conta = contasAtivas.find(c => c.id === contaSelecionadaId);
          return conta && lanc.conta_codigo === conta.codigo;
        })
      : lancFiltrados;

    // Agrupar por conta (código)
    const grupos = new Map<string, ContaAgrupada>();

    lancPorConta.forEach(lanc => {
      const key = lanc.conta_codigo || "sem-conta";
      if (!grupos.has(key)) {
        grupos.set(key, {
          contaCodigo: lanc.conta_codigo || "-",
          contaNome: lanc.conta_nome || "-",
          lancamentos: [],
          totalDebitos: 0,
          totalCreditos: 0,
          saldoFinal: 0,
        });
      }
      const grupo = grupos.get(key)!;
      grupo.lancamentos.push({
        id: lanc.id,
        data: lanc.data,
        historico: lanc.historico + (lanc.favorecido ? ` - ${lanc.favorecido}` : ""),
        tipo: lanc.tipo as "debito" | "credito",
        valor: lanc.valor,
        saldo: 0,
        favorecido: lanc.favorecido,
        tipo_lancamento: lanc.tipo_lancamento,
      });
    });

    // Ordenar lançamentos por data dentro de cada grupo e calcular saldo
    const resultado: ContaAgrupada[] = [];
    const sortedKeys = Array.from(grupos.keys()).sort();

    sortedKeys.forEach(key => {
      const grupo = grupos.get(key)!;

      // Ordenar por data
      grupo.lancamentos.sort((a, b) => {
        const dateA = parseDataLancamento(a.data);
        const dateB = parseDataLancamento(b.data);
        return dateA.getTime() - dateB.getTime();
      });

      // Calcular saldo acumulado
      let saldoAcumulado = 0;
      grupo.lancamentos.forEach(lanc => {
        if (lanc.tipo === "debito") {
          saldoAcumulado += lanc.valor;
          grupo.totalDebitos += lanc.valor;
        } else {
          saldoAcumulado -= lanc.valor;
          grupo.totalCreditos += lanc.valor;
        }
        lanc.saldo = saldoAcumulado;
      });

      grupo.saldoFinal = saldoAcumulado;
      resultado.push(grupo);
    });

    return resultado;
  }, [lancamentos, dataInicio, dataFim, contaSelecionadaId, contasAtivas]);

  const formatDataExibicao = (data: string | Date): string => {
    return formatDate(data);
  };

  const handleGerarPdf = () => {
    if (contasAgrupadas.length === 0) {
      toast.error("Nenhum lançamento encontrado para gerar o PDF");
      return;
    }

    // Flatten all lancamentos for PDF
    const todosLancamentos = contasAgrupadas.flatMap(grupo =>
      grupo.lancamentos.map(lanc => ({
        ...lanc,
        conta_codigo: grupo.contaCodigo,
        conta_nome: grupo.contaNome,
      }))
    );

    const contaPdf = contaSelecionadaId !== "todas"
      ? contasAtivas.find(c => c.id === contaSelecionadaId)
      : undefined;

    const sucesso = gerarPdfLancamentos(
      todosLancamentos,
      currentCompany?.nome_fantasia || "Empresa",
      contaPdf ? { id: contaPdf.id, codigo: contaPdf.codigo, descricao: contaPdf.descricao } : undefined,
      dataInicio,
      dataFim
    );

    if (sucesso) {
      toast.success("PDF gerado com sucesso!");
    } else {
      toast.error("Erro ao gerar o PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Razão Contábil</h1>
            <p className="text-muted-foreground">
              Lançamentos contábeis agrupados por conta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={carregarDados} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleGerarPdf} disabled={isLoading || contasAgrupadas.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <Tabs value={periodo} onValueChange={handlePeriodoChange}>
                <TabsList>
                  <TabsTrigger value="mes_atual">Mês Atual</TabsTrigger>
                  <TabsTrigger value="mes_anterior">Mês Anterior</TabsTrigger>
                  <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {periodo === "personalizado" && (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(dataInicio)} - {formatDate(dataFim)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Data Início</p>
                        <Calendar
                          mode="single"
                          selected={tempDataInicio}
                          onSelect={setTempDataInicio}
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Data Fim</p>
                        <Calendar
                          mode="single"
                          selected={tempDataFim}
                          onSelect={setTempDataFim}
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCustomDateApply} className="w-full">
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Conta:</span>
              <Select value={contaSelecionadaId} onValueChange={setContaSelecionadaId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Contas</SelectItem>
                  {contasAtivas.map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.codigo} - {conta.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-sm text-muted-foreground ml-auto">
              {formatDate(dataInicio)} - {formatDate(dataFim)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : contasAgrupadas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Nenhum lançamento encontrado para o período e filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {contasAgrupadas.map(grupo => (
            <Card key={grupo.contaCodigo}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {grupo.contaCodigo} - {grupo.contaNome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Data</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead className="text-right w-[130px]">Débito</TableHead>
                      <TableHead className="text-right w-[130px]">Crédito</TableHead>
                      <TableHead className="text-right w-[130px]">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grupo.lancamentos.map((lanc, idx) => (
                      <TableRow key={lanc.id || idx}>
                        <TableCell className="text-sm">{formatDataExibicao(lanc.data)}</TableCell>
                        <TableCell className="text-sm">{lanc.historico}</TableCell>
                        <TableCell className="text-right text-sm">
                          {lanc.tipo === "debito" ? formatCurrency(lanc.valor) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {lanc.tipo === "credito" ? formatCurrency(lanc.valor) : "-"}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right text-sm font-medium",
                          lanc.saldo < 0 ? "text-destructive" : ""
                        )}>
                          {formatCurrency(lanc.saldo)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totalizador */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2} className="text-sm font-bold">
                        Totais
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {formatCurrency(grupo.totalDebitos)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold">
                        {formatCurrency(grupo.totalCreditos)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right text-sm font-bold",
                        grupo.saldoFinal < 0 ? "text-destructive" : ""
                      )}>
                        {formatCurrency(grupo.saldoFinal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
