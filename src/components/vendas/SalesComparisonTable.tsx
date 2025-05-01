
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

interface SalesComparisonTableProps {
  yearlyComparisonData: YearlyComparison[];
}

export const SalesComparisonTable = ({ yearlyComparisonData }: SalesComparisonTableProps) => {
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
                <TableHead className="text-right w-[100px]">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearlyComparisonData.map((yearData, index) => (
                <TableRow 
                  key={`yearly-comparison-${yearData.year || index}`} 
                  className={(yearData.year || 0) % 2 === 0 ? "bg-white" : "bg-muted/10"}
                >
                  <TableCell className="font-medium">{yearData.year || "N/A"}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
