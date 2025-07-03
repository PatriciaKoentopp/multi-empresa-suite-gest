
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export interface DatePickerProps {
  mode?: "single" | "multiple" | "range";
  locale?: any;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  initialFocus?: boolean;
}

export function DatePicker({ 
  mode = "single", 
  locale, 
  selected, 
  onSelect, 
  disabled = false,
  initialFocus = false 
}: DatePickerProps) {
  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      initialFocus={initialFocus}
    />
  );
}
