
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
  data_lancamento: string;
  numero_documento: string;
  valor_utilizado: number;
}

export function VisualizarBaixaModal({ conta, open, onClose, contaCorrenteNome }: VisualizarBaixaModalProps) {
  if (!conta) return null;

  // Buscar antecipações utilizadas usando a nova tabela de relacionamento
  const { data: antecipacoesUtilizadas = [] } = useQuery({
    queryKey: ["antecipacoes-utilizadas", conta.id],
    queryFn: async () => {
      if (!conta.id) return [];

      console.log("Buscando antecipações para parcela:", conta.id);

      // Buscar na nova tabela de relacionamento
      const { data: relacionamentos, error: relError } = await supabase
        .from("movimentacoes_parcelas_antecipacoes")
        .select(`
          valor_utilizado,
          antecipacao_id,
          antecipacoes (
            id,
            descricao,
            data_lancamento,
            numero_documento
          )
        `)
        .eq("movimentacao_parcela_id", conta.id);

      if (relError) {
        console.error("Erro ao buscar relacionamentos:", relError);
      }

      console.log("Relacionamentos encontrados:", relacionamentos);

      const antecipacoes: AntecipacaoUtilizada[] = [];

      // Se encontrou relacionamentos na nova tabela
      if (relacionamentos && relacionamentos.length > 0) {
        for (const rel of relacionamentos) {
          if (rel.antecipacoes) {
            antecipacoes.push({
              id: rel.antecipacoes.id,
              descricao: rel.antecipacoes.descricao || "Antecipação",
              data_lancamento: rel.antecipacoes.data_lancamento,
              numero_documento: rel.antecipacoes.numero_documento || "-",
              valor_utilizado: rel.valor_utilizado
            });
          }
        }
      } else {
        // Fallback: verificar se existe antecipacao_id na parcela (formato antigo)
        const { data: parcela, error: parcelaError } = await supabase
          .from("movimentacoes_parcelas")
          .select("antecipacao_id, valor_antecipacao_utilizado")
          .eq("id", conta.id)
          .single();

        if (parcelaError) {
          console.error("Erro ao buscar parcela:", parcelaError);
          return [];
        }

        console.log("Dados da parcela (formato antigo):", parcela);

        // Se tem antecipacao_id (formato antigo - uma única antecipação)
        if (parcela?.antecipacao_id && parcela?.valor_antecipacao_utilizado > 0) {
          const { data: antecipacao, error: antError } = await supabase
            .from("antecipacoes")
            .select("id, descricao, data_lancamento, numero_documento")
            .eq("id", parcela.antecipacao_id)
            .single();

          if (!antError && antecipacao) {
            antecipacoes.push({
              id: antecipacao.id,
              descricao: antecipacao.descricao || "Antecipação",
              data_lancamento: antecipacao.data_lancamento,
              numero_documento: antecipacao.numero_documento || "-",
              valor_utilizado: parcela.valor_antecipacao_utilizado
            });
          }
        }
      }

      console.log("Antecipações processadas:", antecipacoes);
      return antecipacoes;
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
          
          {/* Seção de Antecipações Utilizadas */}
          {antecipacoesUtilizadas.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Antecipações Utilizadas</p>
              <div className="space-y-3">
                {antecipacoesUtilizadas.map((antecipacao) => (
                  <div key={antecipacao.id} className="border rounded-md p-3 bg-blue-50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-700">{antecipacao.descricao}</p>
                        <p className="text-sm font-bold text-blue-600">
                          {formatCurrency(antecipacao.valor_utilizado)}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Data Lançamento:</span>
                          <br />
                          {formatDate(new Date(antecipacao.data_lancamento))}
                        </div>
                        <div>
                          <span className="font-medium">Nº Documento:</span>
                          <br />
                          {antecipacao.numero_documento}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1 border-t">
                  <p className="text-sm font-medium text-gray-700">Total das antecipações:</p>
                  <p className="text-sm font-bold text-blue-600">
                    {formatCurrency(valorTotalAntecipacoes)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
              
              {valorTotalAntecipacoes > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Antecipações utilizadas:</span>
                    <span className="text-blue-600">-{formatCurrency(valorTotalAntecipacoes)}</span>
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
                    <p className="text-sm font-bold">
                      {valorTotalAntecipacoes > 0 ? "Valor Efetivamente Pago:" : "Valor Total:"}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(valorTotalAntecipacoes > 0 ? valorPago : valorTotal)}
                    </p>
                  </div>
                  {valorTotalAntecipacoes > 0 && (
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>Valor total da conta:</span>
                      <span>{formatCurrency(valorTotal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
