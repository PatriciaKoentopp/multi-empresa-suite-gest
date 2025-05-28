
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ContaReceber } from "./contas-a-receber-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

// Expandir a interface ContaReceber para incluir as propriedades necessárias
interface VisualizarBaixaModalProps {
  conta?: (ContaReceber & {
    dataRecebimento?: Date;
    formaPagamento?: string;
    multa?: number;
    juros?: number;
    desconto?: number;
  }) | null;
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
  const { currentCompany } = useCompany();
  const [antecipacoesUtilizadas, setAntecipacoesUtilizadas] = useState<AntecipacaoUtilizada[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && conta?.id) {
      buscarAntecipacoesUtilizadas();
    }
  }, [open, conta?.id]);

  const buscarAntecipacoesUtilizadas = async () => {
    if (!conta?.id || !currentCompany?.id) return;

    setIsLoading(true);
    try {
      // Primeiro, verificar se existe antecipacao_id na parcela (formato antigo)
      const { data: parcela, error: parcelaError } = await supabase
        .from("movimentacoes_parcelas")
        .select("antecipacao_id, valor_antecipacao_utilizado")
        .eq("id", conta.id)
        .single();

      if (parcelaError) {
        console.error("Erro ao buscar parcela:", parcelaError);
        return;
      }

      const antecipacoes: AntecipacaoUtilizada[] = [];

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

      // TODO: Buscar registros de múltiplas antecipações quando implementarmos a tabela de relacionamento
      // Por enquanto, vamos mostrar apenas a antecipação do formato atual

      setAntecipacoesUtilizadas(antecipacoes);
    } catch (error) {
      console.error("Erro ao buscar antecipações utilizadas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!conta) return null;

  // Função para formatar a forma de pagamento
  const formatFormaPagamento = (forma?: string) => {
    if (!forma) return "-";
    
    const formatos: Record<string, string> = {
      "1": "Dinheiro",
      "2": "Cartão", 
      "3": "Boleto",
      "4": "Transferência",
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
  const valorOriginal = conta.valor || 0;
  const valorAntecipacoes = antecipacoesUtilizadas.reduce((total, ant) => total + ant.valor_utilizado, 0);
  const valorComAcrescimos = valorOriginal + (conta.multa || 0) + (conta.juros || 0) - (conta.desconto || 0);
  const valorEfetivamenteRecebido = valorComAcrescimos - valorAntecipacoes;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Cliente</p>
              <p className="text-base">{conta.cliente}</p>
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
              <p className="text-sm font-medium text-gray-500">Data de Recebimento</p>
              <p className="text-base">{conta.dataRecebimento ? formatDate(conta.dataRecebimento) : "-"}</p>
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
                    {formatCurrency(valorAntecipacoes)}
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
                  <p className="text-base font-medium">{formatCurrency(valorOriginal)}</p>
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

              {valorAntecipacoes > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Antecipações utilizadas:</span>
                    <span className="text-blue-600">-{formatCurrency(valorAntecipacoes)}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold">
                    {valorAntecipacoes > 0 ? "Valor Efetivamente Recebido" : "Valor Total"}
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(valorAntecipacoes > 0 ? valorEfetivamenteRecebido : valorComAcrescimos)}
                  </p>
                </div>
                {valorAntecipacoes > 0 && (
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>Valor total da conta:</span>
                    <span>{formatCurrency(valorComAcrescimos)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
