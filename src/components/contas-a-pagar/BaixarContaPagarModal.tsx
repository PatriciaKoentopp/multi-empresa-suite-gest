
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ContaPagar } from "./contas-a-pagar-table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Antecipacao, AntecipacaoSelecionada } from "@/types/financeiro";

interface BaixarContaPagarModalProps {
  conta?: ContaPagar | null;
  open: boolean;
  onClose: () => void;
  onBaixar: (dados: {
    dataPagamento: Date;
    contaCorrenteId: string;
    formaPagamento: string;
    multa: number;
    juros: number;
    desconto: number;
    antecipacoesSelecionadas?: AntecipacaoSelecionada[];
  }) => void;
}

// Formas de pagamento fixas
const formasPagamento = [
  { id: "dinheiro", nome: "Dinheiro" },
  { id: "pix", nome: "PIX" },
  { id: "boleto", nome: "Boleto" },
  { id: "transferencia", nome: "Transferência" },
  { id: "cartao_debito", nome: "Cartão de Débito" },
  { id: "cartao_credito", nome: "Cartão de Crédito" },
  { id: "cheque", nome: "Cheque" },
  { id: "desconto", nome: "Desconto" }
];

export function BaixarContaPagarModal({ conta, open, onClose, onBaixar }: BaixarContaPagarModalProps) {
  const { currentCompany } = useCompany();
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(conta?.dataVencimento);
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [multa, setMulta] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  
  // Estados para múltiplas antecipações
  const [usarAntecipacao, setUsarAntecipacao] = useState<boolean>(false);
  const [antecipacoesSelecionadas, setAntecipacoesSelecionadas] = useState<AntecipacaoSelecionada[]>([]);

  // Buscar favorecido_id da conta
  const [favorecidoId, setFavorecidoId] = useState<string | null>(null);

  // Buscar contas correntes
  const { data: contasCorrente = [] } = useQuery({
    queryKey: ["contas-correntes", currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("*")
        .eq("empresa_id", currentCompany?.id)
        .eq("status", "ativo");

      if (error) {
        console.error("Erro ao buscar contas correntes:", error);
        return [];
      }

      return data;
    },
    enabled: !!currentCompany?.id,
  });

  // Buscar antecipações disponíveis do favorecido
  const { data: antecipacoesDisponiveis = [] } = useQuery({
    queryKey: ["antecipacoes-favorecido", favorecidoId, currentCompany?.id],
    queryFn: async () => {
      if (!favorecidoId) return [];

      const { data, error } = await supabase
        .from("antecipacoes")
        .select("id, descricao, valor_total, valor_utilizado")
        .eq("empresa_id", currentCompany?.id)
        .eq("favorecido_id", favorecidoId)
        .eq("tipo_operacao", "pagar")
        .eq("status", "ativa")
        .gt("valor_total", 0);

      if (error) {
        console.error("Erro ao buscar antecipações:", error);
        return [];
      }

      // Calcular valor disponível e filtrar apenas as que têm saldo
      return data
        .map(ant => ({
          ...ant,
          valor_disponivel: ant.valor_total - ant.valor_utilizado
        }))
        .filter(ant => ant.valor_disponivel > 0);
    },
    enabled: !!favorecidoId && !!currentCompany?.id,
  });

  // Buscar favorecido_id quando a conta mudar
  useEffect(() => {
    if (conta?.movimentacao_id) {
      const buscarFavorecido = async () => {
        const { data, error } = await supabase
          .from("movimentacoes")
          .select("favorecido_id")
          .eq("id", conta.movimentacao_id)
          .single();

        if (!error && data) {
          setFavorecidoId(data.favorecido_id);
        }
      };

      buscarFavorecido();
    }
  }, [conta]);

  useEffect(() => {
    if (open) {
      setDataPagamento(conta?.dataVencimento);
      setContaCorrenteId("");
      setFormaPagamento("");
      setMulta(0);
      setJuros(0);
      setDesconto(0);
      setUsarAntecipacao(false);
      setAntecipacoesSelecionadas([]);
    }
  }, [conta, open]);

  // Calcular valores
  const valorConta = conta?.valor || 0;
  const valorAcrescimos = multa + juros;
  const valorTotalAntecipacoes = antecipacoesSelecionadas.reduce((total, ant) => total + ant.valor, 0);
  const valorTotalConta = valorConta + valorAcrescimos - desconto;
  const valorAPagar = Math.max(0, valorTotalConta - valorTotalAntecipacoes);

  // Funções para gerenciar antecipações selecionadas
  const handleAntecipacaoChange = (antecipacaoId: string, checked: boolean) => {
    if (checked) {
      const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antecipacaoId);
      if (antecipacao) {
        // Preencher automaticamente com o valor disponível da antecipação
        const valorDisponivel = antecipacao.valor_disponivel;
        setAntecipacoesSelecionadas(prev => [
          ...prev,
          { id: antecipacaoId, valor: valorDisponivel }
        ]);
      }
    } else {
      setAntecipacoesSelecionadas(prev => prev.filter(ant => ant.id !== antecipacaoId));
    }
  };

  const handleValorAntecipacaoChange = (antecipacaoId: string, valor: number) => {
    setAntecipacoesSelecionadas(prev =>
      prev.map(ant =>
        ant.id === antecipacaoId ? { ...ant, valor } : ant
      )
    );
  };

  const getMaxValorAntecipacao = (antecipacaoId: string) => {
    const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antecipacaoId);
    const valorJaUsado = antecipacoesSelecionadas
      .filter(ant => ant.id !== antecipacaoId)
      .reduce((total, ant) => total + ant.valor, 0);
    const valorRestante = Math.max(0, valorTotalConta - valorJaUsado);
    
    return Math.min(
      antecipacao?.valor_disponivel || 0,
      valorRestante
    );
  };

  async function handleConfirmar() {
    // Conta corrente obrigatória quando há valor a pagar OU quando usar antecipação
    if (!dataPagamento || !formaPagamento || (!contaCorrenteId && (valorAPagar > 0 || usarAntecipacao))) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (usarAntecipacao && antecipacoesSelecionadas.length === 0) {
      toast.error("Selecione pelo menos uma antecipação.");
      return;
    }

    // Validar valores das antecipações
    for (const antSel of antecipacoesSelecionadas) {
      const maxValor = getMaxValorAntecipacao(antSel.id);
      if (antSel.valor <= 0) {
        toast.error("Informe valores válidos para as antecipações selecionadas.");
        return;
      }
      if (antSel.valor > maxValor) {
        toast.error("Valor da antecipação não pode exceder o disponível ou o valor da conta.");
        return;
      }
    }

    try {
      // Buscar dados completos da movimentação para obter descrição
      let descricao: string | null = null;
      
      if (conta?.movimentacao_id) {
        const { data: movimentacao, error: movError } = await supabase
          .from("movimentacoes")
          .select("descricao")
          .eq("id", conta.movimentacao_id)
          .single();
          
        if (!movError && movimentacao) {
          descricao = movimentacao.descricao;
        }
      }

      // 1. Atualizar a parcela com os dados do pagamento
      const updateData: any = {
        data_pagamento: format(dataPagamento, "yyyy-MM-dd"),
        multa,
        juros,
        desconto,
        forma_pagamento: formaPagamento
      };

      // Incluir conta corrente apenas se houver valor a pagar
      if (valorAPagar > 0 && contaCorrenteId) {
        updateData.conta_corrente_id = contaCorrenteId;
      }

      const { error: updateError } = await supabase
        .from("movimentacoes_parcelas")
        .update(updateData)
        .eq("id", conta?.id);

      if (updateError) throw updateError;

      // 2. Inserir registros na nova tabela de relacionamento para cada antecipação
      if (usarAntecipacao && antecipacoesSelecionadas.length > 0) {
        for (const antSel of antecipacoesSelecionadas) {
          if (antSel.valor > 0) {
            const { error: relationError } = await supabase
              .from("movimentacoes_parcelas_antecipacoes")
              .insert({
                movimentacao_parcela_id: conta?.id,
                antecipacao_id: antSel.id,
                valor_utilizado: antSel.valor
              });

            if (relationError) throw relationError;
          }
        }

        // 3. Atualizar valor utilizado nas antecipações
        // Buscar dados atualizados diretamente do banco para evitar duplicação
        for (const antSel of antecipacoesSelecionadas) {
          if (antSel.valor > 0) {
            // Buscar valor atual da antecipação no banco
            const { data: antAtual, error: fetchError } = await supabase
              .from("antecipacoes")
              .select("valor_total, valor_utilizado")
              .eq("id", antSel.id)
              .single();

            if (fetchError) throw fetchError;
            
            const novoValorUtilizado = (antAtual?.valor_utilizado || 0) + antSel.valor;
            
            // Validar que não excede o valor total
            if (novoValorUtilizado > (antAtual?.valor_total || 0)) {
              toast.error(`Valor utilizado excede o valor total da antecipação.`);
              return;
            }

            // Determinar status: 'utilizada' se totalmente consumida, 'ativa' se parcial
            const novoStatus = novoValorUtilizado >= (antAtual?.valor_total || 0) ? 'utilizada' : 'ativa';
            
            const { error: antecipacaoError } = await supabase
              .from("antecipacoes")
              .update({
                valor_utilizado: novoValorUtilizado,
                status: novoStatus
              })
              .eq("id", antSel.id);

            if (antecipacaoError) throw antecipacaoError;
          }
        }

        // 4. Inserir registros no fluxo de caixa para cada antecipação utilizada
        // Gerar PAR de lançamentos: entrada (baixa antecipação) + saída (pagamento)
        for (const antSel of antecipacoesSelecionadas) {
          if (antSel.valor > 0) {
            const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
            
            // 4.1 - Lançamento de ENTRADA: Baixa da Antecipação (valor positivo)
            // Representa o "resgate" do valor antecipado
            const { error: fluxoBaixaAntecipacaoError } = await supabase
              .from("fluxo_caixa")
              .insert({
                empresa_id: currentCompany?.id,
                conta_corrente_id: contaCorrenteId, // AGORA COM CONTA CORRENTE
                data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
                valor: antSel.valor, // POSITIVO - entrada de caixa
                saldo: antSel.valor,
                tipo_operacao: "pagar", // Mantém o contexto da operação
                origem: "antecipacao_baixa",
                movimentacao_parcela_id: conta?.id,
                movimentacao_id: conta?.movimentacao_id,
                antecipacao_id: antSel.id,
                situacao: "nao_conciliado",
                descricao: `Baixa Antecipação - ${antecipacao?.descricao || 'Antecipação'} - ${conta?.favorecido}`,
                forma_pagamento: formaPagamento
              });

            if (fluxoBaixaAntecipacaoError) throw fluxoBaixaAntecipacaoError;

            // 4.2 - Lançamento de SAÍDA: Pagamento com Antecipação (valor negativo)
            // Representa o pagamento efetivo da conta
            const { error: fluxoPagamentoAntecipacaoError } = await supabase
              .from("fluxo_caixa")
              .insert({
                empresa_id: currentCompany?.id,
                conta_corrente_id: contaCorrenteId, // COM CONTA CORRENTE
                data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
                valor: -antSel.valor, // NEGATIVO - saída de caixa
                saldo: -antSel.valor,
                tipo_operacao: "pagar",
                origem: "movimentacao",
                movimentacao_parcela_id: conta?.id,
                movimentacao_id: conta?.movimentacao_id,
                antecipacao_id: antSel.id, // Vincula à antecipação
                situacao: "nao_conciliado",
                descricao: `Pagamento (Antecipação) - ${descricao || conta?.descricao || conta?.favorecido}`,
                forma_pagamento: formaPagamento
              });

            if (fluxoPagamentoAntecipacaoError) throw fluxoPagamentoAntecipacaoError;
          }
        }
      }

      // 5. Inserir no fluxo de caixa apenas se houver valor efetivamente pago
      if (valorAPagar > 0 && contaCorrenteId) {
        const { error: fluxoError } = await supabase
          .from("fluxo_caixa")
          .insert({
            empresa_id: currentCompany?.id,
            conta_corrente_id: contaCorrenteId,
            data_movimentacao: format(dataPagamento, "yyyy-MM-dd"),
            valor: -valorAPagar, // Negativo para pagamento
            saldo: -valorAPagar,
            tipo_operacao: "pagar",
            origem: "movimentacao",
            movimentacao_parcela_id: conta?.id,
            movimentacao_id: conta?.movimentacao_id,
            situacao: "nao_conciliado",
            descricao: descricao || conta?.descricao || `Pagamento ${conta?.favorecido}`,
            forma_pagamento: formaPagamento
          });

        if (fluxoError) throw fluxoError;
      }

      onBaixar({ 
        dataPagamento, 
        contaCorrenteId, 
        formaPagamento, 
        multa, 
        juros, 
        desconto,
        antecipacoesSelecionadas: usarAntecipacao ? antecipacoesSelecionadas : undefined
      });
      onClose();
      
      if (usarAntecipacao && valorTotalAntecipacoes > 0) {
        toast.success(`Pagamento registrado! Valor das antecipações usado: ${formatCurrency(valorTotalAntecipacoes)}`);
      } else {
        toast.success("Pagamento registrado com sucesso!");
      }

    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Baixar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Pagamento *</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataPagamento ? format(dataPagamento, "yyyy-MM-dd") : ""}
                onChange={e => setDataPagamento(new Date(e.target.value + "T00:00:00"))}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>

          {/* Seção de Antecipações */}
          {antecipacoesDisponiveis.length > 0 && (
            <div className="border rounded-lg p-3 bg-blue-50">
              <div className="flex items-center space-x-2 mb-3">
                <Switch
                  id="usar-antecipacao"
                  checked={usarAntecipacao}
                  onCheckedChange={setUsarAntecipacao}
                />
                <Label htmlFor="usar-antecipacao" className="text-sm font-medium">
                  Usar antecipações deste fornecedor
                </Label>
              </div>

              {usarAntecipacao && (
                <div className="space-y-3">
                  <div className="text-sm font-medium mb-2">Selecione as antecipações:</div>
                  {antecipacoesDisponiveis.map((antecipacao) => {
                    const isSelected = antecipacoesSelecionadas.some(ant => ant.id === antecipacao.id);
                    const valorSelecionado = antecipacoesSelecionadas.find(ant => ant.id === antecipacao.id)?.valor || 0;
                    const maxValor = getMaxValorAntecipacao(antecipacao.id);
                    
                    return (
                      <div key={antecipacao.id} className="border rounded-md p-3 bg-white">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`ant-${antecipacao.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleAntecipacaoChange(antecipacao.id, checked as boolean)}
                          />
                          <Label htmlFor={`ant-${antecipacao.id}`} className="text-sm">
                            {antecipacao.descricao} - Disponível: {formatCurrency(antecipacao.valor_disponivel)}
                          </Label>
                        </div>
                        
                        {isSelected && (
                          <div className="ml-6">
                            <label className="block text-xs text-gray-600 mb-1">
                              Valor a usar (máx: {formatCurrency(maxValor)})
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={maxValor}
                              step="0.01"
                              value={valorSelecionado}
                              onChange={e => handleValorAntecipacaoChange(antecipacao.id, Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(valorAPagar > 0 || usarAntecipacao) && (
            <div>
              <label className="block text-sm font-medium mb-1">Conta Corrente *</label>
              <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {contasCorrente.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Forma de Pagamento *</label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {formasPagamento.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Multa</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={multa}
                onChange={e => setMulta(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Juros</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={juros}
                onChange={e => setJuros(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Desconto</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={desconto}
                onChange={e => setDesconto(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Resumo dos valores */}
          <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor da conta:</span>
              <span>{formatCurrency(valorConta)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Multa + Juros:</span>
              <span>{formatCurrency(valorAcrescimos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Desconto:</span>
              <span>-{formatCurrency(desconto)}</span>
            </div>
            {usarAntecipacao && valorTotalAntecipacoes > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Total antecipações usadas:</span>
                <span>-{formatCurrency(valorTotalAntecipacoes)}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Valor a pagar:</span>
              <span>{formatCurrency(valorAPagar)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="blue"
            onClick={handleConfirmar}
            disabled={!dataPagamento || !formaPagamento || (valorAPagar > 0 && !contaCorrenteId)}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
