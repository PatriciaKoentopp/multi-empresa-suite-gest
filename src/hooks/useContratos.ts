
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
    mutationFn: async (contratoId: string) => {
      console.log("Tentando excluir contrato:", contratoId);
      
      // Primeiro, buscar o código do contrato
      const { data: contrato, error: contratoError } = await supabase
        .from("contratos")
        .select("codigo")
        .eq("id", contratoId)
        .single();

      if (contratoError) {
        console.error("Erro ao buscar contrato:", contratoError);
        throw contratoError;
      }

      console.log("Código do contrato:", contrato.codigo);

      // Buscar movimentações relacionadas ao contrato usando o código
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          numero_documento,
          movimentacoes_parcelas(
            id,
            data_pagamento
          )
        `)
        .eq("numero_documento", contrato.codigo)
        .eq("tipo_operacao", "receber");

      if (movError) {
        console.error("Erro ao buscar movimentações:", movError);
        throw movError;
      }

      console.log("Movimentações encontradas:", movimentacoes);

      // Verificar se existem parcelas baixadas (com data_pagamento preenchida)
      const temParcelasBaixadas = movimentacoes?.some(mov => 
        mov.movimentacoes_parcelas?.some(parcela => parcela.data_pagamento !== null)
      );

      console.log("Tem parcelas baixadas:", temParcelasBaixadas);

      if (temParcelasBaixadas) {
        throw new Error("Não é possível excluir o contrato pois existem parcelas já baixadas no contas a receber.");
      }

      // Se chegou até aqui, pode excluir
      // Primeiro, excluir as parcelas das movimentações
      if (movimentacoes && movimentacoes.length > 0) {
        console.log("Excluindo movimentações relacionadas...");
        
        for (const movimentacao of movimentacoes) {
          // Excluir parcelas da movimentação
          const { error: parcelasError } = await supabase
            .from("movimentacoes_parcelas")
            .delete()
            .eq("movimentacao_id", movimentacao.id);

          if (parcelasError) {
            console.error("Erro ao excluir parcelas:", parcelasError);
            throw parcelasError;
          }

          // Excluir a movimentação
          const { error: movimentacaoError } = await supabase
            .from("movimentacoes")
            .delete()
            .eq("id", movimentacao.id);

          if (movimentacaoError) {
            console.error("Erro ao excluir movimentação:", movimentacaoError);
            throw movimentacaoError;
          }
        }
      }

      // Por último, excluir o contrato
      const { error: contratoDeleteError } = await supabase
        .from("contratos")
        .delete()
        .eq("id", contratoId);

      if (contratoDeleteError) {
        console.error("Erro ao excluir contrato:", contratoDeleteError);
        throw contratoDeleteError;
      }

      console.log("Contrato excluído com sucesso");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast.success("Contrato e suas movimentações excluídas com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao excluir contrato:", error);
      toast.error(error.message || "Erro ao excluir contrato");
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
      
      // Calcular meses de vigência considerando ano e mês
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

      // Calcular primeiro vencimento - verificar se é no mês de início ou próximo mês
      const primeiroVencimento = calcularPrimeiroVencimento(dataInicio, contrato.dia_vencimento);

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
          primeiro_vencimento: primeiroVencimento,
          forma_pagamento: contrato.forma_pagamento,
          considerar_dre: true
        })
        .select()
        .single();

      if (movError) throw movError;

      // Criar as parcelas
      const parcelas = [];
      let dataVencimento = new Date(primeiroVencimento);
      
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
    const mesInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), diaVencimento);
    
    // Se o dia de vencimento já passou no mês de início, usar o próximo mês
    if (mesInicio < dataInicio) {
      const proximoMes = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, diaVencimento);
      return proximoMes.toISOString().split('T')[0];
    }
    
    // Caso contrário, usar o mês de início
    return mesInicio.toISOString().split('T')[0];
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
