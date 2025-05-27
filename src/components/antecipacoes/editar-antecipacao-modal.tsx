
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Antecipacao } from "./antecipacao-table";

interface EditarAntecipacaoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  antecipacao: Antecipacao | null;
}

export function EditarAntecipacaoModal({ open, onClose, onSave, antecipacao }: EditarAntecipacaoModalProps) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (antecipacao && open) {
      setValor(antecipacao.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setDescricao(antecipacao.descricao || "");
    }
  }, [antecipacao, open]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,.]/g, '');
    setValor(value);
  };

  const handleSalvar = async () => {
    if (!antecipacao) return;

    // Validações básicas
    if (!valor || Number(valor.replace(/\./g, '').replace(',', '.')) <= 0) {
      toast.error("Informe um valor válido");
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

      const { error } = await supabase
        .from("antecipacoes")
        .update({
          valor_total: novoValor,
          descricao: descricao || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", antecipacao.id);

      if (error) {
        console.error("Erro ao atualizar antecipação:", error);
        throw error;
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
    setValor("");
    setDescricao("");
    onClose();
  };

  if (!antecipacao) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Antecipação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Informações não editáveis */}
          <div className="space-y-2 p-3 bg-gray-50 rounded">
            <div className="text-sm">
              <span className="font-medium">Favorecido:</span> {antecipacao.favorecido}
            </div>
            <div className="text-sm">
              <span className="font-medium">Valor utilizado:</span> {antecipacao.valorUtilizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="flex flex-col gap-1">
            <Label>Valor Total</Label>
            <Input
              value={valor}
              onChange={handleValorChange}
              placeholder="0,00"
              className="bg-white"
            />
          </div>

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
