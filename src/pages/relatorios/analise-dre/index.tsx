import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VariationDisplay } from "@/components/vendas/VariationDisplay";

export default function AnaliseDrePage() {
  // Estados originais
  const [tab, setTab] = useState("mensal");
  const [anoBase, setAnoBase] = useState(new Date().getFullYear().toString());
  const [mesBase, setMesBase] = useState((new Date().getMonth()).toString().padStart(2, '0'));
  const [anoComparacao, setAnoComparacao] = useState((new Date().getFullYear() - 1).toString());
  const [visualizacao, setVisualizacao] = useState<"todos" | "agrupado" | "significativos">("todos");
  const [percentualMinimo, setPercentualMinimo] = useState("10");
  
  // Estados temporários para aplicação de filtros
  const [tabTemp, setTabTemp] = useState("mensal");
  const [anoBaseTemp, setAnoBaseTemp] = useState(new Date().getFullYear().toString());
  const [mesBaseTemp, setMesBaseTemp] = useState((new Date().getMonth()).toString().padStart(2, '0'));
  const [anoComparacaoTemp, setAnoComparacaoTemp] = useState((new Date().getFullYear() - 1).toString());
  const [visualizacaoTemp, setVisualizacaoTemp] = useState<"todos" | "agrupado" | "significativos">("todos");
  const [percentualMinimoTemp, setPercentualMinimoTemp] = useState("10");

  // Sincronizar estados temporários com os estados reais no início
  useEffect(() => {
    setTabTemp(tab);
    setAnoBaseTemp(anoBase);
    setMesBaseTemp(mesBase);
    setAnoComparacaoTemp(anoComparacao);
    setVisualizacaoTemp(visualizacao);
    setPercentualMinimoTemp(percentualMinimo);
  }, [tab, anoBase, mesBase, anoComparacao, visualizacao, percentualMinimo]);

  // Função para aplicar os filtros
  const aplicarFiltros = () => {
    setTab(tabTemp);
    setAnoBase(anoBaseTemp);
    setMesBase(mesBaseTemp);
    setAnoComparacao(anoComparacaoTemp);
    setVisualizacao(visualizacaoTemp);
    setPercentualMinimo(percentualMinimoTemp);
  };

  // Função para resetar os filtros
  const resetarFiltros = () => {
    const anoAtual = new Date().getFullYear().toString();
    const mesAtual = (new Date().getMonth()).toString().padStart(2, '0');
    const anoAnterior = (new Date().getFullYear() - 1).toString();
    
    // Resetar estados temporários
    setTabTemp("mensal");
    setAnoBaseTemp(anoAtual);
    setMesBaseTemp(mesAtual);
    setAnoComparacaoTemp(anoAnterior);
    setVisualizacaoTemp("todos");
    setPercentualMinimoTemp("10");
    
    // Resetar estados originais
    setTab("mensal");
    setAnoBase(anoAtual);
    setMesBase(mesAtual);
    setAnoComparacao(anoAnterior);
    setVisualizacao("todos");
    setPercentualMinimo("10");
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Análise de DRE</CardTitle>
          <CardDescription>
            Análise comparativa do Demonstrativo de Resultado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 border-b pb-4">
            <Tabs value={tabTemp} onValueChange={setTabTemp} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mensal">Mensal</TabsTrigger>
                <TabsTrigger value="anual">Anual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4 mb-6">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-2">
                {tabTemp === "mensal" ? "Mês base" : "Ano base"}
              </label>
              {tabTemp === "mensal" ? (
                <div className="flex space-x-2">
                  <Select value={mesBaseTemp} onValueChange={setMesBaseTemp}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">Janeiro</SelectItem>
                      <SelectItem value="01">Fevereiro</SelectItem>
                      <SelectItem value="02">Março</SelectItem>
                      <SelectItem value="03">Abril</SelectItem>
                      <SelectItem value="04">Maio</SelectItem>
                      <SelectItem value="05">Junho</SelectItem>
                      <SelectItem value="06">Julho</SelectItem>
                      <SelectItem value="07">Agosto</SelectItem>
                      <SelectItem value="08">Setembro</SelectItem>
                      <SelectItem value="09">Outubro</SelectItem>
                      <SelectItem value="10">Novembro</SelectItem>
                      <SelectItem value="11">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={anoBaseTemp} onValueChange={setAnoBaseTemp}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Select value={anoBaseTemp} onValueChange={setAnoBaseTemp}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-2">
                {tabTemp === "mensal" ? "Ano comparação" : "Ano comparação"}
              </label>
              <Select value={anoComparacaoTemp} onValueChange={setAnoComparacaoTemp}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-2">
                Visualização
              </label>
              <Select value={visualizacaoTemp} onValueChange={setVisualizacaoTemp}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os dados</SelectItem>
                  <SelectItem value="agrupado">Valores agrupados</SelectItem>
                  <SelectItem value="significativos">Apenas variações significativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visualizacaoTemp === "significativos" && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Percentual mínimo para variação
              </label>
              <Select value={percentualMinimoTemp} onValueChange={setPercentualMinimoTemp}>
                <SelectTrigger className="bg-white w-full md:w-1/3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 mb-6">
            <Button 
              variant="outline" 
              onClick={resetarFiltros}
              className="flex items-center gap-2"
            >
              <RotateCcwIcon className="h-4 w-4" />
              Resetar filtros
            </Button>
            <Button 
              variant="blue" 
              onClick={aplicarFiltros}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
