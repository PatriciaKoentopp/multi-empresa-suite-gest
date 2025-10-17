import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Clock, FileText, Trash2 } from "lucide-react";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { useSpreadsheetData, SpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useRelatorioTempo } from "@/hooks/useRelatorioTempo";
import { UploadModal } from "@/components/relatorios/tempo/UploadModal";
import { ProjetoAccordion } from "@/components/relatorios/tempo/ProjetoAccordion";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { formatHoursMinutes } from "@/utils/timeUtils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
export default function RelatorioTempoPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadIds, setSelectedUploadIds] = useState<string[]>([]);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);
  const [consolidatedData, setConsolidatedData] = useState<SpreadsheetData[]>([]);
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
    tarefasDistribuicao
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
                </CardHeader>
                <CardContent>
                  <ProjetoAccordion projetos={projetosAgrupados} />
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