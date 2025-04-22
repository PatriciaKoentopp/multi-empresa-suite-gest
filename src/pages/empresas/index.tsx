import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/company-context";
import { useAuth } from "@/contexts/auth-context";
import { Building2, PenLine, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Company } from "@/types";
import { useToast } from "@/hooks/use-toast";
const formSchema = z.object({
  razaoSocial: z.string().min(3, {
    message: "Razão Social é obrigatória"
  }),
  nomeFantasia: z.string().min(3, {
    message: "Nome Fantasia é obrigatório"
  }),
  cnpj: z.string().min(14, {
    message: "CNPJ inválido"
  }).max(18),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  cnae: z.string().optional(),
  email: z.string().email({
    message: "Email inválido"
  }).optional().or(z.literal("")),
  site: z.string().url({
    message: "URL inválida"
  }).optional().or(z.literal("")),
  telefone: z.string().optional(),
  cep: z.string().min(8, {
    message: "CEP é obrigatório"
  }),
  logradouro: z.string().min(3, {
    message: "Logradouro é obrigatório"
  }),
  numero: z.string().min(1, {
    message: "Número é obrigatório"
  }),
  complemento: z.string().optional(),
  bairro: z.string().min(2, {
    message: "Bairro é obrigatório"
  }),
  cidade: z.string().min(2, {
    message: "Cidade é obrigatória"
  }),
  estado: z.string().min(2, {
    message: "Estado é obrigatório"
  }),
  pais: z.string().optional(),
  regimeTributacao: z.enum(["simples", "lucro_presumido", "lucro_real", "mei"]).optional(),
  logo: z.string().url({
    message: "URL da logo inválida"
  }).optional().or(z.literal(""))
});
type FormValues = z.infer<typeof formSchema>;
export default function EmpresasPage() {
  const {
    currentCompany,
    updateCompany,
    addCompany,
    isLoading
  } = useCompany();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  // Agora, se não existe empresa, mostrar o formulário em modo "criar"
  const criandoEmpresa = !currentCompany;
  const [isEditing, setIsEditing] = useState(criandoEmpresa ? true : false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      cnae: "",
      email: "",
      site: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
      regimeTributacao: undefined,
      logo: ""
    }
  });

  // Carregar os dados da empresa atual quando disponíveis
  useEffect(() => {
    if (currentCompany) {
      form.reset({
        razaoSocial: currentCompany.razaoSocial || "",
        nomeFantasia: currentCompany.nomeFantasia || "",
        cnpj: currentCompany.cnpj || "",
        inscricaoEstadual: currentCompany.inscricaoEstadual || "",
        inscricaoMunicipal: currentCompany.inscricaoMunicipal || "",
        cnae: currentCompany.cnae || "",
        email: currentCompany.email || "",
        site: currentCompany.site || "",
        telefone: currentCompany.telefone || "",
        cep: currentCompany.endereco?.cep || "",
        logradouro: currentCompany.endereco?.logradouro || "",
        numero: currentCompany.endereco?.numero || "",
        complemento: currentCompany.endereco?.complemento || "",
        bairro: currentCompany.endereco?.bairro || "",
        cidade: currentCompany.endereco?.cidade || "",
        estado: currentCompany.endereco?.estado || "",
        pais: currentCompany.endereco?.pais || "Brasil",
        regimeTributacao: currentCompany.regimeTributacao,
        logo: currentCompany.logo || ""
      });
    } else {
      form.reset({
        razaoSocial: "",
        nomeFantasia: "",
        cnpj: "",
        inscricaoEstadual: "",
        inscricaoMunicipal: "",
        cnae: "",
        email: "",
        site: "",
        telefone: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        pais: "Brasil",
        regimeTributacao: undefined,
        logo: ""
      });
      setIsEditing(true);
    }
  }, [currentCompany, form]);

  const onSubmit = (values: FormValues) => {
    if (!user) return;
    const empresaObject = {
      id: currentCompany?.id || crypto.randomUUID(),
      razaoSocial: values.razaoSocial,
      nomeFantasia: values.nomeFantasia,
      cnpj: values.cnpj,
      inscricaoEstadual: values.inscricaoEstadual,
      inscricaoMunicipal: values.inscricaoMunicipal,
      cnae: values.cnae,
      email: values.email,
      site: values.site,
      telefone: values.telefone,
      endereco: {
        cep: values.cep,
        logradouro: values.logradouro,
        numero: values.numero,
        complemento: values.complemento,
        bairro: values.bairro,
        cidade: values.cidade,
        estado: values.estado,
        pais: values.pais
      },
      regimeTributacao: values.regimeTributacao,
      logo: values.logo,
      createdAt: currentCompany?.createdAt || new Date(),
      updatedAt: new Date()
    };
    if (criandoEmpresa || !currentCompany) {
      addCompany(empresaObject as Company);
      toast({
        title: "Empresa cadastrada",
        description: "A empresa foi cadastrada com sucesso."
      });
    } else {
      updateCompany(currentCompany.id, empresaObject);
      toast({
        title: "Empresa atualizada",
        description: "Os dados da empresa foram atualizados com sucesso."
      });
      setIsEditing(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing((editando) => !editando);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-r-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }

  // Caso não exista empresa ainda, mostre o formulário já para cadastro inicial
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {criandoEmpresa ? (
            <h1 className="text-2xl font-bold tracking-tight">Cadastrar Empresa</h1>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">Empresa</h1>
          )}
        </div>
        {!criandoEmpresa && (
          <Button onClick={handleEditToggle} variant={isEditing ? "outline" : "blue"}>
            {isEditing ? <>Cancelar</> : <>
                <PenLine className="mr-2 h-4 w-4" />
                Editar
              </>}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3"></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="razaoSocial" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="nomeFantasia" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Nome Fantasia</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="cnpj" render={({
                  field
                }) => <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="inscricaoEstadual" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="inscricaoMunicipal" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Inscrição Municipal</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="cnae" render={({
                  field
                }) => <FormItem>
                        <FormLabel>CNAE</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="telefone" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <FormField control={form.control} name="site" render={({
                field
              }) => <FormItem>
                      <FormLabel>Site</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="logo" render={({
                field
              }) => <FormItem>
                      <FormLabel>URL da Logo</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="regimeTributacao" render={({
                field
              }) => <FormItem>
                      <FormLabel>Regime de Tributação</FormLabel>
                      {isEditing ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-900">
                              <SelectValue placeholder="Selecione um regime" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <SelectItem value="simples">Simples Nacional</SelectItem>
                            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="lucro_real">Lucro Real</SelectItem>
                            <SelectItem value="mei">MEI</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-muted-foreground text-sm">
                          {field.value === "simples" && "Simples Nacional"}
                          {field.value === "lucro_presumido" && "Lucro Presumido"}
                          {field.value === "lucro_real" && "Lucro Real"}
                          {field.value === "mei" && "MEI"}
                          {!field.value && <span className="text-muted-foreground">Não informado</span>}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>} />

                <div className="space-y-2">
                  <h3 className="font-medium text-base">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="cep" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="logradouro" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="numero" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="complemento" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="bairro" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="cidade" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="estado" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="pais" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button type="submit" variant="blue">
                  <Save className="mr-2 h-4 w-4" />
                  {criandoEmpresa ? "Cadastrar Empresa" : "Salvar Alterações"}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
