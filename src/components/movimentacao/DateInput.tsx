
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
  placeholder?: string;
};

export function DateInput({ label, value, onChange, disabled = false, placeholder = "DD/MM/AAAA" }: DateInputProps) {
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

  const formatDateInput = (input: string): string => {
    // Remove tudo que não for número
    const numbers = input.replace(/\D/g, '');
    
    // Aplica a formatação conforme o usuário digita
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatDateInput(rawValue);
    
    setInputValue(formattedValue);

    // Apenas tenta converter para data se tiver o formato completo DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(formattedValue)) {
      const parsedDate = parseDateString(formattedValue);
      if (parsedDate) {
        onChange(parsedDate);
      } else {
        onChange(undefined);
      }
    } else if (!formattedValue) {
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
    
    // Criamos uma nova data preservando dia/mês/ano sem alterar timezone
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const newDate = new Date(year, month, day, 12, 0, 0);
    
    onChange(newDate);
    setOpen(false);
  };

  return (
    <div className={`flex flex-col ${label ? 'gap-1' : ''} w-full`}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative flex w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative flex w-full">
            <Input
              type="text"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              className="bg-white h-9 pr-8 text-sm"
              disabled={disabled}
              maxLength={10}
            />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "absolute right-0 h-full px-1 hover:bg-gray-100",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
                type="button"
              >
                <CalendarIcon className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0 z-50" align="end">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              disabled={disabled}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
