
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VariationDisplay } from "./VariationDisplay";
import { YearlyComparison } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SalesComparisonTableProps {
  yearlyComparisonData: YearlyComparison[];
  getMonthlySalesData?: (year: number) => Promise<{ name: string; faturado: number; variacao_percentual: number | null; variacao_ano_anterior: number | null; }[]>;
}

export const SalesComparisonTable = ({ 
  yearlyComparisonData,
  getMonthlySalesData 
}: SalesComparisonTableProps) => {
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({});
  const [monthlyData, setMonthlyData] = useState<{[key: number]: {name: string; faturado: number; variacao_percentual: number | null; variacao_ano_anterior: number | null;}[]}>({});
  const [loadingYear, setLoadingYear] = useState<number | null>(null);
  
  // Garantir que temos dados válidos para exibir
  console.log("Dados recebidos na tabela de comparação:", yearlyComparisonData);
  
  if (!yearlyComparisonData || yearlyComparisonData.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Comparativo de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado de comparação disponível.
        </CardContent>
      </Card>
    );
  }

  // Verificando dados antes de renderizar
  const hasValidData = yearlyComparisonData.some(item => 
    typeof item.year === 'number' && 
    typeof item.total === 'number' && 
    item.total > 0
  );

  if (!hasValidData) {
    console.warn("Dados inválidos na tabela de comparação:", yearlyComparisonData);
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">Comparativo de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-muted-foreground">
          Dados de comparação inválidos ou incompletos.
        </CardContent>
      </Card>
    );
  }

  // Função para alternar a expansão de um ano
  const toggleYearExpansion = async (year: number) => {
    // Se já estamos carregando, não faz nada
    if (loadingYear !== null) return;

    // Se já temos os dados e estamos apenas alternando a visibilidade
    if (expandedYears[year]) {
      setExpandedYears(prev => ({
        ...prev,
        [year]: !prev[year]
      }));
      return;
    }

    // Se precisamos buscar os dados
    if (getMonthlySalesData) {
      try {
        setLoadingYear(year);
        console.log(`Buscando dados mensais para o ano ${year}`);
        const data = await getMonthlySalesData(year);
        console.log(`Dados mensais recebidos para o ano ${year}:`, data);
        
        setMonthlyData(prev => ({
          ...prev,
          [year]: data
        }));
        
        setExpandedYears(prev => ({
          ...prev,
          [year]: true
        }));
      } catch (error) {
        console.error(`Erro ao buscar dados mensais para ${year}:`, error);
      } finally {
        setLoadingYear(null);
      }
    }
  };

  // Renderizar linhas de dados mensais para um ano
  const renderMonthlyRows = (year: number) => {
    const data = monthlyData[year];
    if (!data || !data.length) return null;

    return data.map((month, idx) => (
      <TableRow key={`month-${year}-${idx}`} className="bg-muted/5 hover:bg-muted/20">
        <TableCell className="pl-8 font-normal text-sm">{month.name}</TableCell>
        <TableCell className="text-right font-normal text-sm">
          {formatCurrency(month.faturado || 0)}
        </TableCell>
        <TableCell className="text-right text-sm">
          <VariationDisplay value={month.variacao_percentual} />
        </TableCell>
        {/* Não exibimos a coluna de média mensal para dados mensais, mas mantemos a célula para preservar o alinhamento */}
        <TableCell className="text-right text-sm">
          {/* Célula vazia para manter o alinhamento correto */}
        </TableCell>
        <TableCell className="text-right text-sm">
          <VariationDisplay value={month.variacao_ano_anterior} tooltip={`Comparado a ${month.name}/${year-1}`} />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">Comparativo de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[130px] text-left">Período</TableHead>
                <TableHead className="text-right w-[170px]">Total de Vendas</TableHead>
                <TableHead className="text-right w-[100px]">Variação</TableHead>
                <TableHead className="text-right w-[170px]">Média Mensal</TableHead>
                <TableHead className="text-right w-[100px]">Variação Anual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyComparisonData.map((yearData, index) => (
                <React.Fragment key={`yearly-comparison-${yearData.year || index}`}>
                  <TableRow 
                    className={(yearData.year || 0) % 2 === 0 ? "bg-white" : "bg-muted/10"}
                    onClick={() => getMonthlySalesData ? toggleYearExpansion(yearData.year) : null}
                    style={{ cursor: getMonthlySalesData ? 'pointer' : 'default' }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getMonthlySalesData && (
                          <>
                            {loadingYear === yearData.year ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            ) : (
                              <>
                                {expandedYears[yearData.year] ? (
                                  <ChevronDown className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-blue-500" />
                                )}
                              </>
                            )}
                          </>
                        )}
                        {yearData.year || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(yearData.total || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationDisplay value={yearData.variacao_total} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(yearData.media_mensal || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationDisplay value={yearData.variacao_media} />
                    </TableCell>
                  </TableRow>
                  
                  {/* Linhas expandidas para mostrar dados mensais */}
                  {expandedYears[yearData.year] && renderMonthlyRows(yearData.year)}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
