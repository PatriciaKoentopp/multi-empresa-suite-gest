import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useUploadFiles } from "@/hooks/useUploadFiles";
import { useSpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useRelatorioFotos } from "@/hooks/useRelatorioFotos";
import { UploadModal } from "@/components/relatorios/fotos/UploadModal";
import { ProjetoAccordion } from "@/components/relatorios/fotos/ProjetoAccordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import { toast } from "sonner";

const RelatorioFotosPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUploads, setSelectedUploads] = useState<string[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<string | null>(null);

  const { uploads, isLoading: uploadsLoading, fetchUploadsByTipo, deleteUpload } = useUploadFiles();
  const { data: spreadsheetData, isLoading: dataLoading, fetchDataByUpload } = useSpreadsheetData();

  const {
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    clientesDistribuicao,
    dadosPorStatus,
    totalFotos,
  } = useRelatorioFotos(consolidatedData);

  useEffect(() => {
    fetchUploadsByTipo("fotos");
  }, []);

  useEffect(() => {
    if (selectedUploads.length > 0) {
      const fetchAllData = async () => {
        const allData: any[] = [];
        for (const uploadId of selectedUploads) {
          const result = await fetchDataByUpload(uploadId);
          if (result) {
            allData.push(...result);
          }
        }
        setConsolidatedData(allData);
      };
      fetchAllData();
    } else {
      setConsolidatedData([]);
    }
  }, [selectedUploads]);

  const handleUploadComplete = () => {
    fetchUploadsByTipo("fotos");
  };

  const handleCheckboxChange = (uploadId: string, checked: boolean) => {
    if (checked) {
      setSelectedUploads([...selectedUploads, uploadId]);
    } else {
      setSelectedUploads(selectedUploads.filter((id) => id !== uploadId));
    }
  };

  const handleDeleteClick = (uploadId: string) => {
    setUploadToDelete(uploadId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (uploadToDelete) {
      const success = await deleteUpload(uploadToDelete);
      if (success) {
        toast.success("Upload deletado com sucesso");
        setSelectedUploads(selectedUploads.filter((id) => id !== uploadToDelete));
        fetchUploadsByTipo("fotos");
      }
    }
    setDeleteDialogOpen(false);
    setUploadToDelete(null);
  };

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  if (uploadsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold">Relatório de Fotos</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Nenhuma planilha foi importada ainda
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Novo Upload
            </Button>
          </CardContent>
        </Card>
        <UploadModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    );
  }

  const formatHoursMinutes = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold">Relatório de Fotos</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Novo Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planilhas Importadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedUploads.includes(upload.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(upload.id, checked as boolean)
                    }
                  />
                  <div>
                    <p className="font-medium">{upload.nome_arquivo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(upload.data_upload).toLocaleDateString("pt-BR")} •{" "}
                      {upload.total_linhas} linhas
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(upload.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUploads.length > 0 && !dataLoading && consolidatedData.length > 0 && (
        <>
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
                    <BarChart data={[
                      { tipo: 'Tiradas', quantidade: totalFotos.fotosTiradas },
                      { tipo: 'Enviadas', quantidade: totalFotos.fotosEnviadas },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantidade" name="Quantidade de Fotos">
                        {[
                          { tipo: 'Tiradas', quantidade: totalFotos.fotosTiradas },
                          { tipo: 'Enviadas', quantidade: totalFotos.fotosEnviadas },
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Fotos Vendidas</p>
                    <p className="text-3xl font-bold">{totalFotos.fotosVendidas}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">% Enviadas / Tiradas</p>
                    <p className="text-3xl font-bold">{totalFotos.percentualEnviadas.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Enviadas / Tiradas)
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">% Vendidas / Enviadas</p>
                    <p className="text-3xl font-bold">{totalFotos.percentualVendidas.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Vendidas / Enviadas)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visão por Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="todos">
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="ativo">Ativos</TabsTrigger>
                  <TabsTrigger value="arquivado">Arquivados</TabsTrigger>
                </TabsList>
                <TabsContent value="todos">
                  <Accordion type="single" collapsible className="w-full">
                    <ProjetoAccordion projetos={projetosAgrupados} />
                  </Accordion>
                </TabsContent>
                <TabsContent value="ativo">
                  <Accordion type="single" collapsible className="w-full">
                    <ProjetoAccordion projetos={projetosAgrupados} />
                  </Accordion>
                </TabsContent>
                <TabsContent value="arquivado">
                  <Accordion type="single" collapsible className="w-full">
                    <ProjetoAccordion projetos={projetosAgrupados} />
                  </Accordion>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <UploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUploadComplete={handleUploadComplete}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este upload? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RelatorioFotosPage;
