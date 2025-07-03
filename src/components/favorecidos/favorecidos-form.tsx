import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DatePicker } from "@/components/ui/date-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  cpf_cnpj: z.string().optional(),
  tipo: z.string().optional(),
  grupo_favorecido_id: z.string().optional(),
  profissao_id: z.string().optional(),
  origem_id: z.string().optional(),
  data_aniversario: z.date().optional(),
  email: z.string().email({
    message: "Email inválido.",
  }).optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})

export function FavorecidosForm() {
  const [grupoFavorecidos, setGrupoFavorecidos] = useState<any[]>([]);
  const [profissoes, setProfissoes] = useState<any[]>([]);
  const [origens, setOrigens] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Grupo de Favorecidos
        const { data: grupoFavorecidosData, error: grupoFavorecidosError } = await supabase
          .from('grupo_favorecidos')
          .select('*');
        if (grupoFavorecidosError) throw grupoFavorecidosError;
        setGrupoFavorecidos(grupoFavorecidosData || []);

        // Fetch Profissões
        const { data: profissoesData, error: profissoesError } = await supabase
          .from('profissoes')
          .select('*');
        if (profissoesError) throw profissoesError;
        setProfissoes(profissoesData || []);

        // Fetch Origens
        const { data: origensData, error: origensError } = await supabase
          .from('origens')
          .select('*');
        if (origensError) throw origensError;
        setOrigens(origensData || []);

        // Fetch Favorecido if ID is present
        if (id) {
          const { data: favorecidoData, error: favorecidoError } = await supabase
            .from('favorecidos')
            .select('*')
            .eq('id', id)
            .single();

          if (favorecidoError) {
            throw favorecidoError;
          }

          if (favorecidoData) {
            setFormData(favorecidoData);
          }
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: formData.nome || "",
      cpf_cnpj: formData.cpf_cnpj || "",
      tipo: formData.tipo || "",
      grupo_favorecido_id: formData.grupo_favorecido_id || "",
      profissao_id: formData.profissao_id || "",
      origem_id: formData.origem_id || "",
      data_aniversario: formData.data_aniversario ? new Date(formData.data_aniversario) : undefined,
      email: formData.email || "",
      telefone: formData.telefone || "",
      endereco: formData.endereco || "",
      observacoes: formData.observacoes || "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    form.reset({
      nome: formData.nome || "",
      cpf_cnpj: formData.cpf_cnpj || "",
      tipo: formData.tipo || "",
      grupo_favorecido_id: formData.grupo_favorecido_id || "",
      profissao_id: formData.profissao_id || "",
      origem_id: formData.origem_id || "",
      data_aniversario: formData.data_aniversario ? new Date(formData.data_aniversario) : undefined,
      email: formData.email || "",
      telefone: formData.telefone || "",
      endereco: formData.endereco || "",
      observacoes: formData.observacoes || "",
    });
  }, [formData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const dataToSubmit = {
        ...values,
        data_aniversario: values.data_aniversario ? new Date(values.data_aniversario).toISOString().split('T')[0] : null,
      };
      
      if (id) {
        // Update existing favorecido
        const { error } = await supabase
          .from('favorecidos')
          .update(dataToSubmit)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Favorecido atualizado com sucesso!",
        });
      } else {
        // Create new favorecido
        const { error } = await supabase
          .from('favorecidos')
          .insert([dataToSubmit]);

        if (error) throw error;

        toast({
          title: "Favorecido criado com sucesso!",
        });
      }

      navigate('/cadastros/favorecidos');
    } catch (error: any) {
      toast({
        title: "Erro ao salvar favorecido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do favorecido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpf_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF/CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="CPF/CNPJ do favorecido" {...field} />
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
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grupo_favorecido_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo de Favorecido</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grupoFavorecidos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>{grupo.nome}</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a profissão" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profissoes.map((profissao) => (
                    <SelectItem key={profissao.id} value={profissao.id}>{profissao.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="origem_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origem</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {origens.map((origem) => (
                    <SelectItem key={origem.id} value={origem.id}>{origem.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_aniversario"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Aniversário</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    locale={ptBR}
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Data de aniversário do favorecido.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email do favorecido" {...field} />
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
                <Input placeholder="Telefone do favorecido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Endereço do favorecido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o favorecido"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  )
}
