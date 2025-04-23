
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDate, parseDateString } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";
import * as React from 'react';

interface FavorecidoAniversarioStatusProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

export function FavorecidoAniversarioStatus({ form, readOnly }: FavorecidoAniversarioStatusProps) {
  const [dateInputValue, setDateInputValue] = React.useState("");

  // Função para validar e converter a entrada de texto para objeto Date
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInputValue(value);
    
    if (value.length === 10) {
      const parsedDate = parseDateString(value);
      if (parsedDate) {
        form.setValue("dataAniversario", parsedDate);
      }
    }
  };
  
  // Inicializa o campo de input quando o componente é montado ou quando a data muda
  React.useEffect(() => {
    const date = form.watch("dataAniversario");
    if (date) {
      setDateInputValue(formatDate(date));
    } else {
      setDateInputValue("");
    }
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
              <div className="flex">
                <Input
                  disabled={readOnly}
                  placeholder="DD/MM/AAAA"
                  className="w-full"
                  value={dateInputValue}
                  onChange={handleDateInput}
                  maxLength={10}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="ml-2"
                      disabled={readOnly}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) {
                          // Preservamos o dia exato selecionado usando UTC
                          const utcDate = new Date(Date.UTC(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            12, 0, 0
                          ));
                          
                          field.onChange(utcDate);
                          setDateInputValue(formatDate(utcDate));
                        } else {
                          field.onChange(undefined);
                          setDateInputValue("");
                        }
                      }}
                      disabled={readOnly}
                      initialFocus
                      className="p-3 pointer-events-auto bg-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
