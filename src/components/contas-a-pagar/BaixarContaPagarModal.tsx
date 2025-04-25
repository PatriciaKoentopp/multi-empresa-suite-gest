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

        // Mapear para o tipo ContaCorrente antes de setar o estado
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
          saldoInicial: conta.saldo_inicial
        }));

        setContasCorrentes(contasCorrentesFormatadas);
      };

      fetchContasCorrentes();
    }
  }, [open, currentCompany]);

  useEffect(() => {
    setDataPagamento(conta?.dataVencimento);
    setContaCorrenteId("");
    setMulta(0);
    setJuros(0);
    setDesconto(0);
    setFormaPagamento("");
  }, [conta, open]);

  // Efeito para buscar o último saldo do fluxo de caixa quando a conta corrente for selecionada
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

        // Se encontrou registro, usa o saldo dele, senão busca o saldo inicial da conta
        if (data && data.length > 0) {
          setSaldoConta(Number(data[0].saldo));
        } else {
          // Busca o saldo inicial da conta corrente
          const contaSelecionada = contasCorrentes.find(c => c.id === contaCorrenteId);
          setSaldoConta(Number(contaSelecionada?.saldoInicial || 0));
        }
      };

      buscarUltimoSaldo();
    }
  }, [contaCorrenteId, contasCorrentes]);

  function handleConfirmar() {
    if (!dataPagamento || !contaCorrenteId || !formaPagamento) return;
    
    const valorTotal = (conta?.valor || 0) + (multa || 0) + (juros || 0) - (desconto || 0);
    const novoSaldo = saldoConta - valorTotal;

    const inserirFluxoCaixa = async () => {
      const { error: errorFluxo } = await supabase
        .from('fluxo_caixa')
        .insert({
          empresa_id: currentCompany?.id,
          data_movimentacao: dataPagamento.toISOString().split('T')[0],
          valor: -(conta?.valor || 0) - (multa || 0) - (juros || 0) + (desconto || 0), // Valor negativo pois é uma saída
          origem: 'contas_pagar',
          tipo_operacao: 'pagar',
          movimentacao_id: conta?.movimentacao_id,
          movimentacao_parcela_id: conta?.id,
          conta_corrente_id: contaCorrenteId,
          situacao: 'nao_conciliado',
          descricao: conta?.descricao || '',
          saldo: novoSaldo,
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

      onBaixar({ dataPagamento, contaCorrenteId, multa, juros, desconto });
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

  // Calcular valor total
  const valorTotal = useMemo(() => {
    const valorTitulo = conta?.valor || 0;
    return valorTitulo + (multa || 0) + (juros || 0) - (desconto || 0);
  }, [conta, multa, juros, desconto]);

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
                onChange={e => setDataPagamento(new Date(e.target.value + "T00:00:00"))}
                min={conta?.dataVencimento ? format(conta.dataVencimento, "yyyy-MM-dd") : undefined}
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
            disabled={!dataPagamento || !contaCorrenteId || !formaPagamento}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
