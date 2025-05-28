
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ContaReceber } from "./contas-a-receber-table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface BaixarContaReceberModalProps {
  conta?: ContaReceber | null;
  open: boolean;
  onClose: () => void;
  onBaixar: (dados: {
    dataRecebimento: Date;
    contaCorrenteId: string;
    formaPagamento: string;
    multa: number;
    juros: number;
    desconto: number;
  }) => void;
}

// Formas de pagamento fixas
const formasPagamento = [
  { id: "1", nome: "Dinheiro" },
  { id: "2", nome: "Cartão" },
  { id: "3", nome: "Boleto" },
  { id: "4", nome: "Transferência" }
];

interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
}

interface AntecipacaoSelecionada {
  id: string;
  valor: number;
}

export function BaixarContaReceberModal({ conta, open, onClose, onBaixar }: BaixarContaReceberModalProps) {
  const { currentCompany } = useCompany();
  const [dataRecebimento, setDataRecebimento] = useState<Date | undefined>(conta?.dataVencimento);
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
        .eq("tipo_operacao", "receber")
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
      setDataRecebimento(conta?.dataVencimento);
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
  const valorAReceber = Math.max(0, valorTotalConta - valorTotalAntecipacoes);

  // Funções para gerenciar antecipações selecionadas
  const handleAntecipacaoChange = (antecipacaoId: string, checked: boolean) => {
    if (checked) {
      const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antecipacaoId);
      if (antecipacao) {
        setAntecipacoesSelecionadas(prev => [
          ...prev,
          { id: antecipacaoId, valor: 0 }
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
    if (!dataRecebimento || (!contaCorrenteId && valorAReceber > 0) || !formaPagamento) {
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

      // 1. Atualizar a parcela com os dados do recebimento
      const updateData: any = {
        data_pagamento: format(dataRecebimento, "yyyy-MM-dd"),
        multa,
        juros,
        desconto,
        forma_pagamento: formaPagamento
      };

      // Incluir dados da primeira antecipação se estiver sendo usada (para compatibilidade)
      if (usarAntecipacao && antecipacoesSelecionadas.length > 0) {
        updateData.antecipacao_id = antecipacoesSelecionadas[0].id;
        updateData.valor_antecipacao_utilizado = valorTotalAntecipacoes;
      }

      // Incluir conta corrente apenas se houver valor a receber
      if (valorAReceber > 0 && contaCorrenteId) {
        updateData.conta_corrente_id = contaCorrenteId;
      }

      const { error: updateError } = await supabase
        .from("movimentacoes_parcelas")
        .update(updateData)
        .eq("id", conta?.id);

      if (updateError) throw updateError;

      // 2. Atualizar valor utilizado nas antecipações
      for (const antSel of antecipacoesSelecionadas) {
        const antecipacao = antecipacoesDisponiveis.find(ant => ant.id === antSel.id);
        if (antecipacao && antSel.valor > 0) {
          const novoValorUtilizado = (antecipacao.valor_total - antecipacao.valor_disponivel) + antSel.valor;
          
          const { error: antecipacaoError } = await supabase
            .from("antecipacoes")
            .update({
              valor_utilizado: novoValorUtilizado
            })
            .eq("id", antSel.id);

          if (antecipacaoError) throw antecipacaoError;
        }
      }

      // 3. Inserir no fluxo de caixa apenas se houver valor efetivamente recebido
      if (valorAReceber > 0 && contaCorrenteId) {
        const { error: fluxoError } = await supabase
          .from("fluxo_caixa")
          .insert({
            empresa_id: currentCompany?.id,
            conta_corrente_id: contaCorrenteId,
            data_movimentacao: format(dataRecebimento, "yyyy-MM-dd"),
            valor: valorAReceber,
            saldo: valorAReceber,
            tipo_operacao: "receber",
            origem: "movimentacao",
            movimentacao_parcela_id: conta?.id,
            movimentacao_id: conta?.movimentacao_id,
            situacao: "nao_conciliado",
            descricao: descricao || conta?.descricao || `Recebimento ${conta?.cliente}`,
            forma_pagamento: formaPagamento
          });

        if (fluxoError) throw fluxoError;
      }

      onBaixar({ 
        dataRecebimento, 
        contaCorrenteId, 
        formaPagamento, 
        multa, 
        juros, 
        desconto 
      });
      onClose();
      
      if (usarAntecipacao && valorTotalAntecipacoes > 0) {
        toast.success(`Recebimento registrado! Valor das antecipações usado: ${formatCurrency(valorTotalAntecipacoes)}`);
      } else {
        toast.success("Recebimento registrado com sucesso!");
      }

    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast.error("Erro ao registrar recebimento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Baixar Recebimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Recebimento *</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataRecebimento ? format(dataRecebimento, "yyyy-MM-dd") : ""}
                onChange={e => setDataRecebimento(new Date(e.target.value + "T00:00:00"))}
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
                  Usar antecipações deste cliente
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

          {valorAReceber > 0 && (
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
              <span>Valor a receber:</span>
              <span>{formatCurrency(valorAReceber)}</span>
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
            disabled={!dataRecebimento || !formaPagamento || (valorAReceber > 0 && !contaCorrenteId)}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
