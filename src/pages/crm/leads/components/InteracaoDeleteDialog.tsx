
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { LeadInteracao } from "../types";

interface InteracaoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interacao?: LeadInteracao | null;
  onDelete: () => void;
}

export function InteracaoDeleteDialog({ open, onOpenChange, interacao, onDelete }: InteracaoDeleteDialogProps) {
  // Verificar se a interação pode ser excluída (apenas status Aberto)
  const podeExcluir = interacao && interacao.status === "Aberto";
  
  // Função para lidar com o clique no botão de excluir
  const handleDelete = () => {
    // Só permite excluir se o status for "Aberto"
    if (podeExcluir) {
      onDelete();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            {podeExcluir 
              ? "Tem certeza de que deseja excluir esta interação? Esta ação não pode ser desfeita."
              : "Não é possível excluir esta interação. Apenas interações com status 'Aberto' podem ser excluídas."}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!podeExcluir}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
