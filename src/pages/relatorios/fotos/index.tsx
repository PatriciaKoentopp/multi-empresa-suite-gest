import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Search, FileSpreadsheet } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { useRelatorioProjetosFotosDB } from "@/hooks/useRelatorioProjetosFotosDB";
import { useExcelFotosProjetos } from "@/hooks/useExcelFotosProjetos";
import { ProjetoAccordion } from "@/components/relatorios/fotos/ProjetoAccordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RelatorioFotosPage = () => {
  const [filtroProjeto, setFiltroProjeto] = useState<string>("");
  const [filtroPercentualMin, setFiltroPercentualMin] = useState<string>("");
  const [filtroPercentualMax, setFiltroPercentualMax] = useState<string>("");
  const [tiposProjeto, setTiposProjeto] = useState<{ id: string; nome: string }[]>([]);
  const [filtroTipoProjeto, setFiltroTipoProjeto] = useState<string>("todos");

  const { currentCompany } = useCompany();
  const { projetosFotos, isLoading } = useRelatorioProjetosFotosDB();
  const { exportToExcel, isGenerating } = useExcelFotosProjetos();

  useEffect(() => {
    if (!currentCompany?.id) return;
    async function carregarTipos() {
      const { data, error } = await supabase
        .from("relogio_tipos_projeto")
        .select("id, nome")
        .eq("empresa_id", currentCompany.id)
        .order("nome", { ascending: true });
      if (!error) setTiposProjeto(data || []);
    }
    carregarTipos();
  }, [currentCompany?.id]);

  const formatHoursMinutes = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const metrics = useMemo(() => {
    const totalHoras = projetosFotos.reduce((s, p) => s + (p.totalHoras || 0), 0);
    const totalProjetos = projetosFotos.length;
    const clientes = new Set<string>();
    projetosFotos.forEach((p) => {
      (p.favorecidosIds || []).forEach((id) => {
        if (id) clientes.add(id);
      });
    });
    return {
      totalHoras,
      totalProjetos,
      totalClientes: clientes.size,
      horasMediasPorProjeto: totalProjetos > 0 ? totalHoras / totalProjetos : 0,
    };
  }, [projetosFotos]);

  const totalFotos = useMemo(() => {
    let fotosVendidas = 0;
    let fotosEnviadas = 0;
    let fotosTiradas = 0;
    projetosFotos.forEach((p) => {
      fotosVendidas += p.fotosVendidas || 0;
      fotosEnviadas += p.fotosEnviadas || 0;
      fotosTiradas += p.fotosTiradas || 0;
    });
    return {
      fotosVendidas,
      fotosEnviadas,
      fotosTiradas,
      percentualVendidas: fotosEnviadas > 0 ? (fotosVendidas / fotosEnviadas) * 100 : 0,
      percentualEnviadas: fotosTiradas > 0 ? (fotosEnviadas / fotosTiradas) * 100 : 0,
      percentualVendidasTiradas: fotosTiradas > 0 ? (fotosVendidas / fotosTiradas) * 100 : 0,
      tempoPorFotoVendida: fotosVendidas > 0 ? metrics.totalHoras / fotosVendidas : 0,
    };
  }, [projetosFotos, metrics.totalHoras]);

  const projetosAgrupados = useMemo(() => {
    return projetosFotos.map((p) => ({
      numeroProjeto: p.numeroProjeto,
      numero: p.numeroProjeto,
      nome: `Projeto ${p.numeroProjeto}`,
      projetos: p.cliente ? [`${p.numeroProjeto} - ${p.cliente}`] : [],
      cliente: p.cliente,
      totalHoras: p.totalHoras,
      horasFaturaveis: 0,
      horasNaoFaturaveis: 0,
      valorFaturavel: 0,
      membros: "",
      gerente: "",
      observacao: "",
      percentualTotal:
        metrics.totalHoras > 0 ? (p.totalHoras / metrics.totalHoras) * 100 : 0,
      fotosVendidas: p.fotosVendidas,
      fotosEnviadas: p.fotosEnviadas,
      fotosTiradas: p.fotosTiradas,
      tempoPorFotoVendida:
        p.fotosVendidas > 0 ? p.totalHoras / p.fotosVendidas : 0,
      tipoProjetoId: p.tipoProjetoId,
    }));
  }, [projetosFotos, metrics.totalHoras]);

    const projetosFiltrados = useMemo(() => {
    let filtrados = [...projetosAgrupados];

    filtrados = filtrados.filter(
      (projeto) => projeto.cliente && projeto.cliente.trim() !== ""
    );

    if (filtroProjeto.trim()) {
      const termoBusca = filtroProjeto.toLowerCase();
      filtrados = filtrados.filter(
        (projeto) =>
          projeto.numeroProjeto.toLowerCase().includes(termoBusca) ||
          projeto.cliente.toLowerCase().includes(termoBusca)
      );
    }

    const percMin = filtroPercentualMin ? parseFloat(filtroPercentualMin) : null;
    const percMax = filtroPercentualMax ? parseFloat(filtroPercentualMax) : null;

    if (percMin !== null || percMax !== null) {
      filtrados = filtrados.filter((projeto) => {
        if (projeto.fotosTiradas === 0) return false;
        const percentual = (projeto.fotosVendidas / projeto.fotosTiradas) * 100;
        if (percMin !== null && percentual < percMin) return false;
        if (percMax !== null && percentual > percMax) return false;
        return true;
      });
    }

    if (filtroTipoProjeto !== "todos") {
      filtrados = filtrados.filter((projeto) => projeto.tipoProjetoId === filtroTipoProjeto);
    }

    return filtrados.sort((a, b) => {
      const numA = parseInt(a.numeroProjeto) || 0;
      const numB = parseInt(b.numeroProjeto) || 0;
      return numB - numA;
    });
  }, [projetosAgrupados, filtroProjeto, filtroPercentualMin, filtroPercentualMax, filtroTipoProjeto]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold">Relatório de Fotos</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursMinutes(metrics.totalHoras)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjetos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Médias/Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursMinutes(metrics.horasMediasPorProjeto)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { tipo: "Tiradas", quantidade: totalFotos.fotosTiradas, fill: "hsl(217, 91%, 60%)" },
                    { tipo: "Enviadas", quantidade: totalFotos.fotosEnviadas, fill: "hsl(142, 71%, 45%)" },
                    { tipo: "Vendidas", quantidade: totalFotos.fotosVendidas, fill: "hsl(262, 83%, 58%)" },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" name="Quantidade de Fotos" fill="fill">
                    {[
                      { tipo: "Tiradas", fill: "hsl(217, 91%, 60%)" },
                      { tipo: "Enviadas", fill: "hsl(142, 71%, 45%)" },
                      { tipo: "Vendidas", fill: "hsl(262, 83%, 58%)" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Tempo por Foto Vendida</p>
                <p className="text-3xl font-bold">
                  {totalFotos.tempoPorFotoVendida > 0
                    ? formatHoursMinutes(totalFotos.tempoPorFotoVendida)
                    : "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (Total Horas / Fotos Vendidas)
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Enviadas / Tiradas</p>
                <p className="text-3xl font-bold">{totalFotos.percentualEnviadas.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">(Enviadas / Tiradas)</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Vendidas / Enviadas</p>
                <p className="text-3xl font-bold">{totalFotos.percentualVendidas.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">(Vendidas / Enviadas)</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Vendidas / Tiradas</p>
                <p className="text-3xl font-bold">{totalFotos.percentualVendidasTiradas.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">(Vendidas / Tiradas)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visão por Projeto</CardTitle>
          <Button
            variant="outline"
            onClick={() => exportToExcel(projetosFiltrados)}
            disabled={isGenerating || projetosFiltrados.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? "Gerando..." : "Exportar Excel"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6 pb-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="filtro-projeto" className="text-sm text-muted-foreground mb-2 block">
                  Buscar por projeto ou cliente
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filtro-projeto"
                    type="text"
                    placeholder="Digite para buscar..."
                    value={filtroProjeto}
                    onChange={(e) => setFiltroProjeto(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="filtro-tipo-projeto" className="text-sm text-muted-foreground mb-2 block">
                  Tipo de Projeto
                </Label>
                <Select value={filtroTipoProjeto} onValueChange={setFiltroTipoProjeto}>
                  <SelectTrigger id="filtro-tipo-projeto">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposProjeto.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filtro-perc-min" className="text-sm text-muted-foreground mb-2 block">
                    % Vendidas/Tiradas (mín)
                  </Label>
                  <Input
                    id="filtro-perc-min"
                    type="number"
                    placeholder="Ex: 2"
                    min="0"
                    max="100"
                    step="0.1"
                    value={filtroPercentualMin}
                    onChange={(e) => setFiltroPercentualMin(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filtro-perc-max" className="text-sm text-muted-foreground mb-2 block">
                    % Vendidas/Tiradas (máx)
                  </Label>
                  <Input
                    id="filtro-perc-max"
                    type="number"
                    placeholder="Ex: 3"
                    min="0"
                    max="100"
                    step="0.1"
                    value={filtroPercentualMax}
                    onChange={(e) => setFiltroPercentualMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {(filtroProjeto || filtroPercentualMin || filtroPercentualMax || filtroTipoProjeto !== "todos") && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {projetosFiltrados.length} projeto{projetosFiltrados.length !== 1 ? "s" : ""} encontrado{projetosFiltrados.length !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroProjeto("");
                    setFiltroPercentualMin("");
                    setFiltroPercentualMax("");
                    setFiltroTipoProjeto("todos");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>

          {projetosFiltrados.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              <ProjetoAccordion projetos={projetosFiltrados} />
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum projeto encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioFotosPage;
