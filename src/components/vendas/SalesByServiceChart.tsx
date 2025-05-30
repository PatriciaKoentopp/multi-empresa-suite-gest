
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalesPieChart } from "./SalesPieChart";
import { useSalesByService } from "@/hooks/vendas/useSalesByService";
import { Skeleton } from "@/components/ui/skeleton";

export const SalesByServiceChart = () => {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const { salesByServiceData, fetchSalesByService, fetchFirstSaleYear, firstSaleYear, isLoading } = useSalesByService();
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    // Carregar dados inicialmente e buscar primeiro ano de venda
    const loadInitialData = async () => {
      const firstYear = await fetchFirstSaleYear();
      if (firstYear) {
        // Gerar lista de anos a partir da primeira venda até o ano atual
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: currentYear - firstYear + 1 }, (_, i) => firstYear + i).reverse();
        setAvailableYears(years);
      }
      fetchSalesByService();
    };

    loadInitialData();
  }, []);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    if (value === "all") {
      fetchSalesByService();
    } else {
      fetchSalesByService(parseInt(value));
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vendas por Serviço</CardTitle>
          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Filtrar por ano" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todos os anos</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-32" />
                ))}
              </div>
            </div>
          </div>
        ) : salesByServiceData.length > 0 ? (
          <SalesPieChart data={salesByServiceData} />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado de vendas por serviço encontrado
            {selectedYear !== "all" && ` para o ano de ${selectedYear}`}.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
