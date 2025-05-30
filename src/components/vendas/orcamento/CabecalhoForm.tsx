
import React, { useState } from 'react';
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
import { Check, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [open, setOpen] = useState(false);
  
  // Função para filtrar os favorecidos com base no termo de busca
  const filteredFavorecidos = favorecidos.filter(favorecido => {
    if (!searchTerm) return true;
    return favorecido.nome.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Encontra o favorecido selecionado
  const selectedFavorecido = favorecidos.find(f => f.id === favorecidoId);

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
            placeholder="Código será gerado automaticamente"
            required
            disabled={true}
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block text-sm mb-1">Favorecido *</label>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                {selectedFavorecido ? selectedFavorecido.nome : "Selecione o Favorecido"}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white">
              <div className="px-3 py-2">
                <Input
                  placeholder="Buscar favorecido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full"
                />
              </div>
              <ScrollArea className="h-72">
                <div className="p-1">
                  {filteredFavorecidos.length > 0 ? (
                    filteredFavorecidos.map((favorecido) => (
                      <div
                        key={favorecido.id}
                        className={cn(
                          "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                          favorecidoId === favorecido.id ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => {
                          onFavorecidoChange(favorecido.id);
                          setOpen(false);
                          setSearchTerm("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            favorecidoId === favorecido.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {favorecido.nome}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhum favorecido encontrado
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
