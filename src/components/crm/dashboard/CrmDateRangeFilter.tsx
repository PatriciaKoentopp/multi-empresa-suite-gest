
import React from "react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/movimentacao/DateInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CrmDateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
}

export function CrmDateRangeFilter({ startDate, endDate, onDateChange }: CrmDateRangeFilterProps) {
  const handlePresetChange = (value: string) => {
    const today = new Date();
    
    switch (value) {
      case "today":
        onDateChange(today, today);
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        onDateChange(yesterday, yesterday);
        break;
      case "last7days":
        onDateChange(subDays(today, 7), today);
        break;
      case "last30days":
        onDateChange(subDays(today, 30), today);
        break;
      case "thisMonth":
        onDateChange(startOfMonth(today), endOfMonth(today));
        break;
      case "thisYear":
        onDateChange(startOfYear(today), today);
        break;
      default:
        break;
    }
  };

  const handleStartDateChange = (date?: Date | null) => {
    if (date) {
      onDateChange(date, endDate);
    }
  };

  const handleEndDateChange = (date?: Date | null) => {
    if (date) {
      onDateChange(startDate, date);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="last7days">Últimos 7 dias</SelectItem>
          <SelectItem value="last30days">Últimos 30 dias</SelectItem>
          <SelectItem value="thisMonth">Este mês</SelectItem>
          <SelectItem value="thisYear">Este ano</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <DateInput 
          value={startDate} 
          onChange={handleStartDateChange} 
          placeholder="Data inicial"
        />
        
        <DateInput 
          value={endDate} 
          onChange={handleEndDateChange} 
          placeholder="Data final"
        />
      </div>
    </div>
  );
}
