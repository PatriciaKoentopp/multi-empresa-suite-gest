
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface LeadInteracaoDataFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function LeadInteracaoDataField({ date, onDateChange }: LeadInteracaoDataFieldProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          {date
            ? format(date, "dd/MM/yyyy")
            : <span>Selecione uma data</span>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => {
            if (d) {
              onDateChange(d);
              setOpen(false);
            }
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
