import { useState, useEffect, useMemo } from "react";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Upload, Trash2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { useSpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { useRelatorioProjetos } from "@/hooks/useRelatorioProjetos";
import { ProjetosMetricsCards } from "@/components/relatorios/projetos/ProjetosMetricsCards";
import { ProjetosTable } from "@/components/relatorios/projetos/ProjetosTable";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadModal } from "@/components/relatorios/fotos/UploadModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
export default function RelatorioProjetosPage() {
  const {
    currentCompany
  } = useCompany();
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);
  const [vendasData, setVendasData] = useState<any[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroProjeto, setFiltroProjeto] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "completos" | "sem-venda" | "sem-fotos">("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);
  const [isLoadingVendas, setIsLoadingVendas] = useState(false);
  const {
    uploads,
    isLoading: isLoadingUploads,
    fetchUploadsByTipo,
    deleteUpload
  } = useUploadFiles();
  const {
    data: spreadsheetData,
    fetchDataByUpload
  } = useSpreadsheetData();

  // Carregar uploads de fotos ao montar
  useEffect(() => {
    if (currentCompany?.id) {
      fetchUploadsByTipo("fotos");
    }
  }, [currentCompany]);

  // Carregar vendas
  useEffect(() => {
    if (currentCompany?.id) {
      carregarVendas();
    }
  }, [currentCompany]);
  async function carregarVendas() {
    setIsLoadingVendas(true);
    try {
      const {
        data,
        error
      } = await supabase.from('orcamentos').select(`
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

  // Carregar dados quando uploads selecionados mudarem
  useEffect(() => {
    if (selectedUploads.length > 0) {
      selectedUploads.forEach(uploadId => {
        fetchDataByUpload(uploadId);
      });
    }
  }, [selectedUploads]);

  // Consolidar dados de múltiplos uploads
  const consolidatedData = useMemo(() => {
    if (selectedUploads.length === 0) return [];
    const allData: any[] = [];
    selectedUploads.forEach(uploadId => {
      const uploadData = spreadsheetData[uploadId] || [];
      allData.push(...uploadData);
    });
    return allData;
  }, [selectedUploads, spreadsheetData]);

  // Usar o hook combinado
  const {
    projetos,
    metrics,
    projetosCompletos,
    projetosSemVenda,
    projetosSemFotos
  } = useRelatorioProjetos(vendasData, consolidatedData);

  // Filtrar projetos
  const projetosFiltrados = useMemo(() => {
    // Por padrão, mostrar apenas projetos com vendas
    let lista = filtroStatus === "todos" ? projetos.filter(p => p.temVenda) : projetos;

    // Filtro por status
    if (filtroStatus === "completos") {
      lista = projetosCompletos;
    } else if (filtroStatus === "sem-venda") {
      lista = projetosSemVenda;
    } else if (filtroStatus === "sem-fotos") {
      lista = projetosSemFotos;
    }

    // Filtro por cliente
    if (filtroCliente) {
      lista = lista.filter(p => p.cliente.toLowerCase().includes(filtroCliente.toLowerCase()));
    }

    // Filtro por número do projeto
    if (filtroProjeto) {
      lista = lista.filter(p => p.numeroProjeto.includes(filtroProjeto));
    }

    // Filtro por data inicial
    if (dataInicial) {
      lista = lista.filter(p => {
        if (!p.dataVenda) return false;
        const dataVenda = new Date(p.dataVenda);
        const dataIni = new Date(dataInicial);
        return dataVenda >= dataIni;
      });
    }

    // Filtro por data final
    if (dataFinal) {
      lista = lista.filter(p => {
        if (!p.dataVenda) return false;
        const dataVenda = new Date(p.dataVenda);
        const dataFim = new Date(dataFinal);
        return dataVenda <= dataFim;
      });
    }

    return lista;
  }, [projetos, projetosCompletos, projetosSemVenda, projetosSemFotos, filtroStatus, filtroCliente, filtroProjeto, dataInicial, dataFinal]);

  // Calcular métricas dos projetos filtrados
  const metricasFiltradas = useMemo(() => {
    const projetosComVenda = projetosFiltrados.filter(p => p.temVenda);
    const totalReceita = projetosComVenda.reduce((sum, p) => sum + p.valorTotal, 0);
    const totalFotos = projetosComVenda.reduce((sum, p) => sum + p.fotosVendidas, 0);
    const totalHoras = projetosComVenda.reduce((sum, p) => sum + p.horasGastas, 0);

    return {
      totalProjetos: projetosComVenda.length,
      receitaTotal: totalReceita,
      totalFotosVendidas: totalFotos,
      totalHoras: totalHoras,
      mediaPorFoto: totalFotos > 0 ? totalReceita / totalFotos : 0,
      mediaHorasPorFoto: totalFotos > 0 ? totalHoras / totalFotos : 0,
      mediaPorHora: totalHoras > 0 ? totalReceita / totalHoras : 0,
      eficienciaMedia: projetosComVenda.length > 0 
        ? projetosComVenda.reduce((sum, p) => sum + p.eficiencia, 0) / projetosComVenda.length 
        : 0
    };
  }, [projetosFiltrados]);
  const handleUploadSuccess = () => {
    fetchUploadsByTipo("fotos");
    setShowUploadModal(false);
  };
  const handleDeleteUpload = async () => {
    if (!uploadToDelete) return;
    try {
      await deleteUpload(uploadToDelete);
      setSelectedUploads(prev => prev.filter(id => id !== uploadToDelete));
      toast.success("Upload deletado com sucesso");
    } catch (error) {
      toast.error("Erro ao deletar upload");
    } finally {
      setUploadToDelete(null);
    }
  };
  const handleToggleUpload = (uploadId: string) => {
    setSelectedUploads(prev => prev.includes(uploadId) ? prev.filter(id => id !== uploadId) : [...prev, uploadId]);
  };
  const limparFiltros = () => {
    setFiltroCliente("");
    setFiltroProjeto("");
    setFiltroStatus("todos");
    setDataInicial("");
    setDataFinal("");
  };
  const isLoading = isLoadingUploads || isLoadingVendas;
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Layers className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Relatório de Projetos</h1>
            <p className="text-muted-foreground">Análise integrada de vendas e produção fotográfica</p>
          </div>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Nova Planilha
        </Button>
      </div>

      {/* Seleção de Planilhas */}
      <Card>
        <CardHeader>
          <CardTitle>Planilhas de Fotos</CardTitle>
          <CardDescription>
            Selecione as planilhas que deseja analisar em conjunto com as vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUploads ? <p className="text-sm text-muted-foreground">Carregando planilhas...</p> : uploads.length === 0 ? <p className="text-sm text-muted-foreground">
              Nenhuma planilha de fotos encontrada. Faça o upload de uma planilha para começar.
            </p> : <div className="space-y-2">
              {uploads.map(upload => <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedUploads.includes(upload.id)} onCheckedChange={() => handleToggleUpload(upload.id)} />
                    <div>
                      <p className="font-medium">{upload.nome_arquivo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(upload.data_upload)} • {upload.total_linhas} linhas
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setUploadToDelete(upload.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {selectedUploads.length > 0 && <>
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
              </div>

              {(filtroCliente || filtroProjeto || filtroStatus !== "todos" || dataInicial || dataFinal) && <Button variant="outline" size="sm" onClick={limparFiltros}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>}
            </CardContent>
          </Card>

          {/* Cards de Métricas */}
          <ProjetosMetricsCards metrics={metricasFiltradas} projetosCompletos={projetosCompletos.length} projetosSemVenda={projetosSemVenda.length} projetosSemFotos={projetosSemFotos.length} />

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
        </>}

      {/* Upload Modal */}
      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} onUploadSuccess={handleUploadSuccess} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!uploadToDelete} onOpenChange={() => setUploadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este upload? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUpload} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}