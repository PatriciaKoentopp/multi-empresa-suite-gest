
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";
import * as React from 'react';

interface FavorecidoAniversarioStatusProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

// Utilitário para converter DD/MM/YYYY string para Date ou null
function parseDateBr(input: string): Date | null {
  const [dia, mes, ano] = input.split("/");
  if (!dia || !mes || !ano) return null;
  const numDia = Number(dia);
  const numMes = Number(mes) - 1;
  const numAno = Number(ano);
  if (
    isNaN(numDia) || isNaN(numMes) || isNaN(numAno) ||
    numDia < 1 || numDia > 31 || numMes < 0 || numMes > 11 || numAno < 1000
  ) return null;
  const dt = new Date(numAno, numMes, numDia);
  // Verifica se realmente bate o dia, mês e ano (para casos como 32/01/2020)
  if (
    dt.getFullYear() !== numAno ||
    dt.getMonth() !== numMes ||
    dt.getDate() !== numDia
  ) return null;
  return dt;
}

export function FavorecidoAniversarioStatus({ form, readOnly }: FavorecidoAniversarioStatusProps) {
  // Estado local para valor exibido na input (como string DD/MM/YYYY)
  const [inputValue, setInputValue] = React.useState(() =>
    form.getValues("dataAniversario")
      ? format(form.getValues("dataAniversario") as Date, "dd/MM/yyyy")
      : ""
  );

  // Mantém input em sincronia caso o valor do formulário mude externamente (ex: edição)
  React.useEffect(() => {
    const data = form.getValues("dataAniversario");
    setInputValue(data ? format(data as Date, "dd/MM/yyyy") : "");
  }, [form.watch("dataAniversario")]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="font-medium text-base">Data de Aniversário e Status</h3>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="dataAniversario"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Aniversário</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        className="w-full"
                        value={inputValue}
                        onChange={(e) => {
                          // Permite apenas números e /
                          const val = e.target.value.replace(/[^\d/]/g, "")
                            .replace(/^(\d{2})(\d)/, "$1/$2")
                            .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2")
                            .slice(0, 10);

                          setInputValue(val);

                          const dt = parseDateBr(val);
                          if (dt) {
                            field.onChange(dt);
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                        disabled={readOnly}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="\d{2}/\d{2}/\d{4}"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="flex items-center px-2 text-gray-500"
                        onClick={(e) => {
                          if (readOnly) return;
                          // Para abrir o popover quando clicar no ícone
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        disabled={readOnly}
                        aria-label="Abrir calendário"
                        style={{ pointerEvents: "none" }}
                      >
                        <CalendarIcon className="h-5 w-5 opacity-70" />
                      </button>
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(dt) => {
                      if (!dt) return;
                      setInputValue(format(dt, "dd/MM/yyyy"));
                      field.onChange(dt);
                    }}
                    disabled={readOnly}
                    initialFocus
                    className={cn("p-3 pointer-events-auto bg-white")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                  disabled={readOnly}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ativo" id="ativo" className="text-blue-500 border-blue-500 focus:ring-blue-500" />
                    <FormLabel htmlFor="ativo" className="cursor-pointer text-blue-600">
                      Ativo
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inativo" id="inativo" className="text-red-500 border-red-500 focus:ring-red-500" />
                    <FormLabel htmlFor="inativo" className="cursor-pointer text-red-600">
                      Inativo
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
