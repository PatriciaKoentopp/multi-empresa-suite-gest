
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";

interface FavorecidoDocumentoProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

export function FavorecidoDocumento({ form, readOnly }: FavorecidoDocumentoProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="tipoDocumento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Documento</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={readOnly}
            >
              <FormControl>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="documento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Documento</FormLabel>
            <FormControl>
              <Input placeholder="000.000.000-00" {...field} disabled={readOnly} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
