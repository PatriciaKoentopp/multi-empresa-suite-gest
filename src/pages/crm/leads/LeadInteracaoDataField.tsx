
import { DateInput } from "@/components/movimentacao/DateInput";

interface LeadInteracaoDataFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function LeadInteracaoDataField({
  date,
  onDateChange,
}: LeadInteracaoDataFieldProps) {
  return (
    <DateInput 
      value={date} 
      onChange={(date) => date && onDateChange(date)}
    />
  );
}
