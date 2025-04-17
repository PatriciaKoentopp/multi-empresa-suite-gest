
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrupoFavorecido } from "@/types";
import { FormValues } from "./favorecidos-form.schema";

interface FavorecidoDadosBasicosProps {
  form: UseFormReturn<FormValues>;
  grupos: GrupoFavorecido[];
  readOnly?: boolean;
}

export function FavorecidoDadosBasicos({ form, grupos, readOnly }: FavorecidoDadosBasicosProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="grupoId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grupo</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={readOnly}
            >
              <FormControl>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {grupos.map((grupo) => (
                  <SelectItem 
                    key={grupo.id} 
                    value={grupo.id}
                    className="hover:bg-gray-100 focus:bg-gray-100"
                  >
                    {grupo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome/Razão Social</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nomeFantasia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome Fantasia</FormLabel>
            <FormControl>
              <Input {...field} disabled={readOnly} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
