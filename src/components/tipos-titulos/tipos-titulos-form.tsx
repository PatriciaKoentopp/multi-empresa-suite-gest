
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TipoTitulo } from "@/types/tipos-titulos";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanoConta } from "@/types/plano-contas";

const formSchema = z.object({
  nome: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres.",
  }),
  tipo: z.enum(["pagar", "receber"], {
    required_error: "Você deve selecionar um tipo.",
  }),
  conta_contabil_id: z.string({
    required_error: "Você deve selecionar uma conta contábil.",
  }),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Você deve selecionar um status.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface TiposTitulosFormProps {
  tipoTitulo?: TipoTitulo;
  contasContabeis: PlanoConta[];
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function TiposTitulosForm({
  tipoTitulo,
  contasContabeis,
  onSubmit,
  onCancel,
}: TiposTitulosFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: tipoTitulo?.nome || "",
      tipo: tipoTitulo?.tipo || "receber",
      conta_contabil_id: tipoTitulo?.conta_contabil_id || "",
      status: tipoTitulo?.status || "ativo",
    },
  });

  // Filtrar apenas contas de ativo e passivo da categoria movimentação e com status ativo
  const contasFiltradas = contasContabeis.filter(conta => 
    (conta.tipo === "ativo" || conta.tipo === "passivo") &&
    conta.categoria === "movimentação" &&
    conta.status === "ativo"
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
                <Input placeholder="Nome do tipo de título" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receber" id="receber" className="text-green-500 border-green-500 focus:ring-green-500" />
                    <FormLabel htmlFor="receber" className="cursor-pointer text-green-600">
                      Receber
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pagar" id="pagar" className="text-red-500 border-red-500 focus:ring-red-500" />
                    <FormLabel htmlFor="pagar" className="cursor-pointer text-red-600">
                      Pagar
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conta_contabil_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta Contábil</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta contábil" />
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
