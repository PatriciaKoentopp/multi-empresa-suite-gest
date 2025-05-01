
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VariationDisplay } from "./VariationDisplay";
import { YearlyComparison } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SalesComparisonTableProps {
  yearlyComparisonData: YearlyComparison[];
}

export const SalesComparisonTable = ({ yearlyComparisonData }: SalesComparisonTableProps) => {
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
                <Accordion type="single" collapsible key={yearData.year}>
                  <AccordionItem value={`year-${yearData.year}`} className="border-0">
                    <TableRow className={yearData.year % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                      <TableCell className="py-0 pl-4">
                        <AccordionTrigger className="py-4 hover:no-underline font-semibold">
                          <span>{yearData.year}</span>
                        </AccordionTrigger>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(yearData.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {yearData.yearlyVariation !== null && (
                          <VariationDisplay value={yearData.yearlyVariation} />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(yearData.mediaMensal)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {yearData.mediaVariacao !== null && (
                          <VariationDisplay value={yearData.mediaVariacao} />
                        )}
                      </TableCell>
                    </TableRow>
                    <AccordionContent>
                      <div className="pl-4 pr-2 pb-2 bg-muted/5">
                        <Table>
                          <TableHeader className="bg-muted/20">
                            <TableRow className="border-0">
                              <TableHead className="pl-6 py-2 font-medium text-left">Mês</TableHead>
                              <TableHead className="text-right py-2 font-medium w-[170px]">Total de Vendas</TableHead>
                              <TableHead className="text-right py-2 font-medium w-[100px]">Var. Mensal</TableHead>
                              <TableHead className="text-right py-2 font-medium pr-6 w-[100px]">Var. Anual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearData.months.map((monthData, index) => (
                              <TableRow 
                                key={`${yearData.year}-${monthData.month}`} 
                                className={`border-0 ${index % 2 === 0 ? "bg-white/40" : "bg-muted/10"} hover:bg-muted/20`}
                              >
                                <TableCell className="py-3 pl-6">
                                  <span className="font-medium capitalize">{monthData.month}</span>
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  {formatCurrency(monthData.total)}
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  <VariationDisplay value={monthData.monthlyVariation} />
                                </TableCell>
                                <TableCell className="text-right py-3 pr-6">
                                  <VariationDisplay value={monthData.yearlyVariation} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
