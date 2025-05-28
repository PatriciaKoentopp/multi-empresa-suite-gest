
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { toast } from "sonner";
import { Contrato, ContratoFormData } from "@/types/contratos";

export const useContratos = () => {
  const { currentCompany } = useCompany();
  const queryClient = useQueryClient();

  const { data: contratos = [], isLoading, refetch } = useQuery({
    queryKey: ["contratos", currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];
      
      const { data, error } = await supabase
        .from("contratos")
        .select(`
          *,
          favorecido:favorecidos(id, nome, documento),
          servico:servicos(id, nome)
        `)
        .eq("empresa_id", currentCompany.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id,
  });

  const createContrato = useMutation({
    mutationFn: async (formData: ContratoFormData) => {
      if (!currentCompany?.id) throw new Error("Empresa não selecionada");

      // Calcular valor total baseado na periodicidade
      const mesesVigencia = Math.ceil(
        (formData.data_fim!.getTime() - formData.data_inicio!.getTime()) / 
        (1000 * 60 * 60 * 24 * 30)
      );
      
      let valorTotal = 0;
      switch (formData.periodicidade) {
        case 'mensal':
          valorTotal = formData.valor_mensal * mesesVigencia;
          break;
        case 'trimestral':
          valorTotal = (formData.valor_mensal * 3) * Math.ceil(mesesVigencia / 3);
          break;
        case 'semestral':
          valorTotal = (formData.valor_mensal * 6) * Math.ceil(mesesVigencia / 6);
          break;
        case 'anual':
          valorTotal = (formData.valor_mensal * 12) * Math.ceil(mesesVigencia / 12);
          break;
      }

      const contratoData = {
        codigo: formData.codigo,
        empresa_id: currentCompany.id,
        favorecido_id: formData.favorecido_id,
        servico_id: formData.servico_id,
        descricao: formData.descricao || null,
        valor_mensal: formData.valor_mensal,
        valor_total: valorTotal,
        data_inicio: formData.data_inicio!.toISOString().split('T')[0],
        data_fim: formData.data_fim!.toISOString().split('T')[0],
        dia_vencimento: formData.dia_vencimento,
        periodicidade: formData.periodicidade,
        forma_pagamento: formData.forma_pagamento,
        observacoes: formData.observacoes || null,
        gerar_automatico: formData.gerar_automatico,
        status: 'ativo'
      };

      const { data, error } = await supabase
        .from("contratos")
        .insert(contratoData)
        .select()
        .single();

      if (error) throw error;

      // Se gerar_automatico for true, chamar a função para gerar parcelas
      if (formData.gerar_automatico) {
        const { error: functionError } = await supabase
          .rpc('gerar_parcelas_contrato', { contrato_id_param: data.id });

        if (functionError) {
          console.error('Erro ao gerar parcelas:', functionError);
          // Não falha a criação do contrato, apenas loga o erro
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar contrato:", error);
      toast.error("Erro ao criar contrato");
    },
  });

  const updateContrato = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ContratoFormData }) => {
      const contratoData = {
        codigo: formData.codigo,
        favorecido_id: formData.favorecido_id,
        servico_id: formData.servico_id,
        descricao: formData.descricao || null,
        valor_mensal: formData.valor_mensal,
        data_inicio: formData.data_inicio!.toISOString().split('T')[0],
        data_fim: formData.data_fim!.toISOString().split('T')[0],
        dia_vencimento: formData.dia_vencimento,
        periodicidade: formData.periodicidade,
        forma_pagamento: formData.forma_pagamento,
        observacoes: formData.observacoes || null,
        gerar_automatico: formData.gerar_automatico,
      };

      const { data, error } = await supabase
        .from("contratos")
        .update(contratoData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar contrato:", error);
      toast.error("Erro ao atualizar contrato");
    },
  });

  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contratos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir contrato:", error);
      toast.error("Erro ao excluir contrato");
    },
  });

  const generateInvoices = useMutation({
    mutationFn: async (contratoId: string) => {
      const { error } = await supabase
        .rpc('gerar_parcelas_contrato', { contrato_id_param: contratoId });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contas a receber geradas com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao gerar contas a receber:", error);
      toast.error("Erro ao gerar contas a receber");
    },
  });

  return {
    contratos,
    isLoading,
    refetch,
    createContrato,
    updateContrato,
    deleteContrato,
    generateInvoices,
  };
};
