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
      
      // Garantir que periodicidade seja tipada corretamente
      return (data || []).map(contrato => ({
        ...contrato,
        periodicidade: contrato.periodicidade as "mensal" | "trimestral" | "semestral" | "anual"
      })) as Contrato[];
    },
    enabled: !!currentCompany?.id,
  });

  const calcularMesesVigencia = (dataInicio: Date, dataFim: Date): number => {
    const anoInicio = dataInicio.getFullYear();
    const mesInicio = dataInicio.getMonth();
    const anoFim = dataFim.getFullYear();
    const mesFim = dataFim.getMonth();
    
    // Calcular a diferença em meses (SEM adicionar 1)
    const mesesVigencia = (anoFim - anoInicio) * 12 + (mesFim - mesInicio);
    
    console.log("Cálculo meses vigência:", {
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0],
      anoInicio,
      mesInicio,
      anoFim,
      mesFim,
      mesesVigencia
    });
    
    return mesesVigencia;
  };

  const calcularMesReferencia = (dataInicio: Date, numeroParcela: number): string => {
    // O mês de referência é sempre baseado na sequência de meses da vigência
    // Primeira parcela = mês de início da vigência, segunda = próximo mês, etc.
    const mesInicioVigencia = dataInicio.getMonth(); // 0-11
    const anoInicioVigencia = dataInicio.getFullYear();
    
    // Para a primeira parcela (numeroParcela = 1), usar o mês de início
    // Para a segunda parcela (numeroParcela = 2), usar o mês seguinte, etc.
    const mesVigenciaAtual = mesInicioVigencia + (numeroParcela - 1);
    
    // Criar data para o mês de vigência correto
    const dataVigencia = new Date(anoInicioVigencia, mesVigenciaAtual, 1);
    
    // Formatar como MM/YYYY - SOMANDO 1 para corrigir o problema
    const mes = String(dataVigencia.getMonth() + 1 + 1).padStart(2, '0');
    const ano = dataVigencia.getFullYear();
    
    console.log("Cálculo mês referência baseado na vigência:", {
      dataInicio: dataInicio.toISOString().split('T')[0],
      numeroParcela,
      mesInicioVigencia: `${String(dataInicio.getMonth() + 1).padStart(2, '0')}/${dataInicio.getFullYear()}`,
      mesVigenciaCalculado: `${mes}/${ano}`,
      explicacao: `Parcela ${numeroParcela} = Mês ${numeroParcela} de vigência (começando em ${String(dataInicio.getMonth() + 1).padStart(2, '0')}/${dataInicio.getFullYear()})`
    });
    
    return `${mes}/${ano}`;
  };

  const createContrato = useMutation({
    mutationFn: async (formData: ContratoFormData) => {
      if (!currentCompany?.id) throw new Error("Empresa não selecionada");

      // Calcular meses de vigência corretamente
      const dataInicio = new Date(formData.data_inicio!);
      const dataFim = new Date(formData.data_fim!);
      
      const mesesVigencia = calcularMesesVigencia(dataInicio, dataFim);

      // Número de parcelas = número de meses de vigência
      const numeroParcelas = mesesVigencia;

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

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("contratos")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Status do contrato alterado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao alterar status do contrato:", error);
      toast.error("Erro ao alterar status do contrato");
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

      // Buscar movimentações relacionadas ao contrato usando LIKE para pegar todas as parcelas
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
        .like("numero_documento", `${contrato.codigo}%`)
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

  const gerarMovimentacoesContrato = async (contratoId: string) => {
    try {
      // Buscar dados do contrato
      const { data: contrato, error: contratoError } = await supabase
        .from("contratos")
        .select("*, favorecido:favorecidos(nome)")
        .eq("id", contratoId)
        .single();

      if (contratoError) throw contratoError;

      // Calcular meses de vigência
      const dataInicio = new Date(contrato.data_inicio);
      const dataFim = new Date(contrato.data_fim);
      const dataPrimeiroVencimento = new Date(contrato.data_primeiro_vencimento);
      
      const mesesVigencia = calcularMesesVigencia(dataInicio, dataFim);

      // Número de parcelas = número de meses de vigência
      const numeroParcelas = mesesVigencia;

      console.log("Número de parcelas a gerar:", numeroParcelas);

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

      // Gerar movimentações independentes - uma para cada parcela
      let dataVencimento = new Date(dataPrimeiroVencimento);
      
      for (let i = 1; i <= numeroParcelas; i++) {
        // Calcular mês de referência baseado na vigência do contrato
        const mesReferencia = calcularMesReferencia(dataInicio, i);
        
        // Criar uma movimentação independente para cada parcela
        const { data: movimentacao, error: movError } = await supabase
          .from("movimentacoes")
          .insert({
            empresa_id: contrato.empresa_id,
            tipo_operacao: 'receber',
            data_lancamento: contrato.data_inicio,
            numero_documento: `${contrato.codigo}/${String(i).padStart(2, '0')}`,
            favorecido_id: contrato.favorecido_id,
            descricao: `Contrato ${contrato.codigo} - Parcela ${String(i).padStart(2, '0')} - ${contrato.favorecido?.nome || 'Cliente'}`,
            valor: valorParcela,
            numero_parcelas: 1, // Cada movimentação tem apenas 1 parcela
            primeiro_vencimento: dataVencimento.toISOString().split('T')[0],
            forma_pagamento: contrato.forma_pagamento,
            considerar_dre: true,
            mes_referencia: mesReferencia
          })
          .select()
          .single();

        if (movError) throw movError;

        // Criar a parcela única para esta movimentação
        const { error: parcelaError } = await supabase
          .from("movimentacoes_parcelas")
          .insert({
            movimentacao_id: movimentacao.id,
            numero: 1, // Sempre 1 pois cada movimentação tem apenas uma parcela
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0]
          });

        if (parcelaError) throw parcelaError;

        // Próxima parcela sempre no mês seguinte
        if (i < numeroParcelas) {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }
      }

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
    changeStatus,
  };
};
