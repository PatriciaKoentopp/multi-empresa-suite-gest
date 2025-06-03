import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function AlertsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30");
  const [alertConfig, setAlertConfig] = useState({
    contasVencidas: true,
    contasVencendoHoje: true,
    contasVencendo7Dias: true,
    contasVencendo30Dias: true,
  });

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };

  const handleFilter = () => {
    console.log("Filtering with period:", selectedPeriod);
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleFilter}>Filtrar</Button>
        </div>
        <div className="mt-4">
          {alertConfig.contasVencidas && <p>Contas vencidas: [Número]</p>}
          {alertConfig.contasVencendoHoje && <p>Contas vencendo hoje: [Número]</p>}
          {alertConfig.contasVencendo7Dias && <p>Contas vencendo nos próximos 7 dias: [Número]</p>}
          {alertConfig.contasVencendo30Dias && <p>Contas vencendo nos próximos 30 dias: [Número]</p>}
        </div>
      </CardContent>
    </Card>
  );
}
