
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "./utils/leadUtils";

interface LeadInteracaoDataFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function LeadInteracaoDataField({
  date,
  onDateChange,
}: LeadInteracaoDataFieldProps) {
  // Garantir que estamos trabalhando com um objeto Date válido
  const ensureValidDate = (dateInput: Date | string | null): Date => {
    if (!dateInput) return new Date();
    
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    try {
      // Se for uma string no formato dd/mm/yyyy
      if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const [day, month, year] = dateInput.split('/').map(Number);
        return new Date(year, month - 1, day);
      }
      
      // Se for uma string no formato ISO (yyyy-mm-dd)
      if (typeof dateInput === 'string' && dateInput.includes('-')) {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      
      return new Date(dateInput);
    } catch (error) {
      console.error('Erro ao converter data:', error);
      return new Date();
    }
  };

  const safeDate = ensureValidDate(date);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            formatDate(safeDate)
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={safeDate}
          onSelect={(newDate) => newDate && onDateChange(newDate)}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
