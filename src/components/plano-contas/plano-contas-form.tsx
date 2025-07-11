
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["ativo", "passivo", "receita", "despesa", "patrimonio"]),
  categoria: z.enum(["título", "movimentação"]),
  considerar_dre: z.boolean(),
  classificacao_dre: z.string().optional(),
  status: z.enum(["ativo", "inativo"]),
});

type FormData = z.infer<typeof formSchema>;

interface PlanoContasFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  initialData?: Partial<FormData>;
}

export function PlanoContasForm({ onSubmit, onCancel, initialData }: PlanoContasFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: initialData?.codigo || "",
      descricao: initialData?.descricao || "",
      tipo: initialData?.tipo || "ativo",
      categoria: initialData?.categoria || "movimentação",
      considerar_dre: initialData?.considerar_dre || false,
      classificacao_dre: initialData?.classificacao_dre || "nao_classificado",
      status: initialData?.status || "ativo",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="passivo">Passivo</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="patrimonio">Patrimônio</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  <SelectItem value="título">Título</SelectItem>
                  <SelectItem value="movimentação">Movimentação</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classificacao_dre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classificação no DRE</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || "nao_classificado"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  <SelectItem value="nao_classificado">Não classificado</SelectItem>
                  <SelectItem value="receita_bruta">Receita Bruta</SelectItem>
                  <SelectItem value="deducoes">Deduções</SelectItem>
                  <SelectItem value="custos">Custos</SelectItem>
                  <SelectItem value="despesas_operacionais">Despesas Operacionais</SelectItem>
                  <SelectItem value="receitas_financeiras">Receitas Financeiras</SelectItem>
                  <SelectItem value="despesas_financeiras">Despesas Financeiras</SelectItem>
                  <SelectItem value="distribuicao_lucros">Distribuição de Lucros</SelectItem>
                  <SelectItem value="impostos_irpj_csll">IRPJ/CSLL</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="considerar_dre"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Considerar no DRE</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="blue">
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
