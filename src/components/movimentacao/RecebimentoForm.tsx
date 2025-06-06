
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
  numeroDocumento?: string;
  onNumeroDocumentoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tipoTituloId?: string;
  onTipoTituloChange?: (value: string) => void;
  favorecido?: string;
  onFavorecidoChange?: (value: string) => void;
  categoria?: string;
  onCategoriaChange?: (value: string) => void;
  formaPagamento?: string;
  onFormaPagamentoChange?: (value: string) => void;
  descricao?: string;
  onDescricaoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  valor?: string;
  onValorChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  numParcelas?: number;
  onNumParcelasChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dataPrimeiroVenc?: Date;
  onDataPrimeiroVencChange?: (date: Date) => void;
  considerarDRE?: boolean;
  onConsiderarDREChange?: (checked: boolean) => void;
  tiposTitulos?: { id: string; nome: string }[];
  favorecidos?: { id: string; nome: string }[];
  categorias?: { id: string; nome: string }[];
  formasPagamento?: { id: string; nome: string }[];
  onNovoFavorecido?: () => void;
  onNovaCategoria?: () => void;
  parcelas?: any[];
  onParcelaValorChange?: (index: number, valor: number) => void;
  onParcelaDataChange?: (index: number, data: Date) => void;
  readOnly?: boolean;
  data?: any;
  onSubmit?: (values: any) => Promise<void>;
  contasCorrente?: { id: string; nome: string }[];
  planoContas?: { id: string; codigo: string; descricao: string }[];
}

export function RecebimentoForm({
  numeroDocumento = "",
  onNumeroDocumentoChange,
  tipoTituloId = "",
  onTipoTituloChange,
  favorecido = "",
  onFavorecidoChange,
  categoria = "",
  onCategoriaChange,
  formaPagamento = "",
  onFormaPagamentoChange,
  descricao = "",
  onDescricaoChange,
  valor = "",
  onValorChange,
  numParcelas = 1,
  onNumParcelasChange,
  dataPrimeiroVenc,
  onDataPrimeiroVencChange,
  considerarDRE = true,
  onConsiderarDREChange,
  tiposTitulos = [],
  favorecidos = [],
  categorias = [],
  formasPagamento = [],
  onNovoFavorecido,
  onNovaCategoria,
  parcelas = [],
  onParcelaValorChange,
  onParcelaDataChange,
  readOnly = false,
  data,
  onSubmit,
  contasCorrente = [],
  planoContas = [],
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

  const [parcelasLocal, setParcelasLocal] = useState<any[]>([]);

  useEffect(() => {
    const numParcelasValue = form.watch("numero_parcelas");
    const valorTotal = form.watch("valor");
    const primeiroVencimento = form.watch("primeiro_vencimento");

    if (numParcelasValue && valorTotal && primeiroVencimento) {
      const valorParcela = valorTotal / numParcelasValue;
      const parcelasCalculadas = Array.from({ length: numParcelasValue }, (_, i) => {
        const dataVencimento = new Date(primeiroVencimento);
        dataVencimento.setMonth(dataVencimento.getMonth() + i);
        return {
          numero: i + 1,
          valor: valorParcela,
          data_vencimento: dataVencimento,
        };
      });
      setParcelasLocal(parcelasCalculadas);
    }
  }, [form.watch("numero_parcelas"), form.watch("valor"), form.watch("primeiro_vencimento")]);

  // Se onSubmit não foi fornecido, renderizar apenas os campos de entrada
  if (!onSubmit) {
    return (
      <div className="space-y-6">
        {/* Campos de entrada simplificados para compatibilidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Número do Documento</label>
            <Input
              value={numeroDocumento}
              onChange={onNumeroDocumentoChange}
              className="bg-white"
              disabled={readOnly}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tipo de Título</label>
            <Select
              value={tipoTituloId}
              onValueChange={onTipoTituloChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o tipo de título" />
              </SelectTrigger>
              <SelectContent>
                {tiposTitulos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Favorecido</label>
            <Select
              value={favorecido}
              onValueChange={onFavorecidoChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o favorecido" />
              </SelectTrigger>
              <SelectContent>
                {favorecidos.map((favorecido) => (
                  <SelectItem key={favorecido.id} value={favorecido.id}>
                    {favorecido.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={categoria}
              onValueChange={onCategoriaChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Forma de Pagamento</label>
            <Select
              value={formaPagamento}
              onValueChange={onFormaPagamentoChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione a forma" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.id} value={forma.id}>
                    {forma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Valor</label>
            <Input
              value={valor}
              onChange={onValorChange}
              className="bg-white"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Número de Parcelas</label>
            <Input
              type="number"
              value={numParcelas}
              onChange={onNumParcelasChange}
              className="bg-white"
              disabled={readOnly}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Primeiro Vencimento</label>
            <DateInput
              value={dataPrimeiroVenc}
              onChange={onDataPrimeiroVencChange}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descrição</label>
          <Input
            value={descricao}
            onChange={onDescricaoChange}
            className="bg-white"
            disabled={readOnly}
          />
        </div>

        {/* Exibir parcelas se numParcelas > 1 */}
        {numParcelas > 1 && parcelas.length > 0 && (
          <ParcelasForm 
            parcelas={parcelas}
            onValorChange={onParcelaValorChange}
            onDataChange={onParcelaDataChange}
          />
        )}
      </div>
    );
  }

  // Renderização completa com Form (quando onSubmit está presente)
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
                    {tiposTitulos.map((tipo) => (
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
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
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
            parcelas={parcelasLocal}
            onValorChange={(valor) => form.setValue("valor", valor)}
            onDataChange={(data) => form.setValue("primeiro_vencimento", new Date(data))}
          />
        )}

        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
