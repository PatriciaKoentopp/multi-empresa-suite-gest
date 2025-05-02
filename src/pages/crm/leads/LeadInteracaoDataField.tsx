
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
      // Para evitar problemas de timezone, normalizar para meio-dia
      return new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate(),
        12, 0, 0
      );
    }
    
    try {
      // Se for uma string no formato dd/mm/yyyy
      if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const [day, month, year] = dateInput.split('/').map(Number);
        // Definir hora como 12:00 para evitar problemas de timezone
        return new Date(year, month - 1, day, 12, 0, 0);
      }
      
      // Qualquer outro formato, normalizar para meio-dia
      const tempDate = new Date(dateInput);
      return new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        12, 0, 0
      );
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
            format(safeDate, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>Selecione uma data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={safeDate}
          onSelect={(newDate) => {
            if (newDate) {
              // Normalizar a data para meio-dia para evitar problemas de timezone
              const normalizedDate = new Date(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
                12, 0, 0
              );
              onDateChange(normalizedDate);
            }
          }}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}
