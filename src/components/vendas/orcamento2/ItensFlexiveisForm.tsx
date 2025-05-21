
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Servico, Produto } from '@/types';
import { OrcamentoItem } from '@/types/orcamento';
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface ItensFlexiveisFormProps {
  itens: OrcamentoItem[];
  servicosDisponiveis: Servico[];
  onItemChange: (idx: number, field: string, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  disabled?: boolean;
}

export function ItensFlexiveisForm({
  itens,
  servicosDisponiveis,
  onItemChange,
  onAddItem,
  onRemoveItem,
  disabled = false
}: ItensFlexiveisFormProps) {
  const { currentCompany } = useCompany();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      carregarProdutos();
    }
  }, [currentCompany]);

  async function carregarProdutos() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTipoItemChange = (idx: number, tipo: "servico" | "produto") => {
    onItemChange(idx, "tipoItem", tipo);
    // Limpar os IDs quando o tipo muda
    if (tipo === "servico") {
      onItemChange(idx, "produtoId", "");
      if (servicosDisponiveis.length > 0) {
        onItemChange(idx, "servicoId", servicosDisponiveis[0].id);
      }
    } else {
      onItemChange(idx, "servicoId", "");
      if (produtos.length > 0) {
        onItemChange(idx, "produtoId", produtos[0].id);
      }
    }
  };

  return (
    <div>
      <label className="block text-sm mb-2 font-medium">Itens do Orçamento</label>
      <div className="flex flex-col gap-2">
        {itens.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="w-1/6">
              <Select
                value={item.tipoItem || "servico"}
                onValueChange={(v) => handleTipoItemChange(idx, v as "servico" | "produto")}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              {(item.tipoItem === "produto" || (!item.tipoItem && item.produtoId)) ? (
                <Select
                  value={item.produtoId || ""}
                  onValueChange={v => onItemChange(idx, "produtoId", v)}
                  disabled={disabled || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map(produto => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={item.servicoId || ""}
                  onValueChange={v => onItemChange(idx, "servicoId", v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosDisponiveis.map(servico => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="w-[120px]"
              value={item.valor}
              onChange={e => onItemChange(idx, "valor", e.target.value)}
              placeholder="Valor"
              disabled={disabled}
            />
            {!disabled && itens.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemoveItem(idx)}
              >
                Remover
              </Button>
            )}
          </div>
        ))}
        {!disabled && (
          <Button
            type="button"
            variant="blue"
            onClick={onAddItem}
            className="mt-1"
          >
            <Plus className="mr-1 w-4 h-4" />
            Incluir Item
          </Button>
        )}
      </div>
    </div>
  );
}
