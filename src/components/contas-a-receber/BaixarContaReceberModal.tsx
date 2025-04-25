import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ContaReceber } from "./contas-a-receber-table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
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

export function BaixarContaReceberModal({ conta, open, onClose, onBaixar }: BaixarContaReceberModalProps) {
  const { currentCompany } = useCompany();
  const [dataRecebimento, setDataRecebimento] = useState<Date | undefined>(conta?.dataVencimento);
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [multa, setMulta] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);

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

  useEffect(() => {
    if (open) {
      setDataRecebimento(conta?.dataVencimento);
      setContaCorrenteId("");
      setFormaPagamento("");
      setMulta(0);
      setJuros(0);
      setDesconto(0);
    }
  }, [conta, open]);

  async function handleConfirmar() {
    if (!dataRecebimento || !contaCorrenteId || !formaPagamento) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const valorTotal = (conta?.valor || 0) + multa + juros - desconto;

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

      // 1. Atualiza a parcela com os dados do recebimento
      const { error: updateError } = await supabase
        .from("movimentacoes_parcelas")
        .update({
          data_pagamento: format(dataRecebimento, "yyyy-MM-dd"),
          conta_corrente_id: contaCorrenteId,
          multa,
          juros,
          desconto,
          forma_pagamento: formaPagamento
        })
        .eq("id", conta?.id);

      if (updateError) throw updateError;

      // 2. Insere o registro no fluxo de caixa sem o campo favorecido_id que não existe
      const { error: fluxoError } = await supabase
        .from("fluxo_caixa")
        .insert({
          empresa_id: currentCompany?.id,
          conta_corrente_id: contaCorrenteId,
          data_movimentacao: format(dataRecebimento, "yyyy-MM-dd"),
          valor: valorTotal,
          saldo: valorTotal,
          tipo_operacao: "receber",
          origem: "movimentacao",
          movimentacao_parcela_id: conta?.id,
          movimentacao_id: conta?.movimentacao_id,
          situacao: "nao_conciliado",
          descricao: descricao || conta?.descricao || `Recebimento ${conta?.cliente}`,
          forma_pagamento: formaPagamento
        });

      if (fluxoError) throw fluxoError;

      onBaixar({ 
        dataRecebimento, 
        contaCorrenteId, 
        formaPagamento, 
        multa, 
        juros, 
        desconto 
      });
      onClose();
      toast.success("Recebimento registrado com sucesso!");

    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast.error("Erro ao registrar recebimento");
    }
  }

  const valorTotal = useMemo(() => {
    const valorTitulo = conta?.valor || 0;
    return valorTitulo + (multa || 0) + (juros || 0) - (desconto || 0);
  }, [conta, multa, juros, desconto]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
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
          <div>
            <label className="block text-sm font-medium mb-1">Valor Total</label>
            <Input
              type="text"
              value={formatCurrency(valorTotal)}
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
            disabled={!dataRecebimento || !contaCorrenteId || !formaPagamento}
          >
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Adicionando exportação padrão para o componente
export default BaixarContaReceberModal;
