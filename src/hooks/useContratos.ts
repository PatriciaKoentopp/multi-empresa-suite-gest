
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

      // Se gerar_automatico for true, gerar as movimentações
      if (formData.gerar_automatico) {
        await gerarMovimentacoesContrato(data.id);
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
      await gerarMovimentacoesContrato(contratoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contas a receber geradas com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao gerar contas a receber:", error);
      toast.error("Erro ao gerar contas a receber");
    },
  });

  // Função para gerar movimentações a partir do contrato
  const gerarMovimentacoesContrato = async (contratoId: string) => {
    try {
      // Buscar dados do contrato
      const { data: contrato, error: contratoError } = await supabase
        .from("contratos")
        .select("*, favorecido:favorecidos(nome)")
        .eq("id", contratoId)
        .single();

      if (contratoError) throw contratoError;

      // Calcular número de meses de vigência
      const dataInicio = new Date(contrato.data_inicio);
      const dataFim = new Date(contrato.data_fim);
      const mesesVigencia = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 + 
                           (dataFim.getMonth() - dataInicio.getMonth()) + 1;

      // Calcular número de parcelas baseado na periodicidade
      let numeroParcelas = mesesVigencia;
      switch (contrato.periodicidade) {
        case 'trimestral':
          numeroParcelas = Math.ceil(mesesVigencia / 3);
          break;
        case 'semestral':
          numeroParcelas = Math.ceil(mesesVigencia / 6);
          break;
        case 'anual':
          numeroParcelas = Math.ceil(mesesVigencia / 12);
          break;
      }

      // Criar a movimentação principal
      const { data: movimentacao, error: movError } = await supabase
        .from("movimentacoes")
        .insert({
          empresa_id: contrato.empresa_id,
          tipo_operacao: 'receber',
          data_lancamento: contrato.data_inicio,
          numero_documento: contrato.codigo,
          favorecido_id: contrato.favorecido_id,
          descricao: `Contrato ${contrato.codigo} - ${contrato.favorecido?.nome || 'Cliente'}`,
          valor: contrato.valor_total,
          numero_parcelas: numeroParcelas,
          primeiro_vencimento: calcularPrimeiroVencimento(dataInicio, contrato.dia_vencimento),
          forma_pagamento: contrato.forma_pagamento,
          considerar_dre: true
        })
        .select()
        .single();

      if (movError) throw movError;

      // Criar as parcelas
      const parcelas = [];
      let dataVencimento = new Date(calcularPrimeiroVencimento(dataInicio, contrato.dia_vencimento));
      
      // Calcular valor da parcela baseado na periodicidade
      let valorParcela = contrato.valor_mensal;
      switch (contrato.periodicidade) {
        case 'trimestral':
          valorParcela = contrato.valor_mensal * 3;
          break;
        case 'semestral':
          valorParcela = contrato.valor_mensal * 6;
          break;
        case 'anual':
          valorParcela = contrato.valor_mensal * 12;
          break;
      }

      for (let i = 1; i <= numeroParcelas; i++) {
        parcelas.push({
          movimentacao_id: movimentacao.id,
          numero: i,
          valor: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0]
        });

        // Calcular próxima data baseado na periodicidade
        switch (contrato.periodicidade) {
          case 'mensal':
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
            break;
          case 'trimestral':
            dataVencimento.setMonth(dataVencimento.getMonth() + 3);
            break;
          case 'semestral':
            dataVencimento.setMonth(dataVencimento.getMonth() + 6);
            break;
          case 'anual':
            dataVencimento.setFullYear(dataVencimento.getFullYear() + 1);
            break;
        }
      }

      const { error: parcelasError } = await supabase
        .from("movimentacoes_parcelas")
        .insert(parcelas);

      if (parcelasError) throw parcelasError;

    } catch (error) {
      console.error("Erro ao gerar movimentações:", error);
      throw error;
    }
  };

  // Função auxiliar para calcular o primeiro vencimento
  const calcularPrimeiroVencimento = (dataInicio: Date, diaVencimento: number): string => {
    const proximoMes = new Date(dataInicio);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    proximoMes.setDate(diaVencimento);
    return proximoMes.toISOString().split('T')[0];
  };

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
