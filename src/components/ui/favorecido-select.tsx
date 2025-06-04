
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFavorecidos } from "@/hooks/useFavorecidos";

interface FavorecidoSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function FavorecidoSelect({
  value = "",
  onValueChange,
  placeholder = "Selecione uma empresa (opcional)",
  disabled = false,
  allowEmpty = true,
  emptyLabel = "Nenhuma empresa"
}: FavorecidoSelectProps) {
  const { favorecidos, isLoading } = useFavorecidos();

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "no_company") {
      onValueChange("");
    } else {
      onValueChange(selectedValue);
    }
  };

  return (
    <Select 
      value={value || "no_company"} 
      onValueChange={handleValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value="no_company">{emptyLabel}</SelectItem>
        )}
        {favorecidos.map((favorecido) => (
          <SelectItem key={favorecido.id} value={favorecido.id}>
            {favorecido.nome} - {favorecido.documento}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
