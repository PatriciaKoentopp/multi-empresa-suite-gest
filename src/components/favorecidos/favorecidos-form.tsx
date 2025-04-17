import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Favorecido, GrupoFavorecido } from "@/types";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User, Building2, Landmark } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useEffect } from "react";

// Definição do schema do formulário
const formSchema = z.object({
  tipo: z.enum(["cliente", "fornecedor", "publico"], {
    required_error: "Tipo de favorecido é obrigatório",
  }),
  tipoDocumento: z.enum(["cpf", "cnpj"], {
    required_error: "Tipo de documento é obrigatório",
  }),
  documento: z.string().min(1, { message: "Documento é obrigatório" }),
  grupoId: z.string().optional(),
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  nomeFantasia: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
  dataAniversario: z.date().optional(),
  status: z.enum(["ativo", "inativo"], {
    required_error: "Status é obrigatório",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface FavorecidosFormProps {
  favorecido?: Favorecido;
  grupos: GrupoFavorecido[];
  onSubmit: (data: Partial<Favorecido>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function FavorecidosForm({
  favorecido,
  grupos,
  onSubmit,
  onCancel,
  readOnly = false,
}: FavorecidosFormProps) {
  // Inicializar o formulário com valores padrão ou do favorecido existente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: favorecido ? {
      tipo: favorecido.tipo as "cliente" | "fornecedor" | "publico",
      tipoDocumento: favorecido.tipoDocumento,
      documento: favorecido.documento,
      grupoId: favorecido.grupoId,
      nome: favorecido.nome,
      nomeFantasia: favorecido.nomeFantasia || "",
      email: favorecido.email || "",
      telefone: favorecido.telefone || "",
      cep: favorecido.endereco?.cep || "",
      logradouro: favorecido.endereco?.logradouro || "",
      numero: favorecido.endereco?.numero || "",
      complemento: favorecido.endereco?.complemento || "",
      bairro: favorecido.endereco?.bairro || "",
      cidade: favorecido.endereco?.cidade || "",
      estado: favorecido.endereco?.estado || "",
      pais: favorecido.endereco?.pais || "",
      dataAniversario: favorecido.dataAniversario,
      status: favorecido.status || "ativo",
    } : {
      tipo: "cliente",
      tipoDocumento: "cpf",
      documento: "",
      nome: "",
      nomeFantasia: "",
      email: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
      status: "ativo",
    },
  });

  // Atualizar o tipo de documento com base no tipo de favorecido selecionado
  useEffect(() => {
    const tipoFavorecido = form.watch("tipo");
    const tipoDocumentoAtual = form.watch("tipoDocumento");
    
    // Se tipo for "cliente" (pessoa física), o documento deve ser CPF
    if (tipoFavorecido === "cliente" && tipoDocumentoAtual !== "cpf") {
      form.setValue("tipoDocumento", "cpf");
    }
    // Para os demais tipos (jurídica ou órgão público), o documento deve ser CNPJ
    else if ((tipoFavorecido === "fornecedor" || tipoFavorecido === "publico") && tipoDocumentoAtual !== "cnpj") {
      form.setValue("tipoDocumento", "cnpj");
    }
  }, [form.watch("tipo")]);

  // Manipular envio do formulário
  const handleSubmit = (data: FormValues) => {
    // Preparar os dados no formato esperado
    const formattedData: Partial<Favorecido> = {
      ...data,
      endereco: {
        cep: data.cep || "",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        complemento: data.complemento,
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",
        pais: data.pais || "",
      }
    };

    // Remover as propriedades do endereço do objeto principal
    delete (formattedData as any).cep;
    delete (formattedData as any).logradouro;
    delete (formattedData as any).numero;
    delete (formattedData as any).complemento;
    delete (formattedData as any).bairro;
    delete (formattedData as any).cidade;
    delete (formattedData as any).estado;
    delete (formattedData as any).pais;
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seção da esquerda */}
          <div className="space-y-4">
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
                        <RadioGroupItem value="cliente" id="cliente" />
                        <FormLabel htmlFor="cliente" className="flex items-center cursor-pointer">
                          <User className="mr-1 h-4 w-4" />
                          Física
                        </FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fornecedor" id="fornecedor" />
                        <FormLabel htmlFor="fornecedor" className="flex items-center cursor-pointer">
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
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <SelectItem 
                          value="cpf" 
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          CPF
                        </SelectItem>
                        <SelectItem 
                          value="cnpj"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          CNPJ
                        </SelectItem>
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

          {/* Seção da direita */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-base">Endereço</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="dataAniversario"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Aniversário</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white border-gray-300 text-gray-900 hover:bg-gray-50",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={readOnly}
                          >
                            {field.value ? (
                              format(field.value, "P", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={readOnly}
                          initialFocus
                          className={cn("p-3 pointer-events-auto bg-white")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                        disabled={readOnly}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ativo" id="ativo" className="text-blue-500 border-blue-500 focus:ring-blue-500" />
                          <FormLabel htmlFor="ativo" className="cursor-pointer text-blue-600">
                            Ativo
                          </FormLabel>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inativo" id="inativo" className="text-red-500 border-red-500 focus:ring-red-500" />
                          <FormLabel htmlFor="inativo" className="cursor-pointer text-red-600">
                            Inativo
                          </FormLabel>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue">
              Salvar
            </Button>
          </div>
        )}
        
        {readOnly && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
