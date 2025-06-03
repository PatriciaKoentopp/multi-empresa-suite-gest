
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useCompany } from "@/contexts/company-context";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ATENÇÃO: ajustando o esquema para refletir os campos obrigatórios da tabela
const formSchema = z.object({
  razaoSocial: z.string().min(1, "Nome da empresa é obrigatório"),
  nomeFantasia: z.string().min(1, "Nome fantasia é obrigatório"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  cnae: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  site: z.string().url("URL inválida").optional().or(z.literal("")),
  telefone: z.string().optional(),
  cep: z.string().min(1, "CEP é obrigatório"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(1, "Estado é obrigatório"),
  pais: z.string().min(1, "País é obrigatório").default("Brasil"),
  regimeTributacao: z.enum(["simples", "lucro_presumido", "lucro_real", "mei"]).optional(),
  logo: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

// O formulário agora trabalha com o formato "achatado" igual ao banco/existing page
export function CompanyModal({ isOpen, onClose, company }: CompanyModalProps) {
  const { toast } = useToast();
  const { createCompany, updateCompany } = useCompany();

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
      logo: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        razaoSocial: company.razaoSocial || company.razao_social || "",
        nomeFantasia: company.nomeFantasia || company.nome_fantasia || "",
        cnpj: company.cnpj || "",
        inscricaoEstadual: company.inscricaoEstadual || company.inscricao_estadual || "",
        inscricaoMunicipal: company.inscricaoMunicipal || company.inscricao_municipal || "",
        cnae: company.cnae || "",
        email: company.email || "",
        site: company.site || "",
        telefone: company.telefone || "",
        cep: company.endereco?.cep || company.cep || "",
        logradouro: company.endereco?.logradouro || company.logradouro || "",
        numero: company.endereco?.numero || company.numero || "",
        complemento: company.endereco?.complemento || company.complemento || "",
        bairro: company.endereco?.bairro || company.bairro || "",
        cidade: company.endereco?.cidade || company.cidade || "",
        estado: company.endereco?.estado || company.estado || "",
        pais: company.endereco?.pais || company.pais || "Brasil",
        regimeTributacao: (company.regimeTributacao || company.regime_tributacao) as any,
        logo: company.logo || "",
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
        logo: "",
      });
    }
  }, [company, form]);

  const onSubmit = (values: FormValues) => {
    // Prepara objeto Company com endereço corretamente montado
    const companyObj: Partial<Company> = {
      id: company?.id,
      razao_social: values.razaoSocial,
      nome_fantasia: values.nomeFantasia,
      cnpj: values.cnpj,
      inscricao_estadual: values.inscricaoEstadual,
      inscricao_municipal: values.inscricaoMunicipal,
      cnae: values.cnae,
      email: values.email,
      site: values.site,
      telefone: values.telefone,
      cep: values.cep,
      logradouro: values.logradouro,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      estado: values.estado,
      pais: values.pais,
      regime_tributacao: values.regimeTributacao,
      logo: values.logo,
      
      // Aliases para compatibilidade
      razaoSocial: values.razaoSocial,
      nomeFantasia: values.nomeFantasia,
      inscricaoEstadual: values.inscricaoEstadual,
      inscricaoMunicipal: values.inscricaoMunicipal,
      regimeTributacao: values.regimeTributacao,
      
      // Objeto endereco para compatibilidade
      endereco: {
        cep: values.cep,
        logradouro: values.logradouro,
        numero: values.numero,
        complemento: values.complemento,
        bairro: values.bairro,
        cidade: values.cidade,
        estado: values.estado,
        pais: values.pais,
      }
    };

    if (company) {
      updateCompany(company.id, companyObj);
      toast({
        title: "Empresa atualizada",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } else {
      createCompany(companyObj);
      toast({
        title: "Empresa cadastrada",
        description: "A empresa foi cadastrada com sucesso.",
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? "Editar empresa" : "Nova empresa"}
          </DialogTitle>
          <DialogDescription>
            {company
              ? "Atualize os dados da empresa"
              : "Preencha as informações para cadastrar uma nova empresa"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados básicos */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Dados básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="razaoSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social*</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Nome Fantasia*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inscricaoEstadual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="inscricaoMunicipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Municipal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cnae"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNAE</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="regimeTributacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regime Tributário</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simples">Simples Nacional</SelectItem>
                            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                            <SelectItem value="lucro_real">Lucro Real</SelectItem>
                            <SelectItem value="mei">MEI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Logo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="site"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-lg font-medium">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="logradouro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {company ? "Salvar alterações" : "Cadastrar empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

