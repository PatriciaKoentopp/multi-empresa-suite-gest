import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useSpreadsheetData } from "@/hooks/useSpreadsheetData";
import { useCompany } from "@/contexts/company-context";
import { Progress } from "@/components/ui/progress";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

export const UploadModal = ({ open, onOpenChange, onUploadComplete }: UploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { parseExcelAndInsert, isLoading } = useSpreadsheetData();
  const { currentCompany } = useCompany();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentCompany.id) return;

    const uploadId = await parseExcelAndInsert(
      selectedFile,
      currentCompany.id,
      "fotos",
      currentCompany.id
    );

    if (uploadId) {
      setSelectedFile(null);
      onOpenChange(false);
      onUploadComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Planilha de Projetos Fotográficos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste seu arquivo Excel aqui ou
            </p>
            <label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </span>
              </Button>
            </label>
          </div>

          {selectedFile && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Arquivo selecionado:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Processando planilha...</p>
              <Progress value={undefined} />
            </div>
          )}

          <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
            <p className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
              Formato esperado da planilha:
            </p>
            <ul className="text-xs text-pink-800 dark:text-pink-200 space-y-1">
              <li>• <strong>Projeto</strong>, <strong>Cliente</strong></li>
              <li>• <strong>Status</strong> (Ativo/Arquivado), <strong>Visibilidade</strong> (Público/Privado)</li>
              <li>• <strong>Faturabilidade</strong> (Yes/No)</li>
              <li>• <strong>Tarefa</strong> (lista separada por vírgula)</li>
              <li>• <strong>Rastreado (h)</strong>, <strong>Estimado (h)</strong></li>
              <li>• <strong>Remanescente (h)</strong>, <strong>Excesso (h)</strong></li>
              <li>• <strong>Progresso(%)</strong></li>
              <li>• <strong>Faturável (h)</strong>, <strong>Não faturável (h)</strong></li>
              <li>• <strong>Valor faturável (Real)</strong>, <strong>Valor (Real)</strong></li>
              <li>• <strong>Projeto membros</strong>, <strong>Projeto gerente</strong></li>
              <li>• <strong>Observação</strong> (opcional)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
              {isLoading ? "Processando..." : "Fazer Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
