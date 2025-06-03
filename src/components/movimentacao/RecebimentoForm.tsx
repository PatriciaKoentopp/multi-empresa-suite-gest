
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, UseFormReturn } from "react-hook-form";
import { RecebimentoFormSchema } from "./schemas";
import { DateInput } from "./DateInput";
import { useEffect, useState } from "react";
import { ParcelasForm } from "./ParcelasForm";

interface RecebimentoFormProps {
  data?: any;
  onSubmit: (values: any) => Promise<void>;
  tiposTitulo: { id: string; nome: string }[];
  favorecidos: { id: string; nome: string }[];
  contasCorrente: { id: string; nome: string }[];
  planoContas: { id: string; codigo: string; descricao: string }[];
}

export function RecebimentoForm({
  data,
  onSubmit,
  tiposTitulo,
  favorecidos,
  contasCorrente,
  planoContas,
}: RecebimentoFormProps) {
  const form: UseFormReturn<RecebimentoFormSchema> = useForm<RecebimentoFormSchema>({
    // resolver: zodResolver(RecebimentoFormSchema),
    defaultValues: {
      tipo_titulo_id: data?.tipo_titulo_id || "",
      favorecido_id: data?.favorecido_id || "",
      conta_corrente_id: data?.conta_corrente_id || "",
      plano_conta_id: data?.plano_conta_id || "",
      data_emissao: data?.data_emissao || new Date(),
      primeiro_vencimento: data?.primeiro_vencimento || new Date(),
      numero_parcelas: data?.numero_parcelas || 1,
      valor: data?.valor || 0,
      juros: data?.juros || 0,
      multa: data?.multa || 0,
      desconto: data?.desconto || 0,
      observacoes: data?.observacoes || "",
    },
  });

  const [parcelas, setParcelas] = useState<any[]>([]);

  useEffect(() => {
    const numParcelas = form.watch("numero_parcelas");
    const valorTotal = form.watch("valor");
    const primeiroVencimento = form.watch("primeiro_vencimento");

    if (numParcelas && valorTotal && primeiroVencimento) {
      const valorParcela = valorTotal / numParcelas;
      const parcelasCalculadas = Array.from({ length: numParcelas }, (_, i) => ({
        numero: i + 1,
        valor: valorParcela,
        data_vencimento: new Date(primeiroVencimento), //TODO: somar os dias
      }));
      setParcelas(parcelasCalculadas);
    }
  }, [form.watch("numero_parcelas"), form.watch("valor"), form.watch("primeiro_vencimento")]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo_titulo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Título</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de título" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposTitulo.map((tipo) => (
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
            name="favorecido_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Favorecido</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o favorecido" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {favorecidos.map((favorecido) => (
                      <SelectItem key={favorecido.id} value={favorecido.id}>
                        {favorecido.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="conta_corrente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta Corrente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta corrente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contasCorrente.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.nome}
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
            name="plano_conta_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de Contas</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano de contas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planoContas.map((conta) => (
                      <SelectItem key={conta.codigo} value={conta.codigo}>
                        {conta.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data_emissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Emissão</FormLabel>
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
            name="primeiro_vencimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primeiro Vencimento</FormLabel>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="numero_parcelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Parcelas</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="juros"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Juros</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="multa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multa</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desconto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.watch("numero_parcelas") > 1 && (
          <ParcelasForm 
            parcelas={parcelas}
            onValorChange={(valor) => form.setValue("valor", valor)}
            onDataChange={(data) => form.setValue("primeiro_vencimento", data)}
          />
        )}

        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
