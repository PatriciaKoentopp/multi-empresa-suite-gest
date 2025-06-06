
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Servico } from '@/types';

interface ServicoFormItem {
  servico_id: string;
  valor: number;
}

interface ServicosFormProps {
  servicos: ServicoFormItem[];
  servicosDisponiveis: Servico[];
  onServicoChange: (idx: number, field: "servico_id" | "valor", value: string | number) => void;
  onAddServico: () => void;
  onRemoveServico: (idx: number) => void;
  disabled?: boolean;
}

export function ServicosForm({
  servicos,
  servicosDisponiveis,
  onServicoChange,
  onAddServico,
  onRemoveServico,
  disabled = false
}: ServicosFormProps) {
  return (
    <div>
      <label className="block text-sm mb-2 font-medium">Serviços</label>
      <div className="flex flex-col gap-2">
        {servicos.map((s, idx) => (
          <div key={idx} className="flex gap-2 items-end">
            <div className="w-full">
              <Select
                value={s.servico_id}
                onValueChange={v => onServicoChange(idx, "servico_id", v)}
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
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="w-[120px]"
              value={s.valor}
              onChange={e => onServicoChange(idx, "valor", e.target.value)}
              placeholder="Valor"
              disabled={disabled}
            />
            {!disabled && servicos.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemoveServico(idx)}
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
            onClick={onAddServico}
            className="mt-1"
          >
            <Plus className="mr-1 w-4 h-4" />
            Incluir Serviço
          </Button>
        )}
      </div>
    </div>
  );
}
