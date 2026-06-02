import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRelatorioTempoDB } from "@/hooks/useRelatorioTempoDB";
import { useRelatorioTempo } from "@/hooks/useRelatorioTempo";
import { ProjetoAccordion } from "@/components/relatorios/tempo/ProjetoAccordion";
import { formatHoursMinutes } from "@/utils/timeUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart } from "recharts";
import type { HoraTrabalhadaData, SpreadsheetData } from "@/hooks/useSpreadsheetData";

export default function RelatorioTempoPage() {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [filtroMes, setFiltroMes] = useState<string>("todos");
  const [filtroCodigo, setFiltroCodigo] = useState<string>("");
  const [filtroCliente, setFiltroCliente] = useState<string>("");

  const { horasData, isLoading } = useRelatorioTempoDB();

  // Filtrar por ano/mês antes de passar ao hook de processamento
  const horasFiltradas: HoraTrabalhadaData[] = useMemo(() => {
    if (filtroAno === "todos" && filtroMes === "todos") return horasData;
    return horasData.filter((h) => {
      const di = h.data_inicio;
      if (!di || typeof di !== "string" || !di.includes("/")) return false;
      const [, mes, ano] = di.split("/");
      const matchAno = filtroAno === "todos" || ano === filtroAno;
      const matchMes = filtroMes === "todos" || mes.padStart(2, "0") === filtroMes;
      return matchAno && matchMes;
    });
  }, [horasData, filtroAno, filtroMes]);

  // Adaptar para o formato esperado por useRelatorioTempo (SpreadsheetData[])
  const dadosAdaptados = useMemo<SpreadsheetData[]>(
    () =>
      horasFiltradas.map((h, idx) => ({
        id: String(idx),
        upload_file_id: "",
        empresa_id: "",
        tipo_relatorio: "tempo",
        linha_numero: idx,
        dados: h,
        created_at: "",
      })),
    [horasFiltradas]
  );

  const {
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    dadosPorAno,
    dadosPorMesAno,
  } = useRelatorioTempo(dadosAdaptados);

  const projetosAgrupadosFiltrados = useMemo(() => {
    if (!filtroCodigo && !filtroCliente) return projetosAgrupados;
    return projetosAgrupados.filter((projeto) => {
      const codigoMatch =
        !filtroCodigo ||
        projeto.numeroProjeto?.toLowerCase().includes(filtroCodigo.toLowerCase());
      const clienteMatch =
        !filtroCliente ||
        projeto.cliente?.toLowerCase().includes(filtroCliente.toLowerCase());
      return codigoMatch && clienteMatch;
    });
  }, [projetosAgrupados, filtroCodigo, filtroCliente]);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    horasData.forEach((h) => {
      const di = h.data_inicio;
      if (typeof di === "string" && di.includes("/")) {
        anos.add(di.split("/")[2]);
      }
    });
    return Array.from(anos).sort();
  }, [horasData]);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    horasData.forEach((h) => {
      const di = h.data_inicio;
      if (typeof di === "string" && di.includes("/")) {
        meses.add(di.split("/")[1].padStart(2, "0"));
      }
    });
    return Array.from(meses).sort();
  }, [horasData]);

  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (horasData.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Clock className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Nenhum apontamento encontrado</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Registre apontamentos em /relogio/apontamento para visualizar relatórios e análises detalhadas aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório de Tempo</h1>
          <p className="text-muted-foreground">
            Análise detalhada de horas trabalhadas por projeto e tarefa
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursMinutes(metrics.totalHoras)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projetos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjetos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas por Projeto</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursMinutes(metrics.mediaHorasPorProjeto)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Anual</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clique nos anos para expandir e visualizar dados mensais
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {dadosPorAno.map((anoData) => {
            const isExpanded = expandedYears.has(anoData.ano);
            const mesesDoAno = dadosPorMesAno.filter((m) => m.ano === anoData.ano);

            return (
              <div key={anoData.ano} className="border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 hover:bg-accent/50"
                  onClick={() => {
                    const newExpanded = new Set(expandedYears);
                    if (isExpanded) newExpanded.delete(anoData.ano);
                    else newExpanded.add(anoData.ano);
                    setExpandedYears(newExpanded);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <span className="text-lg font-semibold">{anoData.ano}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="font-medium">{formatHoursMinutes(anoData.totalHoras)}</div>
                      <div className="text-muted-foreground">Total de Horas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{anoData.totalProjetos}</div>
                      <div className="text-muted-foreground">Projetos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatHoursMinutes(anoData.horasPorProjeto)}</div>
                      <div className="text-muted-foreground">Horas/Projeto</div>
                    </div>
                  </div>
                </Button>

                {isExpanded && mesesDoAno.length > 0 && (
                  <div className="border-t bg-muted/20 p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={mesesDoAno}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mesNome" stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                        <YAxis
                          yAxisId="left"
                          stroke="hsl(var(--foreground))"
                          style={{ fontSize: "12px" }}
                          label={{ value: "Total de Horas", angle: -90, position: "insideLeft" }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="hsl(var(--foreground))"
                          style={{ fontSize: "12px" }}
                          label={{ value: "Número de Projetos", angle: 90, position: "insideRight" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                          formatter={(value: number, name: string, props: any) => {
                            if (name === "Total de Horas") {
                              const hours = Math.floor(value);
                              const minutes = Math.round((value - hours) * 60);
                              const horasPorProjeto = props.payload?.horasPorProjeto;
                              if (horasPorProjeto) {
                                const hppHours = Math.floor(horasPorProjeto);
                                const hppMinutes = Math.round((horasPorProjeto - hppHours) * 60);
                                return [`${hours}h ${minutes}m (${hppHours}h ${hppMinutes}m por projeto)`, name];
                              }
                              return [`${hours}h ${minutes}m`, name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalHoras" name="Total de Horas" radius={[4, 4, 0, 0]}>
                          {mesesDoAno.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${(index * 360) / 12}, 70%, 60%)`} />
                          ))}
                        </Bar>
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalProjetos"
                          name="Total de Projetos"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Horas por Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={tarefasDistribuicao.map((item) => ({
                  name: item.tarefa,
                  value: parseFloat(item.horas.toFixed(2)),
                }))}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                dataKey="value"
                label={(entry) => {
                  const total = tarefasDistribuicao.reduce((sum, t) => sum + t.horas, 0);
                  const percent = ((entry.value / total) * 100).toFixed(1);
                  const hours = Math.floor(entry.value);
                  const minutes = Math.round((entry.value - hours) * 60);
                  return `${entry.name}: ${hours}h ${minutes}m (${percent}%)`;
                }}
              >
                {tarefasDistribuicao.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${(index * 360) / tarefasDistribuicao.length}, 70%, 60%)`}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => {
                  const total = tarefasDistribuicao.reduce((sum, t) => sum + t.horas, 0);
                  const percent = ((value / total) * 100).toFixed(1);
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  return `${hours}h ${minutes}m (${percent}%)`;
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="projetos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projetos">Visão por Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projetos Agrupados</CardTitle>
              <div className="space-y-4 mt-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Ano</label>
                    <Select value={filtroAno} onValueChange={setFiltroAno}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Anos</SelectItem>
                        {anosDisponiveis.map((ano) => (
                          <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Mês</label>
                    <Select value={filtroMes} onValueChange={setFiltroMes}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Meses</SelectItem>
                        {mesesDisponiveis.map((mes) => (
                          <SelectItem key={mes} value={mes}>
                            {mesesNomes[parseInt(mes) - 1]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Código do Projeto</label>
                    <Input
                      placeholder="Buscar por código..."
                      value={filtroCodigo}
                      onChange={(e) => setFiltroCodigo(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Nome do Cliente</label>
                    <Input
                      placeholder="Buscar por cliente..."
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projetosAgrupadosFiltrados.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum projeto encontrado para os filtros selecionados.
                </p>
              ) : (
                <ProjetoAccordion projetos={projetosAgrupadosFiltrados} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
