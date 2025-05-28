
import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ContaPagar } from "./contas-a-pagar-table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ContaCorrente } from "@/types/conta-corrente";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Antecipacao, AntecipacaoSelecionada } from "@/types/financeiro";

interface BaixarContaPagarModalProps {
  conta?: ContaPagar | null;
  open: boolean;
  onClose: () => void;
  onBaixar: (dados: {
    dataPagamento: Date;
    contaCorrenteId: string;
    multa: number;
    juros: number;
    desconto: number;
    formaPagamento: string;
    antecipacoesSelecionadas?: AntecipacaoSelecionada[];
  }) => void;
}

export function BaixarContaPagarModal({ conta, open, onClose, onBaixar }: BaixarContaPagarModalProps) {
  const [dataPagamento, setDataPagamento] = useState<Date | undefined>(conta?.dataVencimento);
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
  const [multa, setMulta] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [saldoConta, setSaldoConta] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [usarAntecipacao, setUsarAntecipacao] = useState<boolean>(false);
  const [antecipacoes, setAntecipacoes] = useState<Antecipacao[]>([]);
  const [antecipacoesSelecionadas, setAntecipacoesSelecionadas] = useState<AntecipacaoSelecionada[]>([]);

  const { currentCompany } = useCompany();

  useEffect(() => {
    if (open && currentCompany) {
      const fetchContasCorrentes = async () => {
        const { data, error } = await supabase
          .from('contas_correntes')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativo');

        if (error) {
          console.error('Erro ao buscar contas correntes:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar as contas correntes"
          });
          return;
        }

        const contasCorrentesFormatadas: ContaCorrente[] = (data || []).map(conta => ({
          id: conta.id,
          nome: conta.nome,
          banco: conta.banco,
          agencia: conta.agencia,
          numero: conta.numero,
          contaContabilId: conta.conta_contabil_id,
          status: conta.status as "ativo" | "inativo",
          createdAt: new Date(conta.created_at),
          updatedAt: new Date(conta.updated_at),
          data: conta.data ? new Date(conta.data) : undefined,
          saldoInicial: conta.saldo_inicial,
          considerar_saldo: conta.considerar_saldo
        }));

        setContasCorrentes(contasCorrentesFormatadas);
      };

      const fetchAntecipacoes = async () => {
        const { data, error } = await supabase
          .from('antecipacoes')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .eq('status', 'ativa')
          .eq('tipo_operacao', 'pagar');

        if (error) {
          console.error('Erro ao buscar antecipações:', error);
          return;
        }

        const antecipacoesFormatadas: Antecipacao[] = (data || []).map(ant => ({
          id: ant.id,
          descricao: ant.descricao || '',
          valor_total: Number(ant.valor_total),
          valor_utilizado: Number(ant.valor_utilizado),
          valor_disponivel: Number(ant.valor_total) - Number(ant.valor_utilizado)
        }));

        setAntecipacoes(antecipacoesFormatadas);
      };

      fetchContasCorrentes();
      fetchAntecipacoes();
    }
  }, [open, currentCompany]);

  useEffect(() => {
    setDataPagamento(conta?.dataVencimento);
    setContaCorrenteId("");
    setMulta(0);
    setJuros(0);
    setDesconto(0);
    setFormaPagamento("");
    setUsarAntecipacao(false);
    setAntecipacoesSelecionadas([]);
  }, [conta, open]);

  useEffect(() => {
    if (contaCorrenteId) {
      const buscarUltimoSaldo = async () => {
        const { data, error } = await supabase
          .from('fluxo_caixa')
          .select('saldo')
          .eq('conta_corrente_id', contaCorrenteId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Erro ao buscar saldo:', error);
          return;
        }

        if (data && data.length > 0) {
          setSaldoConta(Number(data[0].saldo));
        } else {
          const contaSelecionada = contasCorrentes.find(c => c.id === contaCorrenteId);
          setSaldoConta(Number(contaSelecionada?.saldoInicial || 0));
        }
      };

      buscarUltimoSaldo();
    }
  }, [contaCorrenteId, contasCorrentes]);

  function handleAntecipacaoChange(antecipacaoId: string, checked: boolean) {
    if (checked) {
      setAntecipacoesSelecionadas(prev => [...prev, { id: antecipacaoId, valor: 0 }]);
    } else {
      setAntecipacoesSelecionadas(prev => prev.filter(a => a.id !== antecipacaoId));
    }
  }

  function handleValorAntecipacaoChange(antecipacaoId: string, valor: number) {
    setAntecipacoesSelecionadas(prev => 
      prev.map(a => a.id === antecipacaoId ? { ...a, valor } : a)
    );
  }

  function handleConfirmar() {
    if (!dataPagamento || !formaPagamento) return;
    if (!usarAntecipacao && !contaCorrenteId) return;
    
    const valorTotal = (conta?.valor || 0) + (multa || 0) + (juros || 0) - (desconto || 0);
    const novoSaldo = saldoConta - valorTotal;

    const inserirFluxoCaixa = async () => {
      const { error: errorFluxo } = await supabase
        .from('fluxo_caixa')
        .insert({
          empresa_id: currentCompany?.id,
          data_movimentacao: dataPagamento.toISOString().split('T')[0],
          valor: -(conta?.valor || 0) - (multa || 0) - (juros || 0) + (desconto || 0),
          origem: 'movimentacao',
          tipo_operacao: 'pagar',
          movimentacao_id: conta?.movimentacao_id,
          movimentacao_parcela_id: conta?.id,
          conta_corrente_id: usarAntecipacao ? null : contaCorrenteId,
          situacao: 'nao_conciliado',
          descricao: conta?.descricao || '',
          saldo: usarAntecipacao ? 0 : novoSaldo,
          forma_pagamento: formaPagamento
        });

      if (errorFluxo) {
        console.error('Erro ao inserir no fluxo de caixa:', errorFluxo);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível registrar o movimento no fluxo de caixa"
        });
        return;
      }

      onBaixar({ 
        dataPagamento, 
        contaCorrenteId: usarAntecipacao ? "" : contaCorrenteId, 
        multa, 
        juros, 
        desconto, 
        formaPagamento,
        antecipacoesSelecionadas: usarAntecipacao ? antecipacoesSelecionadas : undefined
      });
      onClose();
    };

    inserirFluxoCaixa();
  }

  function formatCurrencyBR(valor?: number) {
    if (valor === undefined) return "-";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }

  const valorTotal = useMemo(() => {
    const valorTitulo = conta?.valor || 0;
    return valorTitulo + (multa || 0) + (juros || 0) - (desconto || 0);
  }, [conta, multa, juros, desconto]);

  const totalAntecipacoes = useMemo(() => {
    return antecipacoesSelecionadas.reduce((total, ant) => total + ant.valor, 0);
  }, [antecipacoesSelecionadas]);

  const antecipacoesDisponiveis = useMemo(() => {
    return antecipacoes.filter(ant => ant.valor_disponivel > 0);
  }, [antecipacoes]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Baixar Título</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Pagamento *</label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-full"
                value={dataPagamento ? format(dataPagamento, "yyyy-MM-dd") : ""}
                onChange={e => {
                  const selectedDate = new Date(e.target.value + "T00:00:00");
                  setDataPagamento(selectedDate);
                }}
              />
              <Calendar className="text-blue-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Forma de Pagamento *</label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="usar-antecipacao" 
              checked={usarAntecipacao} 
              onCheckedChange={setUsarAntecipacao}
            />
            <label htmlFor="usar-antecipacao" className="text-sm font-medium">
              Utilizar Antecipação
            </label>
          </div>

          {!usarAntecipacao && (
            <div>
              <label className="block text-sm font-medium mb-1">Conta Corrente *</label>
              <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {contasCorrentes.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome} - {conta.banco} - {conta.agencia}/{conta.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {usarAntecipacao && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Antecipações Disponíveis</label>
              {antecipacoesDisponiveis.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma antecipação disponível</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {antecipacoesDisponiveis.map((antecipacao) => (
                    <Card key={antecipacao.id} className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`ant-${antecipacao.id}`}
                          checked={antecipacoesSelecionadas.some(a => a.id === antecipacao.id)}
                          onCheckedChange={(checked) => handleAntecipacaoChange(antecipacao.id, checked as boolean)}
                        />
                        <label htmlFor={`ant-${antecipacao.id}`} className="text-sm font-medium flex-1">
                          {antecipacao.descricao}
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Disponível: {formatCurrencyBR(antecipacao.valor_disponivel)}
                      </div>
                      {antecipacoesSelecionadas.some(a => a.id === antecipacao.id) && (
                        <Input
                          type="number"
                          placeholder="Valor a utilizar"
                          min={0}
                          max={antecipacao.valor_disponivel}
                          step="0.01"
                          value={antecipacoesSelecionadas.find(a => a.id === antecipacao.id)?.valor || 0}
                          onChange={(e) => handleValorAntecipacaoChange(antecipacao.id, Number(e.target.value))}
                          className="mt-2"
                        />
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

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
          
          <div>
            <label className="block text-sm font-medium mb-1">Valor Total</label>
            <Input
              type="text"
              value={formatCurrencyBR(valorTotal)}
              readOnly
              className="bg-gray-100 font-semibold"
              tabIndex={-1}
            />
          </div>

          {usarAntecipacao && totalAntecipacoes > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Total das Antecipações</label>
              <Input
                type="text"
                value={formatCurrencyBR(totalAntecipacoes)}
                readOnly
                className="bg-blue-50 font-semibold"
                tabIndex={-1}
              />
            </div>
          )}
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
            disabled={!dataPagamento || !formaPagamento || (!usarAntecipacao && !contaCorrenteId)}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
