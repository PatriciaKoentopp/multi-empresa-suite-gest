
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { PlanoConta } from "@/types/plano-contas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface ContabilizarParcelaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (parcela: any) => void;
  contas: PlanoConta[];
}

export default function ContabilizarParcelaModal({ open, onClose, onSave, contas }: ContabilizarParcelaModalProps) {
  const { empresaId } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [movimentacaoId, setMovimentacaoId] = useState<string>("");
  const [parcelaId, setParcelaId] = useState<string>("");
  const [data, setData] = useState<Date>(new Date());
  const [valor, setValor] = useState<string>("");
  const [juros, setJuros] = useState<string>("0");
  const [multa, setMulta] = useState<string>("0");
  const [desconto, setDesconto] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Resetar formulário quando o modal abre
  useEffect(() => {
    if (open) {
      setData(new Date());
      setValor("");
      setJuros("0");
      setMulta("0");
      setDesconto("0");
      setMovimentacaoId("");
      setParcelaId("");
      loadMovimentacoes();
    }
  }, [open, empresaId]);

  // Carregar movimentações com tipo de título definido (necessário para contabilizar)
  const loadMovimentacoes = async () => {
    if (!empresaId) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          id, 
          descricao, 
          tipo_operacao,
          data_lancamento,
          numero_documento,
          tipo_titulo_id,
          favorecido_id,
          favorecido:favorecido_id(nome),
          tipo_titulo:tipo_titulo_id(nome)
        `)
        .eq("empresa_id", empresaId)
        .is("tipo_titulo_id", 'not.null')
        .order("data_lancamento", { ascending: false });
        
      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
      toast.error("Erro ao carregar movimentações");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar parcelas de uma movimentação
  const loadParcelas = async (movId: string) => {
    if (!movId) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("movimentacoes_parcelas")
        .select("*")
        .eq("movimentacao_id", movId)
        .order("numero", { ascending: true });
        
      if (error) throw error;
      setParcelas(data || []);
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
      toast.error("Erro ao carregar parcelas");
    } finally {
      setIsLoading(false);
    }
  };

  // Quando a movimentação é selecionada, carregar suas parcelas
  const handleMovimentacaoChange = (id: string) => {
    setMovimentacaoId(id);
    setParcelaId("");
    loadParcelas(id);
  };

  // Quando uma parcela é selecionada, preencher o valor
  const handleParcelaChange = (id: string) => {
    setParcelaId(id);
    const parcela = parcelas.find(p => p.id === id);
    if (parcela) {
      setValor(parcela.valor.toString());
    }
  };

  const clearForm = () => {
    setData(new Date());
    setValor("");
    setJuros("0");
    setMulta("0");
    setDesconto("0");
    setMovimentacaoId("");
    setParcelaId("");
    setParcelas([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movimentacaoId || !parcelaId || !data) {
      toast.error("Selecione uma movimentação e parcela para contabilizar");
      return;
    }

    const jurosParsed = parseFloat(juros) || 0;
    const multaParsed = parseFloat(multa) || 0;
    const descontoParsed = parseFloat(desconto) || 0;
    
    if (jurosParsed === 0 && multaParsed === 0 && descontoParsed === 0) {
      toast.error("Defina valores para juros, multa ou desconto");
      return;
    }

    const valorParsed = parseFloat(valor);
    if (isNaN(valorParsed) || valorParsed <= 0) {
      toast.error("Valor da parcela inválido");
      return;
    }

    const parcela = parcelas.find(p => p.id === parcelaId);
    if (!parcela) {
      toast.error("Parcela não encontrada");
      return;
    }

    // Enviar para contabilização
    onSave({
      id: parcelaId,
      movimentacao_id: movimentacaoId,
      data_pagamento: format(data, 'yyyy-MM-dd'),
      valor: valorParsed,
      juros: jurosParsed || undefined,
      multa: multaParsed || undefined,
      desconto: descontoParsed || undefined
    });
  };

  // Formatador de moeda para exibição amigável
  const formatarValor = (valor: string) => {
    // Remover caracteres não numéricos
    const numerico = valor.replace(/\D/g, "");
    
    // Converter para número com 2 casas decimais
    const numero = parseInt(numerico) / 100;
    
    // Formatar com R$
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para manipular mudança de valores numéricos (juros, multa, desconto)
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const valor = e.target.value.replace(/\D/g, "");
    if (valor === "") {
      setter("0");
      return;
    }
    const valorNumerico = parseFloat(valor) / 100;
    setter(valorNumerico.toString());
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) { clearForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contabilizar Juros/Multa/Desconto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-sm font-medium mb-1 block">Movimentação</label>
            <Select value={movimentacaoId} onValueChange={handleMovimentacaoChange}>
              <SelectTrigger className="w-full bg-white border rounded">
                <SelectValue placeholder="Selecione uma movimentação" />
              </SelectTrigger>
              <SelectContent className="bg-white border z-50 max-h-[300px]">
                {isLoading ? (
                  <div className="flex justify-center p-2">Carregando...</div>
                ) : (
                  movimentacoes.map(mov => (
                    <SelectItem key={mov.id} value={mov.id}>
                      {mov.favorecido?.nome || 'Sem favorecido'} - {mov.descricao || mov.tipo_titulo?.nome || mov.numero_documento || 'Sem descrição'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Parcela</label>
            <Select value={parcelaId} onValueChange={handleParcelaChange} disabled={!movimentacaoId || isLoading}>
              <SelectTrigger className="w-full bg-white border rounded">
                <SelectValue placeholder="Selecione uma parcela" />
              </SelectTrigger>
              <SelectContent className="bg-white border z-50">
                {isLoading ? (
                  <div className="flex justify-center p-2">Carregando...</div>
                ) : parcelas.length === 0 ? (
                  <div className="flex justify-center p-2 text-sm text-gray-500">Nenhuma parcela disponível</div>
                ) : (
                  parcelas.map(parcela => (
                    <SelectItem key={parcela.id} value={parcela.id}>
                      Parcela {parcela.numero} - {formatarValor(parcela.valor.toString())}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Data de Pagamento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "w-full justify-start text-left font-normal",
                  !data && "text-muted-foreground"
                )}>
                  <CalendarPlus className="mr-2 h-4 w-4 opacity-70" />
                  {data ? format(data, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={d => d && setData(d)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Juros</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                type="text"
                className="pl-8"
                value={formatarValor(juros).replace("R$", "").trim()}
                onChange={(e) => handleValorChange(e, setJuros)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Multa</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                type="text"
                className="pl-8"
                value={formatarValor(multa).replace("R$", "").trim()}
                onChange={(e) => handleValorChange(e, setMulta)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Desconto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                type="text"
                className="pl-8"
                value={formatarValor(desconto).replace("R$", "").trim()}
                onChange={(e) => handleValorChange(e, setDesconto)}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="blue" type="submit" disabled={isLoading}>
              {isLoading ? "Processando..." : "Contabilizar"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" type="button" className="ml-2">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
