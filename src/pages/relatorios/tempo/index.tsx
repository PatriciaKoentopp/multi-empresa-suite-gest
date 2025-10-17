import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Clock, DollarSign, FileText, Users, TrendingUp } from "lucide-react";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { useSpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useRelatorioTempo } from "@/hooks/useRelatorioTempo";
import { UploadModal } from "@/components/relatorios/tempo/UploadModal";
import { ProjetoAccordion } from "@/components/relatorios/tempo/ProjetoAccordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { formatHoursDisplay } from "@/utils/timeUtils";

export default function RelatorioTempoPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  
  const { uploads, isLoading: uploadsLoading, fetchUploadsByTipo } = useUploadFiles();
  const { data: spreadsheetData, isLoading: dataLoading, fetchDataByUpload } = useSpreadsheetData();
  const { metrics, projetosAgrupados } = useRelatorioTempo(spreadsheetData);

  useEffect(() => {
    fetchUploadsByTipo("tempo");
  }, []);

  useEffect(() => {
    if (selectedUploadId) {
      fetchDataByUpload(selectedUploadId);
    }
  }, [selectedUploadId]);

  const handleUploadComplete = () => {
    fetchUploadsByTipo("tempo");
  };

  if (uploadsLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="container mx-auto p-6">
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
        <UploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onUploadComplete={handleUploadComplete}
        />
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
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Novo Upload
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Selecione a planilha
              </label>
              <Select value={selectedUploadId || ""} onValueChange={setSelectedUploadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma planilha..." />
                </SelectTrigger>
                <SelectContent>
                  {uploads.map((upload) => (
                    <SelectItem key={upload.id} value={upload.id}>
                      {upload.nome_arquivo} - {format(new Date(upload.data_upload), "dd/MM/yyyy HH:mm")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedUploadId && !dataLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHoursDisplay(metrics.totalHoras)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Faturáveis</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatHoursDisplay(metrics.horasFaturaveis)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalHoras > 0
                    ? ((metrics.horasFaturaveis / metrics.totalHoras) * 100).toFixed(1)
                    : 0}% do total
                </p>
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
                <CardTitle className="text-sm font-medium">Valor Faturável</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {metrics.valorTotalFaturavel.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

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
        </>
      )}

      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};
