
import React from "react";
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === "no_company") {
      onValueChange("");
    } else {
      onValueChange(selectedValue);
    }
  };

  return (
    <select
      value={value || "no_company"}
      onChange={handleChange}
      disabled={disabled || isLoading}
      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white"
    >
      <option value="" disabled>
        {isLoading ? "Carregando..." : placeholder}
      </option>
      {allowEmpty && (
        <option value="no_company">{emptyLabel}</option>
      )}
      {favorecidos.map((favorecido) => (
        <option key={favorecido.id} value={favorecido.id}>
          {favorecido.nome} - {favorecido.documento}
        </option>
      ))}
    </select>
  );
}
