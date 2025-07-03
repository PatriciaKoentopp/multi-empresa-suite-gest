
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { formSchema, FormValues } from "./favorecidos-form.schema";
import { FavorecidoTipoRadio } from "./favorecido-tipo-radio";
import { FavorecidoDocumento } from "./favorecido-documento";
import { FavorecidoDadosBasicos } from "./favorecido-dados-basicos";
import { FavorecidoAniversarioStatus } from "./favorecido-aniversario-status";
import { FavorecidoEndereco } from "./favorecido-endereco";
import { DatePicker } from "@/components/ui/date-picker";
import { Favorecido } from "@/types";

interface FavorecidosFormProps {
  favorecido?: Favorecido;
  onClose: () => void;
  onSuccess: () => void;
}

export function FavorecidosForm({ favorecido, onClose, onSuccess }: FavorecidosFormProps) {
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "fisica",
      tipo_documento: "cpf",
      nome: "",
      nome_fantasia: "",
      documento: "",
      email: "",
      telefone: "",
      data_aniversario: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
      status: "ativo",
      grupo_id: "",
      profissao_id: "",
    },
  });

  useEffect(() => {
    if (favorecido) {
      form.reset({
        tipo: favorecido.tipo as "fisica" | "juridica" | "publico" | "funcionario",
        tipo_documento: favorecido.tipo_documento as "cpf" | "cnpj",
        nome: favorecido.nome || "",
        nome_fantasia: favorecido.nome_fantasia || "",
        documento: favorecido.documento || "",
        email: favorecido.email || "",
        telefone: favorecido.telefone || "",
        data_aniversario: favorecido.data_aniversario || "",
        cep: favorecido.cep || "",
        logradouro: favorecido.logradouro || "",
        numero: favorecido.numero || "",
        complemento: favorecido.complemento || "",
        bairro: favorecido.bairro || "",
        cidade: favorecido.cidade || "",
        estado: favorecido.estado || "",
        pais: favorecido.pais || "Brasil",
        status: favorecido.status as "ativo" | "inativo",
        grupo_id: favorecido.grupo_id || "",
        profissao_id: favorecido.profissao_id || "",
      });
    }
  }, [favorecido, form]);

  const onSubmit = async (values: FormValues) => {
    if (!currentCompany?.id) {
      toast.error("Empresa não selecionada");
      return;
    }

    setIsSubmitting(true);

    try {
      const favorecidoData = {
        empresa_id: currentCompany.id,
        tipo: values.tipo,
        tipo_documento: values.tipo_documento,
        nome: values.nome || "",
        nome_fantasia: values.nome_fantasia || "",
        documento: values.documento || "",
        email: values.email || "",
        telefone: values.telefone || "",
        data_aniversario: values.data_aniversario || null,
        cep: values.cep || "",
        logradouro: values.logradouro || "",
        numero: values.numero || "",
        complemento: values.complemento || "",
        bairro: values.bairro || "",
        cidade: values.cidade || "",
        estado: values.estado || "",
        pais: values.pais || "Brasil",
        status: values.status,
        grupo_id: values.grupo_id || null,
        profissao_id: values.profissao_id || null,
      };

      let result;
      if (favorecido) {
        result = await supabase
          .from("favorecidos")
          .update(favorecidoData)
          .eq("id", favorecido.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("favorecidos")
          .insert(favorecidoData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(
        favorecido
          ? "Favorecido atualizado com sucesso!"
          : "Favorecido cadastrado com sucesso!"
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar favorecido:", error);
      toast.error("Erro ao salvar favorecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FavorecidoTipoRadio form={form} />
          <FavorecidoDocumento form={form} />
          <FavorecidoDadosBasicos form={form} />
          <FavorecidoAniversarioStatus form={form} />
          <FavorecidoEndereco form={form} />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="blue" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : favorecido ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
