
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DateInputProps = {
  label?: string;
  value?: Date;
  onChange: (date?: Date) => void;
  disabled?: boolean;
};

export function DateInput({ label, value, onChange, disabled = false }: DateInputProps) {
  const [inputValue, setInputValue] = useState('');

  // Atualiza o valor do input quando o value de fora muda
  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    setInputValue(inputText);

    // Apenas tenta converter para data se tiver o formato completo DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputText)) {
      const parsedDate = parse(inputText, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      if (isValid(parsedDate)) {
        onChange(parsedDate);
      } else {
        onChange(undefined);
      }
    } else if (!inputText) {
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

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="DD/MM/AAAA"
        className="bg-white"
        disabled={disabled}
      />
    </div>
  );
}
