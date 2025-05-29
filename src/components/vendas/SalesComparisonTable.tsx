
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { YearlyComparison } from "@/types";
import { useDashboardCards } from "@/hooks/useDashboardCards";

interface SalesComparisonTableProps {
  yearlyComparisonData: YearlyComparison[];
  getMonthlySalesData: (year: number) => Promise<any[]>;
}

export const SalesComparisonTable = ({ 
  yearlyComparisonData, 
  getMonthlySalesData 
}: SalesComparisonTableProps) => {
  const { isCardVisible } = useDashboardCards('painel-vendas');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [monthlyDataCache, setMonthlyDataCache] = useState<Record<number, any[]>>({});
  const [loadingMonths, setLoadingMonths] = useState<Set<number>>(new Set());

  // Se o card da tabela não estiver visível, não renderizar
  if (!isCardVisible('tabela-comparacao')) {
    return null;
  }

  const toggleYear = async (year: number) => {
    const newExpanded = new Set(expandedYears);
    
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
      
      // Carregar dados mensais se ainda não foram carregados
      if (!monthlyDataCache[year]) {
        setLoadingMonths(prev => new Set(prev).add(year));
        try {
          const monthlyData = await getMonthlySalesData(year);
          setMonthlyDataCache(prev => ({ ...prev, [year]: monthlyData }));
        } catch (error) {
          console.error(`Erro ao carregar dados mensais para ${year}:`, error);
        } finally {
          setLoadingMonths(prev => {
            const newSet = new Set(prev);
            newSet.delete(year);
            return newSet;
          });
        }
      }
    }
    
    setExpandedYears(newExpanded);
  };

  const getTrendIcon = (variation: number | null) => {
    if (variation === null) return <Minus className="h-4 w-4" />;
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (variation: number | null) => {
    if (variation === null) return "secondary";
    if (variation > 0) return "default";
    if (variation < 0) return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Anual de Vendas</CardTitle>
        <CardDescription>
          Análise comparativa do desempenho de vendas por ano com detalhamento mensal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Ano</TableHead>
              <TableHead className="text-right">Total de Vendas</TableHead>
              <TableHead className="text-right">Variação</TableHead>
              <TableHead className="text-right">Média Mensal</TableHead>
              <TableHead className="text-right">Variação Média</TableHead>
              <TableHead className="text-center">Meses com Vendas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {yearlyComparisonData.map((yearData) => (
              <React.Fragment key={yearData.year}>
                <TableRow className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleYear(yearData.year)}
                      className="p-1"
                    >
                      {loadingMonths.has(yearData.year) ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : expandedYears.has(yearData.year) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{yearData.year}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(yearData.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {yearData.variacao_total !== null ? (
                      <Badge variant={getTrendColor(yearData.variacao_total)} className="gap-1">
                        {getTrendIcon(yearData.variacao_total)}
                        {Math.abs(yearData.variacao_total).toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(yearData.media_mensal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {yearData.variacao_media !== null ? (
                      <Badge variant={getTrendColor(yearData.variacao_media)} className="gap-1">
                        {getTrendIcon(yearData.variacao_media)}
                        {Math.abs(yearData.variacao_media).toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{yearData.num_meses}/12</Badge>
                  </TableCell>
                </TableRow>
                
                {expandedYears.has(yearData.year) && monthlyDataCache[yearData.year] && (
                  <>
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/30 px-4 py-2">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Detalhamento Mensal - {yearData.year}
                          </h4>
                        </div>
                      </TableCell>
                    </TableRow>
                    {monthlyDataCache[yearData.year].map((monthData, index) => (
                      <TableRow key={`${yearData.year}-${index}`} className="bg-muted/20">
                        <TableCell></TableCell>
                        <TableCell className="pl-8 text-sm">
                          {monthData.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(monthData.faturado)}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
