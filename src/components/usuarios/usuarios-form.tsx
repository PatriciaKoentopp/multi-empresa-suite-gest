import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Usuario } from "@/types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formSchema, FormValues } from "./usuarios-form.schema";

interface UsuariosFormProps {
  usuario?: Usuario;
  onSubmit: (data: Partial<Usuario>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function UsuariosForm({
  usuario,
  onSubmit,
  onCancel,
  readOnly = false,
}: UsuariosFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: usuario ? {
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      vendedor: usuario.vendedor === 'sim',
      status: usuario.status === 'ativo',
    } : {
      nome: "",
      email: "",
      tipo: "Usuário",
      vendedor: false,
      status: true,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      const userData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Dados do usuário para envio:', userData);
      onSubmit(userData);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormDescription>
                Este é o nome que será exibido publicamente.
              </FormDescription>
              <Input placeholder="Seu nome" {...field} readOnly={readOnly} />
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
              <FormDescription>
                Este é o seu endereço de e-mail.
              </FormDescription>
              <Input placeholder="seuemail@exemplo.com" {...field} type="email" readOnly={readOnly} />
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
              <Select disabled={readOnly} onValueChange={field.onChange} defaultValue={field.value}>
                <FormTrigger>
                  <FormValue placeholder="Selecione o tipo" />
                </FormTrigger>
                <FormContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Usuário">Usuário</SelectItem>
                </FormContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vendedor"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Vendedor</FormLabel>
                <FormDescription>
                  Defina se este usuário é um vendedor.
                </FormDescription>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={readOnly}
              />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Status</FormLabel>
                <FormDescription>
                  Defina se este usuário está ativo.
                </FormDescription>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={readOnly}
              />
            </FormItem>
          )}
        />
        {!readOnly ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue">
              Salvar
            </Button>
          </div>
        ) : (
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

const FormTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <SelectTrigger id="tipo" className={className}>
      {children}
    </SelectTrigger>
  );
};

const FormValue = ({ placeholder }: { placeholder: string }) => {
  return (
    <SelectValue placeholder={placeholder} />
  );
};

const FormContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <SelectContent className={className}>
      {children}
    </SelectContent>
  );
};
