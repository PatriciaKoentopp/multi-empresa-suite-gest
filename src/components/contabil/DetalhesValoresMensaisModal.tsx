
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ValorMensal } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface DetalhesValoresMensaisModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  valores: ValorMensal[];
  media: number;
  periodoInicio?: string;
  periodoFim?: string;
}

export function DetalhesValoresMensaisModal({
  isOpen,
  onClose,
  titulo,
  valores,
  media,
  periodoInicio,
  periodoFim
}: DetalhesValoresMensaisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">{titulo}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Valores mensais utilizados no cálculo da média
          </DialogDescription>
          <DialogClose className="absolute right-4 top-4 opacity-70 hover:opacity-100" asChild>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Mês/Ano</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valores.length > 0 ? (
                // Ordenamos os valores por ano e mês em ordem decrescente
                valores
                  .sort((a, b) => {
                    // Comparando por ano (decrescente)
                    if (a.ano !== b.ano) {
                      return b.ano - a.ano;
                    }
                    // Se mesmo ano, comparar por mês (decrescente)
                    return b.mes - a.mes;
                  })
                  .map((item, index) => (
                    <TableRow key={`${item.ano}-${item.mes}-${index}`}>
                      <TableCell>{item.mes_nome}/{item.ano}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                    Não há dados disponíveis para este período
                  </TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell>Média</TableCell>
                <TableCell className="text-right">{formatCurrency(media)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {(periodoInicio && periodoFim) && (
          <Alert className="mt-4 bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Período de análise: Os valores apresentados correspondem aos 12 meses anteriores 
              a {periodoFim}, desde {periodoInicio} até {periodoFim}.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
