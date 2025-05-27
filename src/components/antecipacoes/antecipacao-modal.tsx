
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

interface AntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Formas de pagamento fixas
const formasPagamento = [
  { id: "1", nome: "Dinheiro" },
  { id: "2", nome: "Cartão" },
  { id: "3", nome: "Boleto" },
  { id: "4", nome: "Transferência" }
];

export function AntecipacaoModal({ open, onClose, onSave }: AntecipacaoModalProps) {
  const { currentCompany } = useCompany();
  const { favorecidos, tiposTitulos } = useMovimentacaoDados();

  const [operacao, setOperacao] = useState<"receber" | "pagar">("receber");
  const [dataEmissao, setDataEmissao] = useState<Date>(new Date());
  const [dataLancamento, setDataLancamento] = useState<Date>(new Date());
  const [mesReferencia, setMesReferencia] = useState("");
  const [numDoc, setNumDoc] = useState("");
  const [tipoTitulo, setTipoTitulo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("1");
  const [contaCorrente, setContaCorrente] = useState("");
  const [valor, setValor] = useState("0");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contasCorrentes, setContasCorrentes] = useState<any[]>([]);

  // Filtrar tipos de títulos baseado na operação
  const tiposTitulosFiltrados = tiposTitulos.filter(tipo => {
    if (operacao === "receber") return tipo.tipo === "receber";
    if (operacao === "pagar") return tipo.tipo === "pagar";
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

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,.]/g, '');
    setValor(value);
  };

  // Função auxiliar para formatar mês/ano no padrão MM/YYYY
  const formatarMesReferencia = (data: Date) => {
    if (!data) return "";
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}/${ano}`;
  };

  // Atualizar mês de referência quando a data de lançamento mudar
  useEffect(() => {
    if (dataLancamento && !mesReferencia) {
      setMesReferencia(formatarMesReferencia(dataLancamento));
    }
  }, [dataLancamento]);

  // Limpar tipo de título quando mudar operação
  useEffect(() => {
    setTipoTitulo("");
  }, [operacao]);

  const resetForm = () => {
    setOperacao("receber");
    setDataEmissao(new Date());
    setDataLancamento(new Date());
    setMesReferencia("");
    setNumDoc("");
    setTipoTitulo("");
    setFavorecido("");
    setFormaPagamento("1");
    setContaCorrente("");
    setValor("0");
    setDescricao("");
  };

  const handleSalvar = async () => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    // Validações básicas
    if (!tipoTitulo || !favorecido || !contaCorrente || !valor || Number(valor.replace(/\./g, '').replace(',', '.')) <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsLoading(true);

      // Converter valor para número
      const valorNumerico = Number(valor.replace(/\./g, '').replace(',', '.'));

      console.log("Iniciando transação de antecipação...");

      // Buscar saldo atual da conta corrente
      const { data: contaData, error: contaError } = await supabase
        .from("contas_correntes")
        .select("saldo_inicial")
        .eq("id", contaCorrente)
        .single();

      if (contaError) {
        console.error("Erro ao buscar dados da conta corrente:", contaError);
        throw contaError;
      }

      const saldoAtual = Number(contaData?.saldo_inicial || 0);

      // Calcular novo saldo baseado no tipo de operação
      // Para antecipação de recebimento, o valor entra na conta (crédito)
      // Para antecipação de pagamento, o valor sai da conta (débito)
      const novoSaldo = operacao === "receber" 
        ? saldoAtual + valorNumerico 
        : saldoAtual - valorNumerico;

      console.log("Saldo atual:", saldoAtual, "Valor:", valorNumerico, "Novo saldo:", novoSaldo);

      // Preparar dados para inserção na antecipação
      const antecipacaoData = {
        empresa_id: currentCompany.id,
        tipo_operacao: operacao,
        data_emissao: dataEmissao.toISOString().split('T')[0],
        data_lancamento: dataLancamento.toISOString().split('T')[0],
        mes_referencia: mesReferencia,
        numero_documento: numDoc || null,
        tipo_titulo_id: tipoTitulo || null,
        favorecido_id: favorecido,
        forma_pagamento: formasPagamento.find(f => f.id === formaPagamento)?.nome || "Dinheiro",
        conta_corrente_id: contaCorrente,
        valor_total: valorNumerico,
        valor_utilizado: 0,
        descricao: descricao || null
      };

      console.log("Dados da antecipação:", antecipacaoData);

      // Inserir na tabela antecipacoes
      const { data: antecipacaoInserida, error: antecipacaoError } = await supabase
        .from("antecipacoes")
        .insert(antecipacaoData)
        .select()
        .single();

      if (antecipacaoError) {
        console.error("Erro ao inserir antecipação:", antecipacaoError);
        throw antecipacaoError;
      }

      console.log("Antecipação inserida:", antecipacaoInserida);

      // Preparar dados para inserção no fluxo de caixa com valores corretos
      const fluxoCaixaData = {
        empresa_id: currentCompany.id,
        data_movimentacao: dataLancamento.toISOString().split('T')[0],
        tipo_operacao: operacao,
        valor: operacao === "receber" ? valorNumerico : -valorNumerico,
        saldo: novoSaldo,
        descricao: `Antecipação: ${descricao || `${operacao === "receber" ? "Recebimento" : "Pagamento"} - ${antecipacaoInserida.id}`}`,
        origem: "antecipacao",
        conta_corrente_id: contaCorrente,
        movimentacao_id: null,
        movimentacao_parcela_id: null,
        antecipacao_id: antecipacaoInserida.id, // Agora incluímos o ID da antecipação
        situacao: "conciliado",
        forma_pagamento: formasPagamento.find(f => f.id === formaPagamento)?.nome || "Dinheiro"
      };

      console.log("Dados do fluxo de caixa:", fluxoCaixaData);

      // Inserir no fluxo de caixa
      const { data: fluxoInserido, error: fluxoError } = await supabase
        .from("fluxo_caixa")
        .insert(fluxoCaixaData)
        .select()
        .single();

      if (fluxoError) {
        console.error("Erro ao inserir no fluxo de caixa:", fluxoError);
        console.error("Dados que causaram erro:", fluxoCaixaData);
        throw fluxoError;
      }

      console.log("Fluxo de caixa inserido com sucesso:", fluxoInserido);

      // Atualizar saldo da conta corrente
      const { error: saldoError } = await supabase
        .from("contas_correntes")
        .update({ saldo_inicial: novoSaldo })
        .eq("id", contaCorrente);

      if (saldoError) {
        console.error("Erro ao atualizar saldo da conta corrente:", saldoError);
        throw saldoError;
      }

      console.log("Saldo da conta corrente atualizado");

      toast.success("Antecipação registrada com sucesso!");
      resetForm();
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
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Antecipação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Primeira linha - Operação, Data Emissão, Data Lançamento */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Operação</Label>
              <Select value={operacao} onValueChange={(v) => setOperacao(v as any)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="receber">Antecipação de Cliente</SelectItem>
                  <SelectItem value="pagar">Antecipação de Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <DateInput
                label="Data de Emissão"
                value={dataEmissao}
                onChange={setDataEmissao}
              />
            </div>

            <div>
              <DateInput
                label="Data de Lançamento"
                value={dataLancamento}
                onChange={setDataLancamento}
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
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Número do Documento</Label>
              <Input
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value)}
                placeholder="Número do documento"
                className="bg-white"
              />
            </div>
          </div>

          {/* Terceira linha - Tipo Título, Favorecido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Tipo de Título</Label>
              <Select value={tipoTitulo} onValueChange={setTipoTitulo}>
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
              <Select value={favorecido} onValueChange={setFavorecido}>
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
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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
              <Select value={contaCorrente} onValueChange={setContaCorrente}>
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
              <Label>Valor</Label>
              <Input
                value={valor}
                onChange={handleValorChange}
                placeholder="0,00"
                className="bg-white"
              />
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
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              variant="blue" 
              onClick={handleSalvar} 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
