
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormaPagamento {
  id: string;
  label: string;
}

interface PagamentoFormProps {
  formaPagamento: string;
  onFormaPagamentoChange: (value: string) => void;
  numeroParcelas: number;
  onNumeroParcelasChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formasPagamento: FormaPagamento[];
  disabled?: boolean;
}

export function PagamentoForm({
  formaPagamento,
  onFormaPagamentoChange,
  numeroParcelas,
  onNumeroParcelasChange,
  formasPagamento,
  disabled = false
}: PagamentoFormProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/2">
        <label className="block text-sm mb-1">Forma de Pagamento</label>
        <Select 
          value={formaPagamento} 
          onValueChange={onFormaPagamentoChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formasPagamento.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:w-1/2">
        <label className="block text-sm mb-1">Número de Parcelas</label>
        <Input
          type="number"
          min={1}
          max={24}
          value={numeroParcelas}
          onChange={onNumeroParcelasChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
