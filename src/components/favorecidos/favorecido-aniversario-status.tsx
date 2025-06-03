
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";
import { DateInput } from "@/components/movimentacao/DateInput";

interface FavorecidoAniversarioStatusProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

export function FavorecidoAniversarioStatus({ form, readOnly }: FavorecidoAniversarioStatusProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
      <h3 className="font-medium text-base">Data de Aniversário e Status</h3>
      
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="data_aniversario"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Aniversário</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={readOnly}
                  placeholder="DD/MM/AAAA"
                />
              </FormControl>
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
