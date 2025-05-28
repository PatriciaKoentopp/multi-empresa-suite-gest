
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ContaPagar } from "./contas-a-pagar-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface VisualizarBaixaModalProps {
  conta?: ContaPagar | null;
  open: boolean;
  onClose: () => void;
  contaCorrenteNome?: string;
}

interface AntecipacaoUtilizada {
  id: string;
  descricao: string;
  valor_utilizado: number;
}

export function VisualizarBaixaModal({ conta, open, onClose, contaCorrenteNome }: VisualizarBaixaModalProps) {
  if (!conta) return null;

  // Buscar antecipações utilizadas usando a nova tabela de relacionamento
  const { data: antecipacoesUtilizadas = [] } = useQuery({
    queryKey: ["antecipacoes-utilizadas", conta.id],
    queryFn: async () => {
      if (!conta.id) return [];

      const { data, error } = await supabase
        .from("movimentacoes_parcelas_antecipacoes")
        .select(`
          valor_utilizado,
          antecipacao:antecipacoes(id, descricao)
        `)
        .eq("movimentacao_parcela_id", conta.id);

      if (error) {
        console.error("Erro ao buscar antecipações utilizadas:", error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.antecipacao.id,
        descricao: item.antecipacao.descricao,
        valor_utilizado: item.valor_utilizado
      })) as AntecipacaoUtilizada[];
    },
    enabled: !!conta.id && open,
  });

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

  // Calcular valores
  const valorPrincipal = conta.valor || 0;
  const acrescimos = (conta.multa || 0) + (conta.juros || 0);
  const desconto = conta.desconto || 0;
  const valorTotalAntecipacoes = antecipacoesUtilizadas.reduce((total, ant) => total + ant.valor_utilizado, 0);
  const valorTotal = valorPrincipal + acrescimos - desconto;
  const valorPago = Math.max(0, valorTotal - valorTotalAntecipacoes);

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
                  <p className="text-base font-medium">{formatCurrency(valorPrincipal)}</p>
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
                  <p className="text-base">{formatCurrency(desconto)}</p>
                </div>
              </div>
              
              {antecipacoesUtilizadas.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-500 mb-2">Antecipações Utilizadas</div>
                  <div className="space-y-2">
                    {antecipacoesUtilizadas.map((antecipacao) => (
                      <div key={antecipacao.id} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                        <span className="text-sm">{antecipacao.descricao}</span>
                        <span className="text-sm font-medium text-blue-600">
                          -{formatCurrency(antecipacao.valor_utilizado)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                    <span className="text-sm font-medium">Total de Antecipações:</span>
                    <span className="text-sm font-bold text-blue-600">
                      -{formatCurrency(valorTotalAntecipacoes)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Valor Total da Conta:</p>
                    <p className="text-sm font-medium">{formatCurrency(valorTotal)}</p>
                  </div>
                  {valorTotalAntecipacoes > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm">Antecipações Utilizadas:</p>
                      <p className="text-sm text-blue-600">-{formatCurrency(valorTotalAntecipacoes)}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">Valor Pago:</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(valorPago)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
