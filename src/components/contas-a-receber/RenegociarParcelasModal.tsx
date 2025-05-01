
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContaReceber } from "./contas-a-receber-table";
import { ParcelasForm } from "@/components/movimentacao/ParcelasForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface RenegociarParcelasModalProps {
  parcela?: ContaReceber | null;
  open: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

interface NovaParcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

export function RenegociarParcelasModal({ 
  parcela, 
  open, 
  onClose,
  onConfirmar
}: RenegociarParcelasModalProps) {
  const [novasParcelas, setNovasParcelas] = useState<NovaParcela[]>([]);
  const [numParcelas, setNumParcelas] = useState(1);
  const [valorTotal, setValorTotal] = useState(0);

  // Inicializar quando o modal abrir
  useEffect(() => {
    if (open && parcela) {
      // Inicializar com uma parcela com o mesmo valor e vencimento
      const dataAtual = parcela.dataVencimento ? new Date(parcela.dataVencimento) : new Date();
      setValorTotal(parcela.valor || 0);
      setNumParcelas(1);
      setNovasParcelas([
        {
          numero: 1,
          valor: parcela.valor || 0,
          dataVencimento: dataAtual
        }
      ]);
    }
  }, [open, parcela]);

  // Atualizar número de parcelas
  const handleChangeNumParcelas = (novoNumero: number) => {
    if (novoNumero < 1) return;
    if (!parcela) return;
    
    setNumParcelas(novoNumero);
    
    // Valor por parcela (com ajuste de centavos na primeira)
    const valorParcela = Number((parcela.valor / novoNumero).toFixed(2));
    const ajusteCentavos = Number((parcela.valor - (valorParcela * novoNumero)).toFixed(2));
    
    // Criar novas parcelas
    const novaLista: NovaParcela[] = [];
    
    for (let i = 0; i < novoNumero; i++) {
      // Calcular nova data de vencimento com incremento de 30 dias
      const novaData = new Date(parcela.dataVencimento);
      novaData.setDate(novaData.getDate() + (i * 30));
      
      novaLista.push({
        numero: i + 1,
        valor: i === 0 ? valorParcela + ajusteCentavos : valorParcela,
        dataVencimento: novaData
      });
    }
    
    setNovasParcelas(novaLista);
  };

  // Atualizar valor de uma parcela específica
  const handleValorChange = (index: number, valor: number) => {
    setNovasParcelas(prev => {
      const novaLista = [...prev];
      novaLista[index] = {
        ...novaLista[index],
        valor
      };
      return novaLista;
    });
  };

  // Atualizar data de vencimento de uma parcela específica
  const handleDataChange = (index: number, data: Date) => {
    setNovasParcelas(prev => {
      const novaLista = [...prev];
      novaLista[index] = {
        ...novaLista[index],
        dataVencimento: data
      };
      return novaLista;
    });
  };

  // Verificar se os valores das parcelas somam o valor total original
  const verificarValores = () => {
    if (!parcela) return false;
    
    const somaNovasParcelas = novasParcelas.reduce((acc, p) => acc + p.valor, 0);
    const diferencaAceita = 0.01; // Diferença aceitável devido a arredondamentos
    
    return Math.abs(somaNovasParcelas - parcela.valor) <= diferencaAceita;
  };

  // Salvar as novas parcelas
  const handleConfirmar = async () => {
    if (!parcela || !parcela.movimentacao_id) {
      toast.error("Não foi possível identificar a parcela para renegociação");
      return;
    }
    
    if (!verificarValores()) {
      toast.error("A soma dos valores das novas parcelas deve ser igual ao valor da parcela original");
      return;
    }
    
    try {
      // 1. Excluir a parcela original
      const { error: deleteError } = await supabase
        .from('movimentacoes_parcelas')
        .delete()
        .eq('id', parcela.id);
        
      if (deleteError) throw deleteError;
      
      // 2. Obter número atual máximo de parcelas da movimentação
      const { data: parcelasAtuais, error: erroConsulta } = await supabase
        .from('movimentacoes_parcelas')
        .select('numero')
        .eq('movimentacao_id', parcela.movimentacao_id)
        .order('numero', { ascending: false });
        
      if (erroConsulta) throw erroConsulta;
      
      // 3. Determinar o número inicial para as novas parcelas
      let numeroInicial = 1;
      if (parcelasAtuais && parcelasAtuais.length > 0) {
        numeroInicial = parcelasAtuais[0].numero + 1;
      }
      
      // 4. Inserir novas parcelas
      const parcelasParaInserir = novasParcelas.map((p, index) => ({
        movimentacao_id: parcela.movimentacao_id,
        numero: numeroInicial + index,
        valor: p.valor,
        data_vencimento: format(p.dataVencimento, "yyyy-MM-dd")
      }));
      
      const { error: insertError } = await supabase
        .from('movimentacoes_parcelas')
        .insert(parcelasParaInserir);
        
      if (insertError) throw insertError;
      
      // 5. Atualizar o número de parcelas na movimentação
      const { data: dadosMovimentacao, error: erroConsultaMovimentacao } = await supabase
        .from('movimentacoes')
        .select('numero_parcelas')
        .eq('id', parcela.movimentacao_id)
        .single();
        
      if (erroConsultaMovimentacao) throw erroConsultaMovimentacao;
      
      // Calcular novo número total de parcelas
      const novoTotalParcelas = (dadosMovimentacao.numero_parcelas - 1) + novasParcelas.length;
      
      const { error: updateError } = await supabase
        .from('movimentacoes')
        .update({ numero_parcelas: novoTotalParcelas })
        .eq('id', parcela.movimentacao_id);
        
      if (updateError) throw updateError;
      
      toast.success("Renegociação realizada com sucesso!");
      onConfirmar();
      onClose();
      
    } catch (error) {
      console.error("Erro ao renegociar parcela:", error);
      toast.error("Erro ao renegociar parcela");
    }
  };

  // Calcular a soma das novas parcelas
  const somaParcelas = novasParcelas.reduce((acc, parcela) => acc + parcela.valor, 0);
  const diferenca = parcela ? (parcela.valor - somaParcelas) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Renegociar Parcela</DialogTitle>
        </DialogHeader>
        
        {parcela && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border rounded-md p-4 bg-gray-50">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                <p className="font-medium">{parcela.cliente}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Parcela original</h3>
                <p className="font-medium">{parcela.numeroParcela}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vencimento original</h3>
                <p className="font-medium">{format(parcela.dataVencimento, "dd/MM/yyyy")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Valor original</h3>
                <p className="font-medium">{formatCurrency(parcela.valor)}</p>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="font-medium">Número de parcelas para renegociação</Label>
                <div className="flex items-center border rounded-md">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-blue-500"
                    onClick={() => handleChangeNumParcelas(numParcelas - 1)}
                    disabled={numParcelas <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 font-medium">{numParcelas}</span>
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-blue-500"
                    onClick={() => handleChangeNumParcelas(numParcelas + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <ParcelasForm
                parcelas={novasParcelas}
                onValorChange={handleValorChange}
                onDataChange={handleDataChange}
                valorTotal={parcela.valor}
                somaParcelas={somaParcelas}
                mostrarAlertaDiferenca={true}
              />
              
              {Math.abs(diferenca) > 0.01 && (
                <div className="mt-4 p-3 border rounded-md bg-yellow-50 text-yellow-700">
                  <span className="font-medium">Atenção:</span> A soma das parcelas ({formatCurrency(somaParcelas)}) 
                  {diferenca > 0 ? " não atinge " : " ultrapassa "} 
                  o valor original ({formatCurrency(parcela.valor)}) 
                  em {formatCurrency(Math.abs(diferenca))}.
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirmar}
            variant="blue"
            disabled={!verificarValores() || !parcela}
          >
            Confirmar Renegociação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
