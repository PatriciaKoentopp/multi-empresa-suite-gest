
import React from 'react';
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/movimentacao/DateInput";
import { formatCurrency } from "@/lib/utils";

interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: Date;
}

interface ParcelasFormProps {
  parcelas: Parcela[];
  onValorChange: (index: number, valor: number) => void;
  onDataChange: (index: number, data: Date) => void;
  valorTotal?: number;
  somaParcelas?: number;
  readOnly?: boolean;
  mostrarAlertaDiferenca?: boolean;
}

export function ParcelasForm({
  parcelas,
  onValorChange,
  onDataChange,
  valorTotal = 0,
  somaParcelas = 0,
  readOnly = false,
  mostrarAlertaDiferenca = true
}: ParcelasFormProps) {
  // Verificar se há diferença entre o valor total e a soma das parcelas
  const temDiferenca = mostrarAlertaDiferenca && 
    Math.abs((valorTotal || 0) - (somaParcelas || 0)) > 0.01;

  return (
    <div className="space-y-2">
      {parcelas.map((parcela, index) => (
        <div key={index} className="flex flex-col md:flex-row gap-2 pb-2 border-b">
          <div className="w-full md:w-16">
            <label className="block text-xs mb-1">Parcela</label>
            <Input
              value={parcela.numero}
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-xs mb-1">Valor</label>
            <Input
              type="number"
              value={parcela.valor}
              onChange={(e) => onValorChange(index, parseFloat(e.target.value) || 0)}
              className={readOnly ? "bg-gray-100" : ""}
              disabled={readOnly}
              min={0}
              step={0.01}
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-xs mb-1">Vencimento</label>
            <DateInput
              value={parcela.dataVencimento}
              onChange={(date) => {
                if (date) {
                  // Garantir que não ocorra nenhuma conversão de timezone
                  onDataChange(index, date);
                }
              }}
              disabled={readOnly}
            />
          </div>
        </div>
      ))}
      
      {temDiferenca && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <p>
            Atenção: O valor das parcelas ({formatCurrency(somaParcelas)}) não corresponde ao valor total ({formatCurrency(valorTotal)}).
            <br />
            Diferença: {formatCurrency(Math.abs(valorTotal - somaParcelas))}
          </p>
        </div>
      )}
    </div>
  );
}
