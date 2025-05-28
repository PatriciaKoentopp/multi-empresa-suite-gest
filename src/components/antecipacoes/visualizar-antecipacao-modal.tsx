import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Antecipacao } from "./antecipacao-table";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface VisualizarAntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  antecipacao: Antecipacao | null;
}

interface AntecipacaoCompleta {
  id: string;
  data_emissao: string;
  data_lancamento: string;
  mes_referencia: string | null;
  numero_documento: string | null;
  tipo_titulo_nome: string | null;
  favorecido_nome: string;
  forma_pagamento: string;
  conta_corrente_nome: string;
  valor_total: number;
  valor_utilizado: number;
  descricao: string | null;
  status: string;
  conciliada: boolean;
}

interface MovimentacaoUtilizada {
  id: string;
  numero_parcela: number;
  valor_utilizado: number;
  favorecido_nome: string;
  descricao: string | null;
  data_vencimento: string;
  numero_documento: string | null;
}

export function VisualizarAntecipacaoModal({ open, onClose, antecipacao }: VisualizarAntecipacaoModalProps) {
  const { currentCompany } = useCompany();
  const [antecipacaoCompleta, setAntecipacaoCompleta] = useState<AntecipacaoCompleta | null>(null);
  const [movimentacoesUtilizadas, setMovimentacoesUtilizadas] = useState<MovimentacaoUtilizada[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (antecipacao && open && currentCompany?.id) {
      carregarDadosCompletos();
    }
  }, [antecipacao, open, currentCompany]);

  const carregarDadosCompletos = async () => {
    if (!antecipacao) return;

    try {
      setIsLoading(true);

      // Buscar dados completos da antecipação
      const { data: antecipacaoData, error: antecipacaoError } = await supabase
        .from("antecipacoes")
        .select("*")
        .eq("id", antecipacao.id)
        .single();

      if (antecipacaoError) {
        console.error("Erro ao carregar antecipação:", antecipacaoError);
        return;
      }

      // Buscar dados relacionados
      const [tipoTituloData, favorecidoData, contaCorrenteData] = await Promise.all([
        antecipacaoData.tipo_titulo_id 
          ? supabase.from("tipos_titulos").select("nome").eq("id", antecipacaoData.tipo_titulo_id).single()
          : Promise.resolve({ data: null }),
        supabase.from("favorecidos").select("nome").eq("id", antecipacaoData.favorecido_id).single(),
        supabase.from("contas_correntes").select("nome, banco").eq("id", antecipacaoData.conta_corrente_id).single()
      ]);

      // Verificar se está conciliada no fluxo de caixa
      const { data: fluxoCaixaData } = await supabase
        .from("fluxo_caixa")
        .select("situacao")
        .eq("antecipacao_id", antecipacao.id)
        .single();

      const antecipacaoCompleta: AntecipacaoCompleta = {
        id: antecipacaoData.id,
        data_emissao: antecipacaoData.data_emissao,
        data_lancamento: antecipacaoData.data_lancamento,
        mes_referencia: antecipacaoData.mes_referencia,
        numero_documento: antecipacaoData.numero_documento,
        tipo_titulo_nome: tipoTituloData.data?.nome || null,
        favorecido_nome: favorecidoData.data?.nome || "N/A",
        forma_pagamento: antecipacaoData.forma_pagamento,
        conta_corrente_nome: contaCorrenteData.data ? `${contaCorrenteData.data.nome} - ${contaCorrenteData.data.banco}` : "N/A",
        valor_total: Number(antecipacaoData.valor_total),
        valor_utilizado: Number(antecipacaoData.valor_utilizado),
        descricao: antecipacaoData.descricao,
        status: antecipacaoData.status,
        conciliada: fluxoCaixaData?.situacao === 'conciliado'
      };

      setAntecipacaoCompleta(antecipacaoCompleta);

      // Buscar movimentações que utilizaram esta antecipação
      const { data: utilizacoesData, error: utilizacoesError } = await supabase
        .from("movimentacoes_parcelas_antecipacoes")
        .select(`
          valor_utilizado,
          movimentacao_parcela_id,
          movimentacoes_parcelas!inner(
            numero,
            data_vencimento,
            movimentacao_id,
            movimentacoes!inner(
              favorecido_id,
              descricao,
              numero_documento,
              favorecidos!inner(nome)
            )
          )
        `)
        .eq("antecipacao_id", antecipacao.id);

      if (utilizacoesError) {
        console.error("Erro ao carregar utilizações:", utilizacoesError);
      } else if (utilizacoesData) {
        const movimentacoes: MovimentacaoUtilizada[] = utilizacoesData.map(item => ({
          id: item.movimentacao_parcela_id,
          numero_parcela: item.movimentacoes_parcelas.numero,
          valor_utilizado: Number(item.valor_utilizado),
          favorecido_nome: item.movimentacoes_parcelas.movimentacoes.favorecidos.nome,
          descricao: item.movimentacoes_parcelas.movimentacoes.descricao,
          data_vencimento: item.movimentacoes_parcelas.data_vencimento,
          numero_documento: item.movimentacoes_parcelas.movimentacoes.numero_documento
        }));

        setMovimentacoesUtilizadas(movimentacoes);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function formatData(dataStr: string) {
    const data = new Date(dataStr + 'T12:00:00');
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
  }

  function getStatusBadge(status: string) {
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

  function getTipoBadge(tipo: string) {
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

  if (!antecipacao) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Antecipação</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : antecipacaoCompleta && (
          <div className="space-y-6 pt-4">
            {/* Primeira linha - Tipo e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Tipo de Operação</Label>
                <div>{getTipoBadge(antecipacao.tipoOperacao)}</div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(antecipacaoCompleta.status)}
                  {antecipacaoCompleta.conciliada && (
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20">
                      Conciliada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Segunda linha - Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Data de Emissão</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {formatData(antecipacaoCompleta.data_emissao)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Data de Lançamento</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {formatData(antecipacaoCompleta.data_lancamento)}
                </div>
              </div>
            </div>

            {/* Terceira linha - Mês Referência e Número Doc */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Mês de Referência</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.mes_referencia || "Não informado"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Número do Documento</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.numero_documento || "Não informado"}
                </div>
              </div>
            </div>

            {/* Quarta linha - Tipo Título e Favorecido */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Tipo de Título</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.tipo_titulo_nome || "Não informado"}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Favorecido</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.favorecido_nome}
                </div>
              </div>
            </div>

            {/* Quinta linha - Forma Pagamento e Conta Corrente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Forma de Pagamento</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.forma_pagamento}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Conta Corrente</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {antecipacaoCompleta.conta_corrente_nome}
                </div>
              </div>
            </div>

            {/* Sexta linha - Valores */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Valor Total</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm font-medium">
                  {formatCurrency(antecipacaoCompleta.valor_total)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Valor Utilizado</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm">
                  {formatCurrency(antecipacaoCompleta.valor_utilizado)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-sm font-medium text-gray-700">Valor Disponível</Label>
                <div className="p-2 bg-gray-50 rounded border text-sm font-medium text-green-600">
                  {formatCurrency(antecipacaoCompleta.valor_total - antecipacaoCompleta.valor_utilizado)}
                </div>
              </div>
            </div>

            {/* Sétima linha - Descrição */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium text-gray-700">Descrição</Label>
              <div className="p-2 bg-gray-50 rounded border text-sm min-h-[80px]">
                {antecipacaoCompleta.descricao || "Nenhuma descrição informada"}
              </div>
            </div>

            {/* Movimentações que utilizaram a antecipação */}
            {movimentacoesUtilizadas.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <Label className="text-lg font-medium text-gray-900">Movimentações que Utilizaram esta Antecipação</Label>
                </div>
                
                <div className="space-y-3">
                  {movimentacoesUtilizadas.map((mov, index) => (
                    <div key={mov.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Favorecido</Label>
                          <div className="font-medium">{mov.favorecido_nome}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Nº Documento</Label>
                          <div className="font-medium">{mov.numero_documento || "-"}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Parcela</Label>
                          <div className="font-medium">Nº {mov.numero_parcela}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Data Vencimento</Label>
                          <div className="font-medium">{formatData(mov.data_vencimento)}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Valor Utilizado</Label>
                          <div className="font-medium text-blue-600">{formatCurrency(mov.valor_utilizado)}</div>
                        </div>
                      </div>
                      {mov.descricao && (
                        <div className="mt-2">
                          <Label className="text-xs font-medium text-gray-600">Descrição</Label>
                          <div className="text-sm">{mov.descricao}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
