
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ContaPagar } from "./contas-a-pagar-table";
import { X } from "lucide-react";

interface RenegociarParcelasModalProps {
  open: boolean;
  onClose: () => void;
  conta: ContaPagar | null;
  onRenegociar: (id: string, dataVencimento: string, valor: number) => Promise<void>;
}

interface Parcela {
  numero: number;
  dataVencimento: string;
  valor: number;
}

export function RenegociarParcelasModal({
  open,
  onClose,
  conta,
  onRenegociar
}: RenegociarParcelasModalProps) {
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [valoresEmEdicao, setValoresEmEdicao] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (conta) {
      // Inicializa com uma parcela por padrão
      resetParcelas();
    }
  }, [conta]);
  
  const resetParcelas = () => {
    if (!conta) return;
    
    setNumeroParcelas(1);
    
    const dataFormatada = conta.dataVencimento
      ? new Date(conta.dataVencimento).toISOString().split('T')[0]
      : '';
      
    setParcelas([
      {
        numero: 1,
        dataVencimento: dataFormatada,
        valor: conta.valor
      }
    ]);
    setValoresEmEdicao({});
  };
  
  const handleNumeroParcelasChange = (incremento: number) => {
    const novoNumero = Math.max(1, numeroParcelas + incremento);
    
    if (novoNumero === numeroParcelas) return;
    
    setNumeroParcelas(novoNumero);
    
    if (!conta) return;
    
    // Atualiza o array de parcelas
    if (novoNumero > parcelas.length) {
      // Adiciona novas parcelas
      const novasParcelas = [...parcelas];
      const valorPorParcela = conta.valor / novoNumero;
      
      // Recalcular todas as parcelas para distribuir o valor igualmente
      for (let i = 0; i < novasParcelas.length; i++) {
        novasParcelas[i].valor = valorPorParcela;
      }
      
      // Adicionar as parcelas que faltam
      for (let i = parcelas.length; i < novoNumero; i++) {
        const dataBase = new Date(conta.dataVencimento);
        dataBase.setMonth(dataBase.getMonth() + i);
        
        novasParcelas.push({
          numero: i + 1,
          dataVencimento: dataBase.toISOString().split('T')[0],
          valor: valorPorParcela
        });
      }
      
      setParcelas(novasParcelas);
    } else {
      // Remove parcelas excedentes
      const novasParcelas = parcelas.slice(0, novoNumero);
      const valorPorParcela = conta.valor / novoNumero;
      
      // Recalcular todas as parcelas para distribuir o valor igualmente
      for (let i = 0; i < novasParcelas.length; i++) {
        novasParcelas[i].valor = valorPorParcela;
      }
      
      setParcelas(novasParcelas);
    }
  };
  
  const handleDataVencimentoChange = (index: number, data: string) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index].dataVencimento = data;
    setParcelas(novasParcelas);
  };
  
  const handleValorChange = (index: number, valor: string) => {
    // Atualizar o valor em edição imediatamente (permite digitação livre)
    setValoresEmEdicao(prev => ({ ...prev, [index]: valor }));
  };

  const handleValorBlur = (index: number) => {
    const valorEmEdicao = valoresEmEdicao[index];
    if (valorEmEdicao !== undefined) {
      // Tentar converter o valor digitado
      const valorNumerico = parseFloat(valorEmEdicao.replace(/\./g, '').replace(',', '.'));
      
      if (!isNaN(valorNumerico) && valorNumerico > 0) {
        // Valor válido: atualizar o estado das parcelas
        const novasParcelas = [...parcelas];
        novasParcelas[index].valor = valorNumerico;
        setParcelas(novasParcelas);
      }
      
      // Limpar o valor em edição
      setValoresEmEdicao(prev => {
        const novo = { ...prev };
        delete novo[index];
        return novo;
      });
    }
  };
  
  const formatValorInput = (valor: number) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conta || parcelas.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível renegociar as parcelas."
      });
      return;
    }
    
    // Validar se todas as parcelas têm data de vencimento
    const parcelaInvalida = parcelas.find(p => !p.dataVencimento);
    if (parcelaInvalida) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Todas as parcelas devem ter data de vencimento."
      });
      return;
    }
    
    // Validar se a soma dos valores bate com o valor original
    const valorTotal = parcelas.reduce((acc, p) => acc + p.valor, 0);
    const diferenca = Math.abs(valorTotal - conta.valor);
    
    if (diferenca > 0.1) { // Tolerância de 10 centavos
      toast({
        variant: "destructive",
        title: "Erro",
        description: `A soma dos valores das parcelas (${formatCurrency(valorTotal)}) não corresponde ao valor original (${formatCurrency(conta.valor)}).`
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (parcelas.length === 1) {
        // Se for apenas uma parcela, usar a função onRenegociar existente
        await onRenegociar(
          conta.id, 
          parcelas[0].dataVencimento, 
          parcelas[0].valor
        );
      } else {
        // Se for mais de uma parcela, implementar a lógica de múltiplas parcelas
        await renegociarMultiplasParcelas();
      }
      
      toast({
        title: "Sucesso",
        description: "Parcela(s) renegociada(s) com sucesso!"
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
  
  const renegociarMultiplasParcelas = async () => {
    if (!conta || !conta.movimentacao_id) return;
    
    // 1. Remover a parcela atual
    const { error: deleteError } = await supabase
      .from('movimentacoes_parcelas')
      .delete()
      .eq('id', conta.id);
      
    if (deleteError) {
      throw deleteError;
    }
    
    // 2. Inserir as novas parcelas
    const novasParcelas = parcelas.map(parcela => ({
      movimentacao_id: conta.movimentacao_id,
      numero: parcela.numero,
      valor: parcela.valor,
      data_vencimento: parcela.dataVencimento
    }));
    
    const { error: insertError } = await supabase
      .from('movimentacoes_parcelas')
      .insert(novasParcelas);
      
    if (insertError) {
      throw insertError;
    }
  };
  
  if (!conta) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Renegociar Parcela</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-gray-50 border">
            <div>
              <div className="text-sm font-medium mb-1">Favorecido:</div>
              <div className="font-medium">{conta.favorecido}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Parcela original:</div>
              <div className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 inline-block">
                {`${conta.numeroTitulo || '-'}/${conta.numeroParcela}`}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Descrição:</div>
              <div>{conta.descricao || "-"}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Valor original:</div>
              <div className="font-medium">{formatCurrency(conta.valor)}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Vencimento original:</div>
              <div>{formatDate(conta.dataVencimento)}</div>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="numeroParcelas">Número de parcelas para renegociação</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleNumeroParcelasChange(-1)}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                <div className="w-12 text-center font-medium">
                  {numeroParcelas}
                </div>
                <Button 
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleNumeroParcelasChange(1)}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Parcelas</h3>
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 border-b text-sm font-medium">
                  <div className="col-span-1">Nº</div>
                  <div className="col-span-6">Vencimento</div>
                  <div className="col-span-5">Valor</div>
                </div>
                
                <div className="divide-y">
                  {parcelas.map((parcela, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 items-center">
                      <div className="col-span-1 font-mono text-sm">{parcela.numero}</div>
                      <div className="col-span-6">
                        <Input
                          type="date"
                          className="bg-white"
                          value={parcela.dataVencimento}
                          onChange={(e) => handleDataVencimentoChange(index, e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="text"
                          className="bg-white text-right font-mono"
                          value={valoresEmEdicao[index] !== undefined 
                            ? valoresEmEdicao[index] 
                            : formatValorInput(parcela.valor)
                          }
                          onChange={(e) => handleValorChange(index, e.target.value)}
                          onBlur={() => handleValorBlur(index)}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end mt-2 text-sm font-medium">
                Total: {formatCurrency(parcelas.reduce((acc, p) => acc + p.valor, 0))}
              </div>
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
              {isLoading ? "Salvando..." : "Confirmar Renegociação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
