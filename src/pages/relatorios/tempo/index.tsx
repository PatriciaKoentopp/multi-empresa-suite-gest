import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Clock, FileText, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { useSpreadsheetData, SpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useRelatorioTempo } from "@/hooks/useRelatorioTempo";
import { UploadModal } from "@/components/relatorios/tempo/UploadModal";
import { ProjetoAccordion } from "@/components/relatorios/tempo/ProjetoAccordion";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { formatHoursMinutes } from "@/utils/timeUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export default function RelatorioTempoPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<SpreadsheetData[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [filtroMes, setFiltroMes] = useState<string>("todos");
  const {
    uploads,
    isLoading: uploadsLoading,
    fetchUploadsByTipo,
    deleteUpload
  } = useUploadFiles();
  const {
    isLoading: dataLoading,
    fetchDataByUpload
  } = useSpreadsheetData();
  const {
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    dadosPorAno,
    dadosPorMesAno
  } = useRelatorioTempo(consolidatedData);
  useEffect(() => {
    fetchUploadsByTipo("tempo");
  }, []);
  useEffect(() => {
    const fetchAllSelectedData = async () => {
      if (selectedUploadIds.length > 0) {
        const allData = [];
        for (const uploadId of selectedUploadIds) {
          const data = await fetchDataByUpload(uploadId);
          allData.push(...data);
        }
        setConsolidatedData([...allData]); // Spread operator força nova referência
        console.log('[DEBUG] Total de registros consolidados:', allData.length);
        console.log('[DEBUG] Primeiros 3 registros:', allData.slice(0, 3));
        console.log('[DEBUG] Últimos 3 registros:', allData.slice(-3));
      } else {
        setConsolidatedData([]);
        console.log('[DEBUG] Nenhum upload selecionado');
      }
    };
    fetchAllSelectedData();
  }, [selectedUploadIds]);
  const handleUploadComplete = () => {
    fetchUploadsByTipo("tempo");
  };

  const handleToggleUpload = (uploadId: string, checked: boolean) => {
    if (checked) {
      setSelectedUploadIds([...selectedUploadIds, uploadId]);
    } else {
      setSelectedUploadIds(selectedUploadIds.filter(id => id !== uploadId));
    }
  };

  const handleDeleteUpload = async () => {
    if (uploadToDelete) {
      const success = await deleteUpload(uploadToDelete);
      if (success) {
        setSelectedUploadIds(selectedUploadIds.filter(id => id !== uploadToDelete));
        setUploadToDelete(null);
      }
    }
  };

  const totalLinhasSelecionadas = uploads
    .filter(u => selectedUploadIds.includes(u.id))
    .reduce((sum, u) => sum + u.total_linhas, 0);

  // Obter anos e meses únicos dos dados consolidados
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    consolidatedData.forEach(item => {
      const dataInicio = item.dados?.data_inicio;
      if (dataInicio) {
        let ano: string;
        if (typeof dataInicio === 'number') {
          const date = new Date((dataInicio - 25569) * 86400 * 1000);
          ano = date.getFullYear().toString();
        } else if (typeof dataInicio === 'string' && dataInicio.includes('/')) {
          const parts = dataInicio.split('/');
          ano = parts[2];
        } else {
          const date = new Date(dataInicio);
          ano = date.getFullYear().toString();
        }
        anos.add(ano);
      }
    });
    return Array.from(anos).sort();
  }, [consolidatedData]);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    consolidatedData.forEach(item => {
      const dataInicio = item.dados?.data_inicio;
      if (dataInicio) {
        let mes: string;
        if (typeof dataInicio === 'number') {
          const date = new Date((dataInicio - 25569) * 86400 * 1000);
          mes = (date.getMonth() + 1).toString().padStart(2, '0');
        } else if (typeof dataInicio === 'string' && dataInicio.includes('/')) {
          const parts = dataInicio.split('/');
          mes = parts[1];
        } else {
          const date = new Date(dataInicio);
          mes = (date.getMonth() + 1).toString().padStart(2, '0');
        }
        meses.add(mes);
      }
    });
    return Array.from(meses).sort();
  }, [consolidatedData]);

  // Filtrar projetos agrupados baseado nos filtros selecionados
  const projetosAgrupadosFiltrados = useMemo(() => {
    // Se ambos os filtros estão em "todos", retornar todos os projetos
    if (filtroAno === 'todos' && filtroMes === 'todos') {
      return projetosAgrupados;
    }

    // Função helper para converter diferentes formatos de data para timestamp
    const converterParaTimestamp = (dataInicio: any): number | null => {
      if (!dataInicio) return null;

      if (typeof dataInicio === 'number') {
        return (dataInicio - 25569) * 86400 * 1000;
      } else if (typeof dataInicio === 'string' && dataInicio.includes('/')) {
        const parts = dataInicio.split('/');
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return date.getTime();
      } else {
        const date = new Date(dataInicio);
        return date.getTime();
      }
    };

    return projetosAgrupados.filter(projeto => {
      // Verificar se o projeto tem tarefas
      if (!projeto.tarefas || !Array.isArray(projeto.tarefas) || projeto.tarefas.length === 0) {
        return false;
      }

      // Coletar todas as datas do projeto
      const todasAsDatas: number[] = [];
      
      projeto.tarefas.forEach(tarefa => {
        if (tarefa.detalhes && Array.isArray(tarefa.detalhes)) {
          tarefa.detalhes.forEach(detalhe => {
            const timestamp = converterParaTimestamp(detalhe.data_inicio);
            if (timestamp !== null) {
              todasAsDatas.push(timestamp);
            }
          });
        }
      });

      // Se não há datas, não incluir o projeto
      if (todasAsDatas.length === 0) {
        return false;
      }

      // Encontrar a primeira data (menor timestamp)
      const primeiraDataTimestamp = Math.min(...todasAsDatas);
      const primeiraData = new Date(primeiraDataTimestamp);
      
      const ano = primeiraData.getFullYear().toString();
      const mes = (primeiraData.getMonth() + 1).toString().padStart(2, '0');

      const anoMatch = filtroAno === 'todos' || ano === filtroAno;
      const mesMatch = filtroMes === 'todos' || mes === filtroMes;

      return anoMatch && mesMatch;
    });
  }, [projetosAgrupados, filtroAno, filtroMes]);

  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  if (uploadsLoading) {
    return <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>;
  }
  if (uploads.length === 0) {
    return <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Clock className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Nenhuma planilha de horas enviada</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Faça o upload da sua primeira planilha de horas para começar a visualizar
            relatórios e análises detalhadas.
          </p>
          <Button onClick={() => setShowUploadModal(true)} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Fazer Primeiro Upload
          </Button>
        </div>
        <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onUploadComplete={handleUploadComplete} />
      </div>;
  }
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório de Tempo</h1>
          <p className="text-muted-foreground">
            Análise detalhada de horas trabalhadas por projeto e tarefa
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Novo Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione as planilhas</CardTitle>
          {selectedUploadIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedUploadIds.length} planilha(s) selecionada(s) • {totalLinhasSelecionadas} linhas no total
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {uploads.map(upload => (
              <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    id={upload.id}
                    checked={selectedUploadIds.includes(upload.id)}
                    onCheckedChange={(checked) => handleToggleUpload(upload.id, checked as boolean)}
                  />
                  <label
                    htmlFor={upload.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{upload.nome_arquivo}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(upload.data_upload), "dd/MM/yyyy HH:mm")} • {upload.total_linhas} linhas
                    </div>
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUploadToDelete(upload.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUploadIds.length > 0 && !dataLoading && <>
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
                const mesesDoAno = dadosPorMesAno.filter(m => m.ano === anoData.ano);
                
                return (
                  <div key={anoData.ano} className="border rounded-lg overflow-hidden">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 hover:bg-accent/50"
                      onClick={() => {
                        const newExpanded = new Set(expandedYears);
                        if (isExpanded) {
                          newExpanded.delete(anoData.ano);
                        } else {
                          newExpanded.add(anoData.ano);
                        }
                        setExpandedYears(newExpanded);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
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
                            <XAxis 
                              dataKey="mesNome" 
                              stroke="hsl(var(--foreground))"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              yAxisId="left"
                              stroke="hsl(var(--foreground))"
                              style={{ fontSize: '12px' }}
                              label={{ value: 'Total de Horas', angle: -90, position: 'insideLeft' }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="hsl(var(--foreground))"
                              style={{ fontSize: '12px' }}
                              label={{ value: 'Número de Projetos', angle: 90, position: 'insideRight' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                              }}
                              formatter={(value: number, name: string, props: any) => {
                                if (name === 'Total de Horas') {
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
                            <Bar 
                              yAxisId="left"
                              dataKey="totalHoras" 
                              name="Total de Horas"
                              radius={[4, 4, 0, 0]}
                            >
                              {mesesDoAno.map((entry, index) => (
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
                              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
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
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Ano</label>
                      <Select value={filtroAno} onValueChange={setFiltroAno}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Anos</SelectItem>
                          {anosDisponiveis.map(ano => (
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
                          {mesesDisponiveis.map(mes => (
                            <SelectItem key={mes} value={mes}>
                              {mesesNomes[parseInt(mes) - 1]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
        </>}

      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onUploadComplete={handleUploadComplete} />

      <AlertDialog open={!!uploadToDelete} onOpenChange={() => setUploadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta planilha? Esta ação não pode ser desfeita e todos os dados importados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUpload} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
;