
import React from 'react';
import { Parcela } from '@/types/orcamento';

interface ParcelasFormProps {
  parcelas: Parcela[];
  onValorChange: (index: number, valor: number) => void;
  onDataChange: (index: number, data: string) => void;
}

export const ParcelasForm = ({ parcelas, onValorChange, onDataChange }: ParcelasFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Parcelas</h3>
      {parcelas.map((parcela, index) => (
        <div key={index} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Valor</label>
            <input
              type="number"
              value={parcela.valor}
              onChange={(e) => onValorChange(index, Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data de Vencimento</label>
            <input
              type="date"
              value={parcela.dataVencimento}
              onChange={(e) => onDataChange(index, e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      ))}
    </div>
  );
};
