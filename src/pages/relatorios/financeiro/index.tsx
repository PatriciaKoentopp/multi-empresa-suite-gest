
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useRelatorioFinanceiro, PeriodoFiltro } from "@/hooks/useRelatorioFinanceiro";
import { FinanceiroSummaryCards } from "@/components/relatorios/financeiro/FinanceiroSummaryCards";
import { DespesasPieChart } from "@/components/relatorios/financeiro/DespesasPieChart";
import { ReceitasPieChart } from "@/components/relatorios/financeiro/ReceitasPieChart";
import { ReceitasDespesasBarChart } from "@/components/relatorios/financeiro/ReceitasDespesasBarChart";
import { CategoriasTable } from "@/components/relatorios/financeiro/CategoriasTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RelatorioFinanceiro() {
  const navigate = useNavigate();
  const {
    loading,
    categoriasDespesas,
    categoriasReceitas,
    fluxoMensal,
    resumo,
    filtro,
    atualizarPeriodo,
    refetch,
  } = useRelatorioFinanceiro();

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDataInicio, setTempDataInicio] = useState<Date | undefined>(filtro.dataInicio);
  const [tempDataFim, setTempDataFim] = useState<Date | undefined>(filtro.dataFim);

  const handlePeriodoChange = (value: string) => {
    atualizarPeriodo(value as PeriodoFiltro);
  };

  const handleCustomDateApply = () => {
    if (tempDataInicio && tempDataFim) {
      atualizarPeriodo("personalizado", tempDataInicio, tempDataFim);
      setDatePickerOpen(false);
    }
  };

  const formatPeriodo = () => {
    return `${format(filtro.dataInicio, "dd/MM/yyyy")} - ${format(filtro.dataFim, "dd/MM/yyyy")}`;
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
            <h1 className="text-3xl font-bold tracking-tight">Relatório Financeiro</h1>
            <p className="text-muted-foreground">
              Análise detalhada de receitas e despesas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Período:</span>
              <Tabs value={filtro.periodo} onValueChange={handlePeriodoChange}>
                <TabsList>
                  <TabsTrigger value="mes_atual">Mês Atual</TabsTrigger>
                  <TabsTrigger value="trimestre">Trimestre</TabsTrigger>
                  <TabsTrigger value="ano">Ano</TabsTrigger>
                  <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filtro.periodo === "personalizado" && (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatPeriodo()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Data Início</p>
                        <CalendarComponent
                          mode="single"
                          selected={tempDataInicio}
                          onSelect={setTempDataInicio}
                          locale={ptBR}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Data Fim</p>
                        <CalendarComponent
                          mode="single"
                          selected={tempDataFim}
                          onSelect={setTempDataFim}
                          locale={ptBR}
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

            <span className="text-sm text-muted-foreground ml-auto">
              {formatPeriodo()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <FinanceiroSummaryCards resumo={resumo} loading={loading} />

      {/* Gráficos de Pizza */}
      <div className="grid gap-6 md:grid-cols-2">
        <DespesasPieChart categorias={categoriasDespesas} loading={loading} />
        <ReceitasPieChart categorias={categoriasReceitas} loading={loading} />
      </div>

      {/* Gráfico de Barras */}
      <ReceitasDespesasBarChart fluxoMensal={fluxoMensal} loading={loading} />

      {/* Tabela Detalhada */}
      <CategoriasTable 
        categoriasDespesas={categoriasDespesas} 
        categoriasReceitas={categoriasReceitas} 
        loading={loading} 
      />
    </div>
  );
}
