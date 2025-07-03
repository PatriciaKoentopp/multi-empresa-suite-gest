import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { Usuario } from "@/types";

interface UsuariosFormProps {
  usuario?: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function UsuariosForm({ usuario, onClose, onSuccess }: UsuariosFormProps) {
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    id: usuario?.id || "",
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    senha: "",
    tipo: (usuario?.tipo || "Usuário") as "Administrador" | "Usuário",
    status: (usuario?.status || "ativo") as "ativo" | "inativo",
    vendedor: (usuario?.vendedor || "nao") as "sim" | "nao",
  };

  const form = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = async (values: any) => {
    const userData = {
      ...values,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setIsSubmitting(true);

    try {
      let result;
      if (usuario) {
        result = await supabase
          .from("usuarios")
          .update(userData)
          .eq("id", usuario.id)
          .select()
          .single();
      } else {
        if (!currentCompany?.id) {
          toast.error("Empresa não selecionada");
          return;
        }

        userData.empresa_id = currentCompany.id;
        result = await supabase
          .from("usuarios")
          .insert(userData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(
        usuario
          ? "Usuário atualizado com sucesso!"
          : "Usuário cadastrado com sucesso!"
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro ao salvar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do usuário" {...field} />
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
                  <Input type="email" placeholder="Email do usuário" {...field} />
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
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Senha do usuário" {...field} />
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
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Usuário">Usuário</SelectItem>
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
              <FormItem className="space-y-3">
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-2.5">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="ativo" id="ativo" />
                      <FormLabel htmlFor="ativo">Ativo</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="inativo" id="inativo" />
                      <FormLabel htmlFor="inativo">Inativo</FormLabel>
                    </FormItem>
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
                <FormLabel>Vendedor</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-2.5">
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="sim" id="sim" />
                      <FormLabel htmlFor="sim">Sim</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <RadioGroupItem value="nao" id="nao" />
                      <FormLabel htmlFor="nao">Não</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : usuario ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
