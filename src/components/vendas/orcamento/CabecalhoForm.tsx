
import React, { useState } from 'react';
import { DateInput } from "@/components/movimentacao/DateInput";
import { Input } from "@/components/ui/input";
import { Favorecido } from '@/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
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
            placeholder="Digite o código da venda"
            required
            disabled={disabled}
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
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Buscar favorecido..." />
                <CommandEmpty>Nenhum favorecido encontrado.</CommandEmpty>
                <CommandGroup>
                  {favorecidos.map((favorecido) => (
                    <CommandItem
                      key={favorecido.id}
                      value={favorecido.nome}
                      onSelect={() => {
                        onFavorecidoChange(favorecido.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          favorecidoId === favorecido.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {favorecido.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
