
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, parseDateString } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

type DateInputProps = {
  label?: string;
  value?: Date | null;
  onChange: (date?: Date | null) => void;
  disabled?: boolean;
};

export function DateInput({ label, value, onChange, disabled = false }: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  
  // Atualiza o valor do input quando o value de fora muda
  useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    setInputValue(inputText);

    // Apenas tenta converter para data se tiver o formato completo DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputText)) {
      const parsedDate = parseDateString(inputText);
      if (parsedDate) {
        onChange(parsedDate);
      } else {
        onChange(undefined);
      }
    } else if (!inputText) {
      onChange(undefined);
    }
  };

  const handleBlur = () => {
    // Se o valor do input não estiver vazio e não for uma data válida, limpa o input
    if (inputValue && !(/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue))) {
      setInputValue('');
      onChange(undefined);
    }
  };

  // Função para lidar com a seleção do calendário
  const handleCalendarSelect = (date?: Date) => {
    if (!date) {
      onChange(null);
      return;
    }
    
    // Cria uma data no formato UTC para evitar problemas de timezone
    const utcDate = new Date(Date.UTC(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate()
    ));
    
    onChange(utcDate);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative flex w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative flex w-full">
            <Input
              type="text"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="DD/MM/AAAA"
              className="bg-white pr-10"
              disabled={disabled}
            />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "absolute right-0 h-full px-2 hover:bg-gray-100",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              disabled={disabled}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
