
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserRound, CheckCircle, Circle } from "lucide-react";
import { LeadInteracao } from "../types";
import { getIconForInteraction } from "../utils/leadUtils";

interface InteracaoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interacao: LeadInteracao | null;
  onEdit: () => void;
  getNomeResponsavel: (id: string) => string;
}

export function InteracaoViewDialog({ 
  open, 
  onOpenChange, 
  interacao, 
  onEdit,
  getNomeResponsavel 
}: InteracaoViewDialogProps) {
  if (!interacao) return null;

  // Função para formatar a data no padrão brasileiro DD/MM/YYYY
  const formatarDataBR = (dataStr: string): string => {
    if (!dataStr) return "-";
    
    // Se já estiver no formato DD/MM/YYYY, retornar como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) return dataStr;
    
    // Se estiver no formato ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Para outros formatos, tentar converter
    try {
      const data = new Date(dataStr);
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return dataStr; // Retornar o valor original se falhar
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Interação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="bg-primary/10 p-2 rounded-full">
              {getIconForInteraction(interacao.tipo)}
            </div>
            <div className="flex-1">
              <p className="font-medium capitalize">{interacao.tipo}</p>
              <p className="text-muted-foreground text-xs">{formatarDataBR(interacao.data)}</p>
            </div>
            <div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                interacao.status === "Realizado" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              }`}>
                {interacao.status === "Realizado" ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <Circle className="mr-1 h-3 w-3" />
                )}
                {interacao.status}
              </span>
            </div>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <p className="font-medium">{interacao.responsavelNome || getNomeResponsavel(interacao.responsavelId)}</p>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <div className="mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
              {interacao.descricao}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Fechar</Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
