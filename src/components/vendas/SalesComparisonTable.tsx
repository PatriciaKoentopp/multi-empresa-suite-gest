
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
  // Verificar e garantir que temos dados para exibir
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

  // Verificar os dados recebidos para debug
  console.log("Dados recebidos na tabela de comparação:", yearlyComparisonData);
  yearlyComparisonData.forEach(year => {
    console.log(`Ano: ${year.year}, Variação Total: ${year.yearlyVariation}, Variação Média: ${year.mediaVariacao}`);
  });

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
              {yearlyComparisonData.map((yearData) => (
                <TableRow 
                  key={yearData.year} 
                  className={yearData.year % 2 === 0 ? "bg-white" : "bg-muted/10"}
                >
                  <TableCell className="font-medium">{yearData.year}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(yearData.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationDisplay value={yearData.yearlyVariation} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(yearData.mediaMensal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VariationDisplay value={yearData.mediaVariacao} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
