
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Orcamento } from "@/types";
import { useCompany } from "@/contexts/company-context";

interface EfetivarVendaModalProps {
  open: boolean;
  onClose: () => void;
  orcamento?: Orcamento | null;
  onSuccess: () => void;
}

export function EfetivarVendaModal({ open, onClose, orcamento, onSuccess }: EfetivarVendaModalProps) {
  const { currentCompany } = useCompany();
  const [dataVenda, setDataVenda] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirmar() {
    if (!orcamento || !currentCompany?.id) return;

    setIsLoading(true);
    try {
      // 1. Buscar todos os itens e parcelas do orçamento
      const { data: itens, error: itensError } = await supabase
        .from('orcamentos_itens')
        .select('*')
        .eq('orcamento_id', orcamento.id);

      if (itensError) throw itensError;

      const { data: parcelas, error: parcelasError } = await supabase
        .from('orcamentos_parcelas')
        .select('*')
        .eq('orcamento_id', orcamento.id);

      if (parcelasError) throw parcelasError;

      // 2. Criar movimentação
      const valorTotal = itens.reduce((sum, item) => sum + Number(item.valor), 0);
      
      const { data: movimentacao, error: movError } = await supabase
        .from('movimentacoes')
        .insert({
          empresa_id: currentCompany.id,
          tipo_operacao: 'receber',
          data_lancamento: dataVenda,
          data_emissao: dataVenda,
          favorecido_id: orcamento.favorecido_id,
          forma_pagamento: orcamento.forma_pagamento,
          valor: valorTotal,
          numero_parcelas: parcelas.length,
          primeiro_vencimento: parcelas[0]?.data_vencimento,
          descricao: `Venda ${orcamento.codigo}`,
          considerar_dre: true
        })
        .select()
        .single();

      if (movError) throw movError;

      // 3. Criar parcelas da movimentação
      const parcelasMovimentacao = parcelas.map(parcela => ({
        movimentacao_id: movimentacao.id,
        numero: parseInt(parcela.numero_parcela.split('/')[1]),
        valor: parcela.valor,
        data_vencimento: parcela.data_vencimento
      }));

      const { error: parcelasMovError } = await supabase
        .from('movimentacoes_parcelas')
        .insert(parcelasMovimentacao);

      if (parcelasMovError) throw parcelasMovError;

      // 4. Atualizar o orçamento para tipo "venda" e incluir data_venda
      const { error: orcamentoError } = await supabase
        .from('orcamentos')
        .update({ 
          tipo: 'venda',
          data_venda: dataVenda
        })
        .eq('id', orcamento.id);

      if (orcamentoError) throw orcamentoError;

      toast.success("Venda efetivada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao efetivar venda:', error);
      toast.error("Erro ao efetivar venda");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Efetivar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data da Venda *</label>
            <Input
              type="date"
              value={dataVenda}
              onChange={(e) => setDataVenda(e.target.value)}
              required
            />
          </div>

          {orcamento && (
            <div className="border rounded-md p-3 bg-gray-50">
              <p className="font-medium">Orçamento: {orcamento.codigo}</p>
              <p className="text-sm text-muted-foreground">
                {orcamento.favorecido?.nome}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancelar</Button>
          </DialogClose>
          <Button 
            variant="blue" 
            onClick={handleConfirmar}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-white" />
                Processando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
