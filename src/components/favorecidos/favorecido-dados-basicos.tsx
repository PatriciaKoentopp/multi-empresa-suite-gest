
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GrupoFavorecido, Profissao } from "@/types";
import { FormValues } from "./favorecidos-form.schema";

interface FavorecidoDadosBasicosProps {
  form: UseFormReturn<FormValues>;
  grupos: GrupoFavorecido[];
  profissoes: Profissao[];
  readOnly?: boolean;
}

export function FavorecidoDadosBasicos({ form, grupos, profissoes, readOnly }: FavorecidoDadosBasicosProps) {
  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4">Dados Básicos</h3>
      
      <FormField
        control={form.control}
        name="grupo_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grupo</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || "null"}
              disabled={readOnly}
            >
              <FormControl>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="null" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  Nenhum grupo selecionado
                </SelectItem>
                {grupos.map((grupo) => (
                  <SelectItem 
                    key={grupo.id} 
                    value={grupo.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
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
        name="profissao_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profissão</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || "null"}
              disabled={readOnly}
            >
              <FormControl>
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Selecione uma profissão" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="null" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  Nenhuma profissão selecionada
                </SelectItem>
                {profissoes.map((profissao) => (
                  <SelectItem 
                    key={profissao.id} 
                    value={profissao.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {profissao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome/Razão Social</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fantasia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Fantasia</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
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
                  <Input {...field} disabled={readOnly} className="bg-white dark:bg-gray-900" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
