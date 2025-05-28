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

      // Calcular meses de vigência - forma simples
      const dataInicio = new Date(formData.data_inicio!);
      const dataFim = new Date(formData.data_fim!);
      
      // Calcular diferença em meses
      const anosDiferenca = dataFim.getFullYear() - dataInicio.getFullYear();
      const mesesDiferenca = dataFim.getMonth() - dataInicio.getMonth();
      const mesesVigencia = anosDiferenca * 12 + mesesDiferenca + 1;

      // Número de parcelas = número de meses de vigência (simples!)
      const numeroParcelas = mesesVigencia;

      console.log("Vigência:", {
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
        mesesVigencia,
        numeroParcelas,
        periodicidade: formData.periodicidade
      });

      // Calcular valor da parcela baseado na periodicidade
      let valorParcela = formData.valor_mensal;
      switch (formData.periodicidade) {
        case 'trimestral':
          valorParcela = formData.valor_mensal * 3;
          break;
        case 'semestral':
          valorParcela = formData.valor_mensal * 6;
          break;
        case 'anual':
          valorParcela = formData.valor_mensal * 12;
          break;
      }

      const valorTotal = valorParcela * numeroParcelas;

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
        data_primeiro_vencimento: formData.data_primeiro_vencimento!.toISOString().split('T')[0],
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
        data_primeiro_vencimento: formData.data_primeiro_vencimento!.toISOString().split('T')[0],
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

      // Calcular meses de vigência - forma simples
      const dataInicio = new Date(contrato.data_inicio);
      const dataFim = new Date(contrato.data_fim);
      const dataPrimeiroVencimento = new Date(contrato.data_primeiro_vencimento);
      
      // Calcular diferença em meses
      const anosDiferenca = dataFim.getFullYear() - dataInicio.getFullYear();
      const mesesDiferenca = dataFim.getMonth() - dataInicio.getMonth();
      const mesesVigencia = anosDiferenca * 12 + mesesDiferenca + 1;

      // Número de parcelas = número de meses de vigência (simples!)
      const numeroParcelas = mesesVigencia;

      console.log("Gerando movimentações - Vigência:", {
        dataInicio: contrato.data_inicio,
        dataFim: contrato.data_fim,
        mesesVigencia,
        numeroParcelas,
        periodicidade: contrato.periodicidade
      });

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

      const valorTotal = valorParcela * numeroParcelas;

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
          valor: valorTotal,
          numero_parcelas: numeroParcelas,
          primeiro_vencimento: contrato.data_primeiro_vencimento,
          forma_pagamento: contrato.forma_pagamento,
          considerar_dre: true
        })
        .select()
        .single();

      if (movError) throw movError;

      // Criar as parcelas - uma por mês de vigência
      const parcelas = [];
      let dataVencimento = new Date(dataPrimeiroVencimento);
      
      for (let i = 1; i <= numeroParcelas; i++) {
        parcelas.push({
          movimentacao_id: movimentacao.id,
          numero: i,
          valor: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0]
        });

        // Próxima parcela sempre no mês seguinte (independente da periodicidade)
        if (i < numeroParcelas) {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }
      }

      console.log("Parcelas a serem inseridas:", parcelas);

      const { error: parcelasError } = await supabase
        .from("movimentacoes_parcelas")
        .insert(parcelas);

      if (parcelasError) throw parcelasError;

    } catch (error) {
      console.error("Erro ao gerar movimentações:", error);
      throw error;
    }
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
