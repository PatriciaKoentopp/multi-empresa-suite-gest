
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ContaPagar } from "./contas-a-pagar-table";

interface RenegociarParcelasModalProps {
  open: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  onRenegociar: (id: string, dataVencimento: string, valor: number) => Promise<void>;
}

export function RenegociarParcelasModal({
  open,
  onClose,
  conta,
  onRenegociar
}: RenegociarParcelasModalProps) {
  const [dataVencimento, setDataVencimento] = useState("");
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (conta && conta.dataVencimento) {
      const dataFormatada = new Date(conta.dataVencimento)
        .toISOString()
        .split('T')[0];
      setDataVencimento(dataFormatada);
      setValor(conta.valor.toString());
    }
  }, [conta]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conta || !dataVencimento || !valor) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos."
      });
      return;
    }
    
    const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor inválido."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onRenegociar(conta.id, dataVencimento, valorNumerico);
      toast({
        title: "Sucesso",
        description: "Parcela renegociada com sucesso!"
      });
      onClose();
    } catch (error) {
      console.error("Erro ao renegociar parcela:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao renegociar parcela."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatValor = (value: string) => {
    // Remove tudo que não for número
    let onlyNumbers = value.replace(/\D/g, '');
    
    // Converte para número e formata como moeda
    const numberValue = Number(onlyNumbers) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatValor(e.target.value);
    setValor(formattedValue);
  };
  
  if (!conta) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renegociar Parcela</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-y-2">
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Parcela:</div>
              <div className="font-mono text-xs px-2 py-1 rounded bg-gray-50 text-gray-700 border border-gray-200 inline-block">
                {`${conta.numeroTitulo || '-'}/${conta.numeroParcela}`}
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Favorecido:</div>
              <div>{conta.favorecido}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Descrição:</div>
              <div>{conta.descricao || "-"}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Vencimento original:</div>
              <div>{formatDate(conta.dataVencimento)}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Valor original:</div>
              <div>{formatCurrency(conta.valor)}</div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dataVencimento">Nova data de vencimento</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="valor">Novo valor</Label>
              <Input
                id="valor"
                value={valor}
                onChange={handleValorChange}
                required
                className="bg-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="blue"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
