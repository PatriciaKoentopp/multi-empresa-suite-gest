
import React, { useState } from 'react';
import { DateInput } from "@/components/movimentacao/DateInput";
import { Input } from "@/components/ui/input";
import { Favorecido } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CabecalhoFormProps {
  data?: Date;
  onDataChange: (date?: Date) => void;
  codigoVenda: string;
  onCodigoVendaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  favorecidoId: string;
  onFavorecidoChange: (id: string) => void;
  favorecidos: Favorecido[];
  disabled?: boolean;
}

export function CabecalhoForm({
  data,
  onDataChange,
  codigoVenda,
  onCodigoVendaChange,
  favorecidoId,
  onFavorecidoChange,
  favorecidos,
  disabled = false
}: CabecalhoFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full">
          <label className="block text-sm mb-1">Data</label>
          <DateInput 
            value={data} 
            onChange={onDataChange}
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-sm mb-1">Código da Venda *</label>
          <Input 
            type="text" 
            value={codigoVenda} 
            onChange={onCodigoVendaChange}
            placeholder="Digite o código da venda"
            required
            disabled={disabled}
          />
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block text-sm mb-1">Favorecido *</label>
          <Select 
            value={favorecidoId} 
            onValueChange={onFavorecidoChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Favorecido" />
            </SelectTrigger>
            <SelectContent>
              {favorecidos.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
