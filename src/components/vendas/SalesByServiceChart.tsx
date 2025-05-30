
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesBarChart } from "./SalesBarChart";
import { useSalesByService } from "@/hooks/vendas/useSalesByService";
import { Skeleton } from "@/components/ui/skeleton";

export const SalesByServiceChart = () => {
  const { salesByServiceData, fetchSalesByService, isLoading } = useSalesByService();

  useEffect(() => {
    // Carregar dados inicialmente
    fetchSalesByService();
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">Vendas por Serviço por Ano</CardTitle>
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
          <SalesBarChart 
            data={salesByServiceData} 
            multiColor={true}
            className="h-[400px]"
            isYearlyServiceComparison={true}
          />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado de vendas por serviço encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
