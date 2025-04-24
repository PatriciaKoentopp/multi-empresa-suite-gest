
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateInputProps {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}

function parseDateBr(input: string): Date | null {
  const [dia, mes, ano] = input.split("/");
  if (!dia || !mes || !ano) return null;
  const d = Number(dia),
    m = Number(mes) - 1,
    y = Number(ano);
  if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 0 || m > 11 || y < 1000) return null;
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
  return dt;
}

export function DateInput({ label, value, onChange }: DateInputProps) {
  const [inputValue, setInputValue] = React.useState(value ? format(value, "dd/MM/yyyy") : "");
  
  React.useEffect(() => {
    setInputValue(value ? format(value, "dd/MM/yyyy") : "");
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^\d/]/g, "")
      .replace(/^(\d{2})(\d)/, "$1/$2")
      .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
    setInputValue(val);
    const dt = parseDateBr(val);
    onChange(dt || undefined);
  }

  function handleCalendarSelect(dt?: Date) {
    if (dt) {
      setInputValue(format(dt, "dd/MM/yyyy"));
      onChange(dt);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={handleChange}
          placeholder="DD/MM/AAAA"
          className="w-[120px]"
          maxLength={10}
          inputMode="numeric"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" tabIndex={-1}>
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white shadow-lg border border-gray-200 z-50"
            align="start"
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto bg-white")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
