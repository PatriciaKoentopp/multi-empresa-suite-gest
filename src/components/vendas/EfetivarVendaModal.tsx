import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formSchema, FormValues } from "./efetivar-venda-modal.schema";
import { Orcamento } from "@/types";
import { useCompany } from "@/contexts/company-context";

interface EfetivarVendaModalProps {
  orcamento: Orcamento;
  onClose: () => void;
  onSuccess: () => void;
}

export function EfetivarVendaModal({ orcamento, onClose, onSuccess }: EfetivarVendaModalProps) {
  const { currentCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_venda: orcamento.data_venda ? new Date(orcamento.data_venda) : undefined,
      numero_nota_fiscal: orcamento.numero_nota_fiscal || "",
      observacoes: orcamento.observacoes || "",
      favorecido_id: orcamento.favorecido_id || "",
      forma_pagamento: orcamento.forma_pagamento || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!currentCompany?.id) {
      toast.error("Empresa não selecionada");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        data_venda: values.data_venda ? values.data_venda.toISOString().split("T")[0] : null,
        numero_nota_fiscal: values.numero_nota_fiscal,
        observacoes: values.observacoes,
        favorecido_id: values.favorecido_id,
        forma_pagamento: values.forma_pagamento,
        status: "finalizado",
      };

      const { data, error } = await supabase
        .from("orcamentos")
        .update(updateData)
        .eq("id", orcamento.id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Venda efetivada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao efetivar venda:", error);
      toast.error("Erro ao efetivar venda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="data_venda" className="block text-sm font-medium text-gray-700">
              Data da Venda
            </label>
            <input
              type="date"
              id="data_venda"
              {...form.register("data_venda")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {form.formState.errors.data_venda && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.data_venda.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="numero_nota_fiscal" className="block text-sm font-medium text-gray-700">
              Número da Nota Fiscal
            </label>
            <input
              type="text"
              id="numero_nota_fiscal"
              {...form.register("numero_nota_fiscal")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {form.formState.errors.numero_nota_fiscal && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.numero_nota_fiscal.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
              Observações
            </label>
            <textarea
              id="observacoes"
              {...form.register("observacoes")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
            {form.formState.errors.observacoes && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.observacoes.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="favorecido_id" className="block text-sm font-medium text-gray-700">
              Favorecido
            </label>
            <input
              type="text"
              id="favorecido_id"
              {...form.register("favorecido_id")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled
            />
            {form.formState.errors.favorecido_id && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.favorecido_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="forma_pagamento" className="block text-sm font-medium text-gray-700">
              Forma de Pagamento
            </label>
            <input
              type="text"
              id="forma_pagamento"
              {...form.register("forma_pagamento")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {form.formState.errors.forma_pagamento && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.forma_pagamento.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Efetivar Venda"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
