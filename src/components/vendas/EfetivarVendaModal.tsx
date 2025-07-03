import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Orcamento } from "@/types";

interface EfetivarVendaModalProps {
  orcamento: Orcamento | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EfetivarVendaModal({ orcamento, isOpen, onClose, onSuccess }: EfetivarVendaModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orcamento) return;

    try {
      setIsLoading(true);

      // Simulação de um atraso na API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Chamar a API para efetivar a venda
      const response = await api.put(`/orcamentos/${orcamento.id}`, {
        ...orcamento,
        status: 'aprovado',
        data_venda: new Date().toISOString(),
      });

      if (response.status === 200) {
        toast.success('Venda efetivada com sucesso!');
        onSuccess();
        onClose();
      } else {
        toast.error('Erro ao efetivar venda.');
      }
      
      console.log('Efetivando venda para favorecido ID:', orcamento.favorecido_id);

    } catch (error) {
      console.error('Erro ao efetivar venda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogTrigger asChild>
        <Button variant="blue">Efetivar Venda</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Efetivar Venda</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja efetivar esta venda?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Efetivando...' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
