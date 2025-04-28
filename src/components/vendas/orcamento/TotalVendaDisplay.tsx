
import React from 'react';
import { Input } from "@/components/ui/input";

interface TotalVendaDisplayProps {
  total: number;
  somaParcelas?: number;
  mostrarAlerta?: boolean;
}

export function TotalVendaDisplay({ total, somaParcelas, mostrarAlerta = false }: TotalVendaDisplayProps) {
  // Verificar se há diferença entre o valor total e a soma das parcelas (com tolerância de centavos)
  const valoresTotaisCorretos = !somaParcelas || Math.abs(total - somaParcelas) < 0.02;
  const exibirAlerta = mostrarAlerta && !valoresTotaisCorretos && somaParcelas !== undefined;
  
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
      
      {exibirAlerta && (
        <div className="mt-2 text-red-600 text-sm">
          A soma dos valores das parcelas ({somaParcelas.toFixed(2)}) 
          não corresponde ao valor total ({total.toFixed(2)})
        </div>
      )}
    </div>
  );
}
