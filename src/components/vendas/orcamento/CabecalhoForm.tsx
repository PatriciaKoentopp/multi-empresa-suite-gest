
import React, { useState, useMemo } from 'react';
import { DateInput } from "@/components/movimentacao/DateInput";
import { Input } from "@/components/ui/input";
import { Favorecido } from '@/types';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtra os favorecidos com base no termo de busca
  const filteredFavorecidos = useMemo(() => {
    if (!searchTerm.trim()) return favorecidos;
    
    const termLower = searchTerm.toLowerCase();
    return favorecidos.filter(f => 
      f.nome.toLowerCase().includes(termLower)
    );
  }, [favorecidos, searchTerm]);

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
          <div className="relative">
            <div className="relative mb-2">
              <Input
                type="text"
                placeholder="Buscar favorecido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
                disabled={disabled}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <Select 
              value={favorecidoId} 
              onValueChange={onFavorecidoChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Favorecido" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredFavorecidos.length > 0 ? (
                  filteredFavorecidos.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-gray-500">
                    Nenhum favorecido encontrado
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
