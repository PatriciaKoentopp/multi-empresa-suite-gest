import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/movimentacao/DateInput";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface Antecipacao {
  id: string;
  favorecido: string;
  tipoOperacao: "receber" | "pagar";
  dataAntecipacao: Date;
  valorTotal: number;
  valorUtilizado: number;
  valorDisponivel: number;
  descricao?: string;
  status: "ativa" | "utilizada" | "devolvida";
  numeroDocumento?: string;
  conciliada?: boolean;
}

interface DevolverAntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  antecipacao: Antecipacao | null;
}

const formasPagamento = [
  "Dinheiro",
  "PIX",
  "Transferência Bancária",
  "Boleto",
  "Cheque",
  "Cartão de Crédito",
  "Cartão de Débito",
];

export function DevolverAntecipacaoModal({
  open,
  onClose,
  onSave,
  antecipacao,
}: DevolverAntecipacaoModalProps) {
  const { currentCompany } = useCompany();
  const [dataDevolucao, setDataDevolucao] = useState<Date>(new Date());
  const [contaCorrenteId, setContaCorrenteId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valorDevolvido, setValorDevolvido] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const [contasCorrentes, setContasCorrentes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && currentCompany?.id) {
      carregarContasCorrentes();
      if (antecipacao) {
        setValorDevolvido(antecipacao.valorDisponivel.toFixed(2).replace(".", ","));
      }
    }
  }, [open, currentCompany?.id, antecipacao]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setDataDevolucao(new Date());
    setContaCorrenteId("");
    setFormaPagamento("");
    setValorDevolvido("");
    setObservacao("");
  };

  async function carregarContasCorrentes() {
    if (!currentCompany?.id) return;

    const { data, error } = await supabase
      .from("contas_correntes")
      .select("id, nome, banco")
      .eq("empresa_id", currentCompany.id)
      .eq("status", "ativo");

    if (error) {
      console.error("Erro ao carregar contas correntes:", error);
      return;
    }

    setContasCorrentes(data || []);
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, "");
    setValorDevolvido(value);
  };

  const parseValor = (valor: string): number => {
    return parseFloat(valor.replace(",", ".")) || 0;
  };

  async function handleSalvar() {
    if (!antecipacao) return;

    // Validações
    if (!dataDevolucao) {
      toast.error("Informe a data da devolução");
      return;
    }

    if (!contaCorrenteId) {
      toast.error("Selecione a conta corrente");
      return;
    }

    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento");
      return;
    }

    const valorNumerico = parseValor(valorDevolvido);

    if (valorNumerico <= 0) {
      toast.error("Informe um valor válido para devolução");
      return;
    }

    if (valorNumerico > antecipacao.valorDisponivel) {
      toast.error(`O valor não pode exceder o valor disponível (${formatCurrency(antecipacao.valorDisponivel)})`);
      return;
    }

    setIsSaving(true);

    try {
      // Buscar dados completos da antecipação
      const { data: antecipacaoData, error: fetchError } = await supabase
        .from("antecipacoes")
        .select("*")
        .eq("id", antecipacao.id)
        .single();

      if (fetchError || !antecipacaoData) {
        throw new Error("Erro ao buscar dados da antecipação");
      }

      // Calcular novo valor devolvido
      const valorDevolvidoAtual = Number(antecipacaoData.valor_devolvido) || 0;
      const novoValorDevolvido = valorDevolvidoAtual + valorNumerico;

      // Calcular novo valor disponível
      const valorTotal = Number(antecipacaoData.valor_total);
      const valorUtilizado = Number(antecipacaoData.valor_utilizado);
      const novoValorDisponivel = valorTotal - valorUtilizado - novoValorDevolvido;

      // Determinar novo status
      const novoStatus = novoValorDisponivel <= 0 ? "devolvida" : "ativa";

      // Formatar data para o formato YYYY-MM-DD
      const dataFormatada = dataDevolucao.toISOString().split("T")[0];

      // Criar registro no fluxo de caixa
      // Para antecipação tipo "pagar": devolução é entrada (fornecedor devolvendo)
      // Para antecipação tipo "receber": devolução é saída (devolvendo ao cliente)
      const tipoOperacaoFluxo = antecipacao.tipoOperacao === "pagar" ? "receber" : "pagar";
      const valorFluxo = valorNumerico;

      const fluxoCaixaData = {
        empresa_id: currentCompany?.id,
        data_movimentacao: dataFormatada,
        tipo_operacao: tipoOperacaoFluxo,
        valor: valorFluxo,
        saldo: 0,
        descricao: `Devolução: ${antecipacaoData.descricao || "Antecipação"}${observacao ? ` - ${observacao}` : ""}`,
        origem: "antecipacao",
        conta_corrente_id: contaCorrenteId,
        antecipacao_id: antecipacao.id,
        situacao: "nao_conciliado",
        forma_pagamento: formaPagamento,
      };

      const { error: fluxoError } = await supabase
        .from("fluxo_caixa")
        .insert(fluxoCaixaData);

      if (fluxoError) {
        console.error("Erro ao criar registro no fluxo de caixa:", fluxoError);
        throw fluxoError;
      }

      // Atualizar antecipação
      const { error: updateError } = await supabase
        .from("antecipacoes")
        .update({
          valor_devolvido: novoValorDevolvido,
          status: novoStatus,
        })
        .eq("id", antecipacao.id);

      if (updateError) {
        console.error("Erro ao atualizar antecipação:", updateError);
        throw updateError;
      }

      toast.success("Devolução registrada com sucesso");
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao processar devolução:", error);
      toast.error("Erro ao processar devolução");
    } finally {
      setIsSaving(false);
    }
  }

  if (!antecipacao) return null;

  const valorNumerico = parseValor(valorDevolvido);
  const excedeLimite = valorNumerico > antecipacao.valorDisponivel;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Devolver Antecipação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da antecipação */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Favorecido:</span>
              <span className="text-sm font-medium">{antecipacao.favorecido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="text-sm font-medium">
                {antecipacao.tipoOperacao === "pagar" ? "Pagamento" : "Recebimento"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="text-sm font-medium">{formatCurrency(antecipacao.valorTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Utilizado:</span>
              <span className="text-sm font-medium">{formatCurrency(antecipacao.valorUtilizado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Disponível:</span>
              <span className="text-sm font-medium text-blue-600">{formatCurrency(antecipacao.valorDisponivel)}</span>
            </div>
          </div>

          {antecipacao.tipoOperacao === "pagar" && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Esta é uma antecipação de pagamento. A devolução será registrada como <strong>entrada</strong> no fluxo de caixa (fornecedor devolvendo o valor).
              </p>
            </div>
          )}

          {antecipacao.tipoOperacao === "receber" && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Esta é uma antecipação de recebimento. A devolução será registrada como <strong>saída</strong> no fluxo de caixa (devolvendo o valor ao cliente).
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Devolução *</Label>
              <DateInput
                value={dataDevolucao}
                onChange={(date) => setDataDevolucao(date || new Date())}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor a Devolver *</Label>
              <Input
                value={valorDevolvido}
                onChange={handleValorChange}
                placeholder="0,00"
                className={excedeLimite ? "border-red-500" : ""}
              />
              {excedeLimite && (
                <p className="text-xs text-red-500">
                  Valor excede o disponível
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta Corrente *</Label>
            <Select value={contaCorrenteId} onValueChange={setContaCorrenteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {contasCorrentes.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.nome} - {conta.banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da devolução (opcional)"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleSalvar}
            disabled={isSaving || excedeLimite}
          >
            {isSaving ? "Processando..." : "Confirmar Devolução"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
