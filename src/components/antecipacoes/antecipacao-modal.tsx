
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
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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

  const [operacao, setOperacao] = useState<"cliente" | "fornecedor">("cliente");
  const [dataEmissao, setDataEmissao] = useState<Date>(new Date());
  const [dataLancamento, setDataLancamento] = useState<Date>(new Date());
  const [mesReferencia, setMesReferencia] = useState("");
  const [numDoc, setNumDoc] = useState("");
  const [tipoTitulo, setTipoTitulo] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("1");
  const [valor, setValor] = useState("0");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filtrar tipos de títulos baseado na operação
  const tiposTitulosFiltrados = tiposTitulos.filter(tipo => {
    if (operacao === "cliente") return tipo.tipo === "receber";
    if (operacao === "fornecedor") return tipo.tipo === "pagar";
    return false;
  });

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
    setOperacao("cliente");
    setDataEmissao(new Date());
    setDataLancamento(new Date());
    setMesReferencia("");
    setNumDoc("");
    setTipoTitulo("");
    setFavorecido("");
    setFormaPagamento("1");
    setValor("0");
    setDescricao("");
  };

  const handleSalvar = async () => {
    if (!currentCompany?.id) {
      toast.error("Nenhuma empresa selecionada");
      return;
    }

    // Validações básicas
    if (!tipoTitulo || !favorecido || !valor || Number(valor.replace(/\./g, '').replace(',', '.')) <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Implementar salvamento da antecipação
      // Por enquanto, apenas simular o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));

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
                  <SelectItem value="cliente">Antecipação de Cliente</SelectItem>
                  <SelectItem value="fornecedor">Antecipação de Fornecedor</SelectItem>
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

          {/* Quarta linha - Forma Pagamento, Valor */}
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
              <Label>Valor</Label>
              <Input
                value={valor}
                onChange={handleValorChange}
                placeholder="0,00"
                className="bg-white"
              />
            </div>
          </div>

          {/* Quinta linha - Descrição */}
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
