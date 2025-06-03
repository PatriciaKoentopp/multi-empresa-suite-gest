import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Orcamento } from "@/types";

interface EfetivarVendaModalProps {
  open: boolean;
  onClose: () => void;
  orcamento: Orcamento;
  onConfirm: () => void;
}

export function EfetivarVendaModal({
  open,
  onClose,
  orcamento,
  onConfirm,
}: EfetivarVendaModalProps) {
  const [valorRecebido, setValorRecebido] = useState<number>(orcamento.valor);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      console.log("Efetivando venda...");
      
      // Buscar informações do favorecido
      const { data: favorecidoData, error: favorecidoError } = await supabase
        .from('favorecidos')
        .select('nome')
        .eq('id', orcamento.favorecido_id)
        .single();

      if (favorecidoError) {
        console.error('Erro ao buscar favorecido:', favorecidoError);
        throw favorecidoError;
      }

      const favorecidoNome = favorecidoData?.nome || '';

      // Inserir dados na tabela de vendas
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert([
          {
            orcamento_id: orcamento.id,
            cliente_id: orcamento.cliente_id,
            favorecido_id: orcamento.favorecido_id,
            valor_total: orcamento.valor,
            valor_recebido: valorRecebido,
            data_venda: new Date().toISOString(),
            empresa_id: orcamento.empresa_id,
            status: 'concluida',
            observacoes: `Venda efetivada do orçamento ${orcamento.id} para ${favorecidoNome}. Valor recebido: ${valorRecebido}`,
          },
        ])
        .select();

      if (vendaError) {
        console.error('Erro ao inserir venda:', vendaError);
        throw vendaError;
      }

      // Atualizar o status do orçamento para "aprovado"
      const { error: orcamentoError } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', orcamento.id);

      if (orcamentoError) {
        console.error('Erro ao atualizar orçamento:', orcamentoError);
        throw orcamentoError;
      }

      console.log("Venda efetivada com sucesso!");
      toast.success("Venda efetivada com sucesso!");
      onConfirm();
      onClose();
    } catch (error: any) {
      console.error("Erro ao efetivar venda:", error);
      toast.error("Erro ao efetivar venda", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Efetivar Venda</SheetTitle>
          <SheetDescription>
            Confirme os detalhes da venda e registre o valor recebido.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valorRecebido" className="text-right">
              Valor Recebido
            </Label>
            <Input
              type="number"
              id="valorRecebido"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <SheetFooter>
          <div className="flex justify-end">
            <SheetClose asChild>
              <Button type="button" variant="secondary" className="mr-2">
                Cancelar
              </Button>
            </SheetClose>
            <Button type="button" onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? "Efetivando..." : "Efetivar Venda"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
