
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building2, Landmark, Users } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./favorecidos-form.schema";

interface FavorecidoTipoRadioProps {
  form: UseFormReturn<FormValues>;
  readOnly?: boolean;
}

export function FavorecidoTipoRadio({ form, readOnly }: FavorecidoTipoRadioProps) {
  return (
    <FormField
      control={form.control}
      name="tipo"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Tipo de Favorecido</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-wrap gap-4"
              disabled={readOnly}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fisica" id="fisica" />
                <FormLabel htmlFor="fisica" className="flex items-center cursor-pointer">
                  <User className="mr-1 h-4 w-4" />
                  Física
                </FormLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="juridica" id="juridica" />
                <FormLabel htmlFor="juridica" className="flex items-center cursor-pointer">
                  <Building2 className="mr-1 h-4 w-4" />
                  Jurídica
                </FormLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="publico" id="publico" />
                <FormLabel htmlFor="publico" className="flex items-center cursor-pointer">
                  <Landmark className="mr-1 h-4 w-4" />
                  Órgão Público
                </FormLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="funcionario" id="funcionario" />
                <FormLabel htmlFor="funcionario" className="flex items-center cursor-pointer">
                  <Users className="mr-1 h-4 w-4" />
                  Funcionário
                </FormLabel>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
