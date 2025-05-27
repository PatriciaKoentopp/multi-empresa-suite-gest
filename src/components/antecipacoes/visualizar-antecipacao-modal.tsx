
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Antecipacao } from "./antecipacao-table";

interface VisualizarAntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  antecipacao: Antecipacao | null;
}

export function VisualizarAntecipacaoModal({ open, onClose, antecipacao }: VisualizarAntecipacaoModalProps) {
  if (!antecipacao) return null;

  function formatData(data: Date) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }

  function getStatusBadge(status: Antecipacao["status"]) {
    switch (status) {
      case "ativa":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Ativa
          </span>
        );
      case "utilizada":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Utilizada
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
            Cancelada
          </span>
        );
      default:
        return status;
    }
  }

  function getTipoBadge(tipo: Antecipacao["tipoOperacao"]) {
    switch (tipo) {
      case "receber":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
            Recebimento
          </span>
        );
      case "pagar":
        return (
          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
            Pagamento
          </span>
        );
      default:
        return tipo;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Antecipação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Primeira linha - Tipo e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Tipo de Operação</Label>
              <div>{getTipoBadge(antecipacao.tipoOperacao)}</div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div>{getStatusBadge(antecipacao.status)}</div>
            </div>
          </div>

          {/* Segunda linha - Data e Favorecido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Data da Antecipação</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {formatData(antecipacao.dataAntecipacao)}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Favorecido</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {antecipacao.favorecido}
              </div>
            </div>
          </div>

          {/* Terceira linha - Conta Corrente */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Conta Corrente</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {antecipacao.contaCorrente}
              </div>
            </div>
          </div>

          {/* Quarta linha - Valores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Valor Total</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm font-medium">
                {formatCurrency(antecipacao.valorTotal)}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Valor Utilizado</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {formatCurrency(antecipacao.valorUtilizado)}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Valor Disponível</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm font-medium text-green-600">
                {formatCurrency(antecipacao.valorDisponivel)}
              </div>
            </div>
          </div>

          {/* Quinta linha - Descrição */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-gray-700">Descrição</Label>
            <div className="p-2 bg-gray-50 rounded border text-sm min-h-[80px]">
              {antecipacao.descricao || "Nenhuma descrição informada"}
            </div>
          </div>

          {/* Botão */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
