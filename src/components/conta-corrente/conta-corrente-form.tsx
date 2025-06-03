
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
import { ContaCorrente } from "@/types/conta-corrente";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/movimentacao/DateInput";
import { parseDateString } from "@/lib/utils";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  banco: z.string().min(3, "Banco é obrigatório"),
  agencia: z.string().min(1, "Agência é obrigatória"),
  numero: z.string().min(1, "Número é obrigatório"),
  contaContabilId: z.string().min(1, "Conta Contábil é obrigatória"),
  status: z.enum(["ativo", "inativo"]),
  data: z.date({ required_error: "Data é obrigatória" }),
  saldoInicial: z.coerce.number(),
  considerar_saldo: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ContaCorrenteFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  contasContabeis: Array<{ id: string; codigo: string; descricao: string }>;
  initialData?: Partial<ContaCorrente>;
}

export function ContaCorrenteForm({ 
  onSubmit, 
  onCancel, 
  contasContabeis,
  initialData 
}: ContaCorrenteFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      banco: initialData?.banco || "",
      agencia: initialData?.agencia || "",
      numero: initialData?.numero || "",
      contaContabilId: initialData?.contaContabilId || "",
      status: initialData?.status || "ativo",
      // Usar parseDateString para evitar problemas de timezone, seguindo o padrão do favorecidos
      data: initialData?.data ? parseDateString(initialData.data) : new Date(),
      saldoInicial: initialData?.saldoInicial ?? 0,
      considerar_saldo: initialData?.considerar_saldo !== undefined ? initialData.considerar_saldo : true,
    },
  });

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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="agencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contaContabilId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Contábil</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta contábil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background">
                  {contasContabeis.map((conta) => (
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
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="DD/MM/AAAA"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="saldoInicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="considerar_saldo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Considerar no Saldo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Incluir esta conta nos cards de saldo do painel financeiro
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
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
