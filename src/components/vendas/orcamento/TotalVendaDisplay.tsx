
import React from 'react';
import { Input } from "@/components/ui/input";

interface TotalVendaDisplayProps {
  total: number;
}

export function TotalVendaDisplay({ total }: TotalVendaDisplayProps) {
  return (
    <div>
      <label className="block text-sm mb-1 font-semibold">
        Total da Venda
      </label>
      <Input
        type="text"
        value={total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}
        readOnly
      />
    </div>
  );
}
