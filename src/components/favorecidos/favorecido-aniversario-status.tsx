
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";

interface FavorecidoAniversarioStatusProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

export function FavorecidoAniversarioStatus({ form, readOnly }: FavorecidoAniversarioStatusProps) {
  return (
    <div className="space-y-4 pt-2">
      <FormField
        control={form.control}
        name="dataAniversario"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data de Aniversário</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Input
                    type="date"
                    className="w-full"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.valueAsDate;
                      if (date) {
                        field.onChange(date);
                      }
                    }}
                    disabled={readOnly}
                  />
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
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
                defaultValue={field.value}
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
  );
}
