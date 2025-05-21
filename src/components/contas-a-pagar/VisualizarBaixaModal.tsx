
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ContaPagar } from "./contas-a-pagar-table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VisualizarBaixaModalProps {
  conta?: ContaPagar | null;
  open: boolean;
  onClose: () => void;
  contaCorrenteNome?: string;
}

export function VisualizarBaixaModal({ conta, open, onClose, contaCorrenteNome }: VisualizarBaixaModalProps) {
  if (!conta) return null;

  // Função para formatar a forma de pagamento
  const formatFormaPagamento = (forma?: string) => {
    if (!forma) return "-";
    
    const formatos: Record<string, string> = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      boleto: "Boleto",
      transferencia: "Transferência",
      cartao_debito: "Cartão de Débito",
      cartao_credito: "Cartão de Crédito",
      cheque: "Cheque"
    };
    
    return formatos[forma] || forma;
  };

  // Calcular valor total
  const valorTotal = (conta.valor || 0) + 
    (conta.multa || 0) + 
    (conta.juros || 0) - 
    (conta.desconto || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Baixa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Favorecido</p>
              <p className="text-base">{conta.favorecido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Descrição</p>
              <p className="text-base">{conta.descricao || "-"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Vencimento</p>
              <p className="text-base">{formatDate(conta.dataVencimento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
              <p className="text-base">{formatDate(conta.dataPagamento)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Conta Corrente</p>
            <p className="text-base">{contaCorrenteNome || "-"}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Forma de Pagamento</p>
            <p className="text-base">{formatFormaPagamento(conta.formaPagamento)}</p>
          </div>
          
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor Principal</p>
                  <p className="text-base font-medium">{formatCurrency(conta.valor)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Multa</p>
                  <p className="text-base">{formatCurrency(conta.multa || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Juros</p>
                  <p className="text-base">{formatCurrency(conta.juros || 0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Desconto</p>
                  <p className="text-base">{formatCurrency(conta.desconto || 0)}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold">Valor Total</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(valorTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
