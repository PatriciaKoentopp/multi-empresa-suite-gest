import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/movimentacao/DateInput";
import { useMovimentacaoDados } from "@/hooks/useMovimentacaoDados";
import { useCompany } from "@/contexts/company-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Antecipacao } from "./antecipacao-table";

interface EditarAntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  antecipacao: Antecipacao | null;
}

// Formas de pagamento fixas
const formasPagamento = [
  { id: "1", nome: "Dinheiro" },
  { id: "2", nome: "Cartão" },
  { id: "3", nome: "Boleto" },
  { id: "4", nome: "Transferência" }
];

export function EditarAntecipacaoModal({ open, onClose, onSave, antecipacao }: EditarAntecipacaoModalProps) {
  const { currentCompany } = useCompany();
  const { favorecidos, tiposTitulos } = useMovimentacaoDados();

  const [dataEmissao, setDataEmissao] = useState<Date>(new Date());
  const [dataLancamento, setDataLancamento] = useState<Date>(new Date());
  const [mesReferencia, setMesReferencia] = useState("");
  const [numDoc, setNumDoc] = useState("");
  const [tipoTitulo, setTipoTitulo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("1");
  const [contaCorrente, setContaCorrente] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contasCorrentes, setContasCorrentes] = useState<any[]>([]);

  // Filtrar tipos de títulos baseado na operação
  const tiposTitulosFiltrados = tiposTitulos.filter(tipo => {
    if (antecipacao?.tipoOperacao === "receber") return tipo.tipo === "receber";
    if (antecipacao?.tipoOperacao === "pagar") return tipo.tipo === "pagar";
    return false;
  });

  // Carregar contas correntes
  useEffect(() => {
    if (currentCompany?.id) {
      carregarContasCorrentes();
    }
  }, [currentCompany]);

  const carregarContasCorrentes = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("id, nome, banco")
        .eq("empresa_id", currentCompany?.id)
        .eq("status", "ativo");

      if (error) {
        console.error("Erro ao carregar contas correntes:", error);
        return;
      }

      setContasCorrentes(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas correntes:", error);
    }
  };

  // Carregar dados da antecipação quando o modal abrir
  useEffect(() => {
    if (antecipacao && open) {
      // Buscar dados completos da antecipação
      carregarDadosAntecipacao();
    }
  }, [antecipacao, open]);

  const carregarDadosAntecipacao = async () => {
    if (!antecipacao) return;

    try {
      const { data, error } = await supabase
        .from("antecipacoes")
        .select("*")
        .eq("id", antecipacao.id)
        .single();

      if (error) {
        console.error("Erro ao carregar dados da antecipação:", error);
        return;
      }

      // Preencher campos com os dados da antecipação
      setDataEmissao(new Date(data.data_emissao + 'T12:00:00'));
      setDataLancamento(new Date(data.data_lancamento + 'T12:00:00'));
      setMesReferencia(data.mes_referencia || "");
      setNumDoc(data.numero_documento || "");
      setTipoTitulo(data.tipo_titulo_id || "");
      setFavorecido(data.favorecido_id || "");
      setContaCorrente(data.conta_corrente_id || "");
      setValor(data.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setDescricao(data.descricao || "");
      
      // Encontrar forma de pagamento
      const formaPagamentoEncontrada = formasPagamento.find(f => f.nome === data.forma_pagamento);
      setFormaPagamento(formaPagamentoEncontrada?.id || "1");
    } catch (error) {
      console.error("Erro ao carregar dados da antecipação:", error);
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,.]/g, '');
    setValor(value);
  };

  // Função para formatar o mês de referência
  const handleMesReferenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9/]/g, '');
    
    // Formatar como MM/YYYY
    if (value.length > 2 && value.indexOf('/') === -1) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    // Limitar o tamanho máximo (MM/YYYY = 7 caracteres)
    if (value.length <= 7) {
      setMesReferencia(value);
    }
  };

  const handleSalvar = async () => {
    if (!antecipacao) return;

    // Verificar se a antecipação está conciliada
    if (antecipacao.conciliada) {
      toast.error("Não é possível editar uma antecipação que já foi conciliada");
      return;
    }

    // Validações básicas
    if (!tipoTitulo || !favorecido || !contaCorrente || !valor || Number(valor.replace(/\./g, '').replace(',', '.')) <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Verificar se o novo valor não é menor que o valor já utilizado
    const novoValor = Number(valor.replace(/\./g, '').replace(',', '.'));
    if (novoValor < antecipacao.valorUtilizado) {
      toast.error("O valor total não pode ser menor que o valor já utilizado");
      return;
    }

    try {
      setIsLoading(true);

      // Atualizar a antecipação
      const { error: antecipacaoError } = await supabase
        .from("antecipacoes")
        .update({
          data_emissao: dataEmissao.toISOString().split('T')[0],
          data_lancamento: dataLancamento.toISOString().split('T')[0],
          mes_referencia: mesReferencia || null,
          numero_documento: numDoc || null,
          tipo_titulo_id: tipoTitulo || null,
          favorecido_id: favorecido,
          forma_pagamento: formasPagamento.find(f => f.id === formaPagamento)?.nome || "Dinheiro",
          conta_corrente_id: contaCorrente,
          valor_total: novoValor,
          descricao: descricao || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", antecipacao.id);

      if (antecipacaoError) {
        console.error("Erro ao atualizar antecipação:", antecipacaoError);
        throw antecipacaoError;
      }

      // Atualizar também no fluxo de caixa
      const valorOperacao = antecipacao.tipoOperacao === "receber" ? novoValor : -novoValor;
      
      const { error: fluxoCaixaError } = await supabase
        .from("fluxo_caixa")
        .update({
          data_movimentacao: dataLancamento.toISOString().split('T')[0],
          valor: valorOperacao,
          conta_corrente_id: contaCorrente,
          forma_pagamento: formasPagamento.find(f => f.id === formaPagamento)?.nome || "Dinheiro",
          descricao: descricao || `Antecipação - ${antecipacao.tipoOperacao === "receber" ? "Recebimento" : "Pagamento"}`,
          updated_at: new Date().toISOString()
        })
        .eq("antecipacao_id", antecipacao.id);

      if (fluxoCaixaError) {
        console.error("Erro ao atualizar fluxo de caixa:", fluxoCaixaError);
        throw fluxoCaixaError;
      }

      toast.success("Antecipação atualizada com sucesso!");
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar antecipação:", error);
      toast.error("Erro ao salvar antecipação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!antecipacao) return null;

  // Verificar se está conciliada para desabilitar campos
  const isReadOnly = antecipacao.conciliada;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Antecipação</DialogTitle>
        </DialogHeader>

        {isReadOnly && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
            <p className="text-yellow-800 text-sm">
              Esta antecipação está conciliada e não pode ser editada.
            </p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          {/* Primeira linha - Data Emissão, Data Lançamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DateInput
                label="Data de Emissão"
                value={dataEmissao}
                onChange={setDataEmissao}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <DateInput
                label="Data de Lançamento"
                value={dataLancamento}
                onChange={setDataLancamento}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Segunda linha - Mês Referência, Número Doc */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Mês de Referência (MM/AAAA)</Label>
              <Input
                value={mesReferencia}
                onChange={handleMesReferenciaChange}
                placeholder="05/2025"
                className="bg-white"
                maxLength={7}
                disabled={isReadOnly}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Número do Documento</Label>
              <Input
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value)}
                placeholder="Número do documento"
                className="bg-white"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Terceira linha - Tipo Título, Favorecido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Tipo de Título</Label>
              <Select value={tipoTitulo} onValueChange={setTipoTitulo} disabled={isReadOnly}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {tiposTitulosFiltrados.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Favorecido</Label>
              <Select value={favorecido} onValueChange={setFavorecido} disabled={isReadOnly}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o favorecido" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {favorecidos.map(fav => (
                    <SelectItem key={fav.id} value={fav.id}>
                      {fav.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quarta linha - Forma Pagamento, Conta Corrente */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento} disabled={isReadOnly}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {formasPagamento.map(forma => (
                    <SelectItem key={forma.id} value={forma.id}>
                      {forma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Conta Corrente</Label>
              <Select value={contaCorrente} onValueChange={setContaCorrente} disabled={isReadOnly}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {contasCorrentes.map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome} - {conta.banco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quinta linha - Valor */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Valor Total</Label>
              <Input
                value={valor}
                onChange={handleValorChange}
                placeholder="0,00"
                className="bg-white"
                disabled={isReadOnly}
              />
              {antecipacao.valorUtilizado > 0 && (
                <p className="text-sm text-gray-600">
                  Valor utilizado: {antecipacao.valorUtilizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </div>
          </div>

          {/* Sexta linha - Descrição */}
          <div className="flex flex-col gap-1">
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição da antecipação"
              className="bg-white min-h-[80px]"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              {isReadOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button 
                variant="blue" 
                onClick={handleSalvar} 
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
