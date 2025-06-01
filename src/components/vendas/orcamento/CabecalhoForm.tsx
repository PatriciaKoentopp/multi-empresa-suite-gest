
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Favorecido } from "@/types";

interface CabecalhoFormProps {
  data: Date | undefined;
  onDataChange: (data: Date | undefined) => void;
  codigoVenda: string;
  onCodigoVendaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  favorecidoId: string;
  onFavorecidoChange: (value: string) => void;
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="data" className="block text-sm font-medium mb-1">
          Data *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={data}
              onSelect={onDataChange}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mostrar código apenas quando estiver editando/visualizando um orçamento existente */}
      {codigoVenda && (
        <div>
          <Label htmlFor="codigo" className="block text-sm font-medium mb-1">
            Código do Orçamento
          </Label>
          <Input
            id="codigo"
            type="text"
            value={codigoVenda}
            readOnly
            disabled
            className="bg-gray-50"
            placeholder="Será gerado automaticamente"
          />
        </div>
      )}

      <div className={codigoVenda ? "" : "md:col-span-2"}>
        <Label htmlFor="favorecido" className="block text-sm font-medium mb-1">
          Cliente/Favorecido *
        </Label>
        <Select 
          value={favorecidoId} 
          onValueChange={onFavorecidoChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o favorecido" />
          </SelectTrigger>
          <SelectContent>
            {favorecidos.map((favorecido) => (
              <SelectItem key={favorecido.id} value={favorecido.id}>
                {favorecido.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
