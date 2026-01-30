import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useBackup, backupTables } from '@/hooks/useBackup';
import { Download, Database, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BackupPage() {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const { generateBackup, isGenerating, progress, currentTable } = useBackup();
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Inicializar com todas as tabelas selecionadas
  useEffect(() => {
    setSelectedTables(backupTables.map(t => t.id));
    
    // Carregar último backup do localStorage
    const saved = localStorage.getItem('lastBackupDate');
    if (saved) {
      setLastBackup(saved);
    }
  }, []);

  const handleSelectAll = () => {
    setSelectedTables(backupTables.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedTables([]);
  };

  const handleToggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleGenerateBackup = async () => {
    if (selectedTables.length === 0) {
      toast.error('Selecione ao menos uma tabela para o backup');
      return;
    }

    try {
      const result = await generateBackup(selectedTables);
      
      if (result.success) {
        const now = format(new Date(), 'dd/MM/yyyy HH:mm');
        setLastBackup(now);
        localStorage.setItem('lastBackupDate', now);
        
        toast.success('Backup gerado com sucesso!', {
          description: `Arquivo: ${result.fileName}`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar backup:', error);
      toast.error('Erro ao gerar backup', {
        description: error.message || 'Tente novamente mais tarde',
      });
    }
  };

  const allSelected = selectedTables.length === backupTables.length;
  const noneSelected = selectedTables.length === 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Backup de Dados</CardTitle>
              <CardDescription>
                Gere um backup completo dos dados da empresa em formato Excel
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ações de seleção */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={allSelected || isGenerating}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Selecionar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={noneSelected || isGenerating}
            >
              <Square className="h-4 w-4 mr-2" />
              Desmarcar Todas
            </Button>
          </div>

          {/* Lista de tabelas */}
          <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backupTables.map(table => (
                <div 
                  key={table.id}
                  className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                  onClick={() => !isGenerating && handleToggleTable(table.id)}
                >
                  <Checkbox
                    id={table.id}
                    checked={selectedTables.includes(table.id)}
                    onCheckedChange={() => handleToggleTable(table.id)}
                    disabled={isGenerating}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={table.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {table.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {table.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progresso */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processando: {currentTable}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Botão de gerar backup */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedTables.length} de {backupTables.length} tabelas selecionadas
              {lastBackup && (
                <span className="block mt-1">
                  Último backup: {lastBackup}
                </span>
              )}
            </div>
            
            <Button
              onClick={handleGenerateBackup}
              disabled={isGenerating || noneSelected}
              className="min-w-[180px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
