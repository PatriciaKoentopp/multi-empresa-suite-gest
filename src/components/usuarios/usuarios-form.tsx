
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Usuario } from "@/types";

const usuarioSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
  tipo: z.enum(["Administrador", "Usuário"]),
  status: z.enum(["ativo", "inativo"]),
  vendedor: z.enum(["sim", "nao"]),
});

type FormData = z.infer<typeof usuarioSchema>;

interface UsuariosFormProps {
  usuario?: Usuario;
  onSubmit: (data: Usuario) => void;
  onCancel: () => void;
}

export function UsuariosForm({ usuario, onSubmit, onCancel }: UsuariosFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: usuario
      ? {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          senha: "",
          tipo: usuario.tipo,
          status: usuario.status,
          vendedor: usuario.vendedor,
        }
      : {
          nome: "",
          email: "",
          senha: "",
          tipo: "Usuário",
          status: "ativo",
          vendedor: "nao",
        },
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const usuarioData: Usuario = {
        id: usuario?.id || crypto.randomUUID(),
        nome: data.nome,
        email: data.email,
        tipo: data.tipo,
        status: data.status,
        vendedor: data.vendedor,
        created_at: usuario?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        empresa_id: usuario?.empresa_id || undefined
      };
      
      onSubmit(usuarioData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do usuário" />
              </FormControl>
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
                <Input {...field} placeholder="email@exemplo.com" type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{usuario ? "Nova senha (opcional)" : "Senha"}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="******" type="password" />
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
              <FormLabel>Tipo de Usuário</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Administrador" id="admin" />
                    <Label htmlFor="admin">Administrador</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Usuário" id="user" />
                    <Label htmlFor="user">Usuário</Label>
                  </div>
                </RadioGroup>
              </FormControl>
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ativo" id="ativo" />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inativo" id="inativo" />
                    <Label htmlFor="inativo">Inativo</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendedor"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>É vendedor?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sim" />
                    <Label htmlFor="sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="nao" />
                    <Label htmlFor="nao">Não</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="blue" disabled={isLoading}>
            {isLoading ? "Salvando..." : usuario ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
