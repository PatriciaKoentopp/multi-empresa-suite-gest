import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ImpostoRetido } from "@/types/impostos-retidos";
import { TipoTitulo } from "@/types/tipos-titulos";
import { PlanoConta } from "@/types/plano-contas";
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

const formSchema = z.object({
  nome: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  tipo_titulo_id: z.string({
    required_error: "Você deve selecionar um tipo de título.",
  }),
  conta_despesa_id: z.string().optional(),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Você deve selecionar um status.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ImpostosRetidosFormProps {
  impostoRetido?: ImpostoRetido;
  tiposTitulos: TipoTitulo[];
  contasContabeis: PlanoConta[];
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function ImpostosRetidosForm({
  impostoRetido,
  tiposTitulos,
  contasContabeis,
  onSubmit,
  onCancel,
}: ImpostosRetidosFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: impostoRetido?.nome || "",
      tipo_titulo_id: impostoRetido?.tipo_titulo_id || "",
      conta_despesa_id: impostoRetido?.conta_despesa_id || "",
      status: (impostoRetido?.status as "ativo" | "inativo") || "ativo",
    },
  });

  // Filtrar tipos de títulos ativos do tipo "pagar"
  const tiposFiltrados = tiposTitulos.filter(
    (tipo) => tipo.tipo === "pagar" && tipo.status === "ativo"
  );

  // Filtrar contas contábeis de movimentação ativas
  const contasFiltradas = contasContabeis.filter(
    (conta) => conta.categoria === "movimentação" && conta.status === "ativo"
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do imposto retido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_titulo_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Título</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de título" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposFiltrados.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
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
          name="conta_despesa_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta de Despesa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta de despesa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contasFiltradas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.codigo} - {conta.descricao}
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
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
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
