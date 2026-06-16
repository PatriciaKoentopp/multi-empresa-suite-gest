import { useState, useEffect, useMemo } from "react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Filter, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useRelatorioProjetos } from "@/hooks/useRelatorioProjetos";
import { useRelatorioProjetosFotosDB } from "@/hooks/useRelatorioProjetosFotosDB";
import { useExcelProjetos } from "@/hooks/useExcelProjetos";
import { ProjetosMetricsCards } from "@/components/relatorios/projetos/ProjetosMetricsCards";
import { ProjetosTable } from "@/components/relatorios/projetos/ProjetosTable";
import { ProjetosTimelineCharts } from "@/components/relatorios/projetos/ProjetosTimelineCharts";
import { ProjetosTimelineVendidasCharts } from "@/components/relatorios/projetos/ProjetosTimelineVendidasCharts";

export default function RelatorioProjetosPage() {
  const { currentCompany } = useCompany();
  const [vendasData, setVendasData] = useState<any[]>([]);
  const [tiposProjeto, setTiposProjeto] = useState<{ id: string; nome: string }[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroProjeto, setFiltroProjeto] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "completos" | "sem-venda" | "sem-fotos">("todos");
  const [filtroTipoProjeto, setFiltroTipoProjeto] = useState<string>("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [isLoadingVendas, setIsLoadingVendas] = useState(false);

  const { projetosFotos, isLoading: isLoadingFotos } = useRelatorioProjetosFotosDB();
  const { exportToExcel, isGenerating } = useExcelProjetos();

  // Carregar vendas e tipos de projeto
  useEffect(() => {
    if (currentCompany?.id) {
      carregarVendas();
      carregarTiposProjeto();
    }
  }, [currentCompany]);

  async function carregarVendas() {
    setIsLoadingVendas(true);
    try {
      const { data, error } = await supabase.from('orcamentos').select(`
          id,
          codigo,
          codigo_projeto,
          data_venda,
          favorecidos!inner(nome),
          orcamentos_itens(valor)
        `).eq('empresa_id', currentCompany?.id).eq('tipo', 'venda').eq('status', 'ativo');
      if (error) throw error;
      const vendasComValor = (data || []).map(v => ({
        ...v,
        cliente: v.favorecidos?.nome || '',
        valor_total: (v.orcamentos_itens || []).reduce((sum: number, item: any) => sum + Number(item.valor || 0), 0)
      }));
      setVendasData(vendasComValor);
    } catch (error: any) {
      console.error("Erro ao carregar vendas:", error);
      toast.error("Erro ao carregar vendas");
    } finally {
      setIsLoadingVendas(false);
    }
  }

  async function carregarTiposProjeto() {
    try {
      const { data, error } = await supabase
        .from('relogio_tipos_projeto')
        .select('id, nome')
        .eq('empresa_id', currentCompany?.id)
        .order('nome', { ascending: true });
      if (error) throw error;
      setTiposProjeto(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tipos de projeto:", error);
    }
  }

  const {
    projetos,
    projetosCompletos,
    projetosSemVenda,
    projetosSemFotos
  } = useRelatorioProjetos(vendasData, projetosFotos);

  // Filtrar projetos
  const projetosFiltrados = useMemo(() => {
    let lista = filtroStatus === "todos" ? projetos.filter(p => p.temVenda) : projetos;

    if (filtroStatus === "completos") {
      lista = projetosCompletos;
    } else if (filtroStatus === "sem-venda") {
      lista = projetosSemVenda;
    } else if (filtroStatus === "sem-fotos") {
      lista = projetosSemFotos;
    }

    if (filtroCliente) {
      lista = lista.filter(p => p.cliente.toLowerCase().includes(filtroCliente.toLowerCase()));
    }

    if (filtroProjeto) {
      lista = lista.filter(p => p.numeroProjeto.includes(filtroProjeto));
    }

    if (filtroTipoProjeto !== "todos") {
      lista = lista.filter(p => p.tipoProjetoId === filtroTipoProjeto);
    }

    if (dataInicial) {
      lista = lista.filter(p => {
        if (!p.dataVenda) return false;
        const dataVenda = new Date(p.dataVenda);
        const dataIni = new Date(dataInicial);
        return dataVenda >= dataIni;
      });
    }

    if (dataFinal) {
      lista = lista.filter(p => {
        if (!p.dataVenda) return false;
        const dataVenda = new Date(p.dataVenda);
        const dataFim = new Date(dataFinal);
        return dataVenda <= dataFim;
      });
    }

    return lista;
  }, [projetos, projetosCompletos, projetosSemVenda, projetosSemFotos, filtroStatus, filtroCliente, filtroProjeto, filtroTipoProjeto, dataInicial, dataFinal]);

  const metricasFiltradas = useMemo(() => {
    const projetosComVenda = projetosFiltrados.filter(p => p.temVenda);
    const totalReceita = projetosComVenda.reduce((sum, p) => sum + p.receita, 0);
    const totalFotos = projetosComVenda.reduce((sum, p) => sum + p.fotosVendidas, 0);
    const totalEnviadas = projetosComVenda.reduce((sum, p) => sum + p.fotosEnviadas, 0);
    const totalHoras = projetosComVenda.reduce((sum, p) => sum + p.totalHoras, 0);

    return {
      totalProjetos: projetosComVenda.length,
      totalReceita,
      totalFotos,
      totalHoras,
      receitaMedia: projetosComVenda.length > 0 ? totalReceita / projetosComVenda.length : 0,
      valorMedioPorFoto: totalFotos > 0 ? totalReceita / totalFotos : 0,
      valorMedioPorHora: totalHoras > 0 ? totalReceita / totalHoras : 0,
      horasMediasPorFoto: totalFotos > 0 ? totalHoras / totalFotos : 0,
      eficienciaMedia: totalEnviadas > 0 ? (totalFotos / totalEnviadas) * 100 : 0,
    };
  }, [projetosFiltrados]);

  const limparFiltros = () => {
    setFiltroCliente("");
    setFiltroProjeto("");
    setFiltroStatus("todos");
    setFiltroTipoProjeto("todos");
    setDataInicial("");
    setDataFinal("");
  };

  const isLoading = isLoadingFotos || isLoadingVendas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Layers className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Relatório de Projetos</h1>
            <p className="text-muted-foreground">Análise integrada de vendas, projetos e apontamentos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(projetosFiltrados)}
            disabled={isGenerating || projetosFiltrados.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? "Gerando..." : "Exportar Excel"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input placeholder="Filtrar por cliente..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Número do Projeto</Label>
                  <Input placeholder="Filtrar por número..." value={filtroProjeto} onChange={e => setFiltroProjeto(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Projeto</Label>
                  <Select value={filtroTipoProjeto} onValueChange={setFiltroTipoProjeto}>
                    <SelectTrigger>
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
              </div>

              {(filtroCliente || filtroProjeto || filtroStatus !== "todos" || filtroTipoProjeto !== "todos" || dataInicial || dataFinal) && (
                <Button variant="outline" size="sm" onClick={limparFiltros}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cards de Métricas */}
          <ProjetosMetricsCards
            metrics={metricasFiltradas}
            projetosCompletos={projetosCompletos.length}
            projetosSemVenda={projetosSemVenda.length}
            projetosSemFotos={projetosSemFotos.length}
          />

          {/* Gráfico de Evolução de Desempenho - Fotos Tiradas */}
          {projetosFiltrados.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Desempenho - Fotos Tiradas</CardTitle>
                <CardDescription>
                  Análise temporal do valor por foto tirada e eficiência de produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjetosTimelineCharts projetos={projetosFiltrados} />
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Evolução de Desempenho - Fotos Vendidas */}
          {projetosFiltrados.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Desempenho - Fotos Vendidas</CardTitle>
                <CardDescription>
                  Análise temporal do valor por foto vendida e eficiência de produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjetosTimelineVendidasCharts projetos={projetosFiltrados} />
              </CardContent>
            </Card>
          )}

          {/* Tabela de Projetos */}
          <Card>
            <CardHeader>
              <CardTitle>Projetos ({projetosFiltrados.length})</CardTitle>
              <CardDescription>
                Detalhamento de todos os projetos com dados de vendas e produção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjetosTable projetos={projetosFiltrados} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
