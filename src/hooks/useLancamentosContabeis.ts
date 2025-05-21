
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { LancamentoContabil } from "@/types/lancamentos-contabeis";
import { PlanoConta } from "@/types/plano-contas";
import { format } from "date-fns";

export function useLancamentosContabeis() {
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [planosContas, setPlanosContas] = useState<PlanoConta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { empresaId } = useAuth();

  // Carregar plano de contas
  const carregarPlanosContas = useCallback(async () => {
    if (!empresaId) return;

    try {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("status", "ativo")
        .order("codigo");

      if (error) throw error;
      
      // Converter o tipo dos dados para o tipo PlanoConta
      setPlanosContas(data.map(conta => ({
        ...conta,
        categoria: conta.categoria as "título" | "movimentação",
      })));
    } catch (error) {
      console.error("Erro ao carregar planos de contas:", error);
      toast.error("Erro ao carregar planos de contas");
    }
  }, [empresaId]);

  // Carregar lançamentos contábeis
  const carregarLancamentos = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      setIsLoading(true);
      
      // Buscar lançamentos contábeis
      const { data: lancamentosData, error: lancamentosError } = await supabase
        .from("lancamentos_contabeis")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("data", { ascending: false });

      if (lancamentosError) throw lancamentosError;

      // Buscar detalhes das contas para cada lançamento
      const lancamentosFormatados = await Promise.all(
        lancamentosData.map(async (lancamento) => {
          // Buscar detalhes da conta de débito
          const { data: contaDebitoData } = await supabase
            .from("plano_contas")
            .select("codigo, descricao")
            .eq("id", lancamento.conta_debito_id)
            .single();

          // Buscar detalhes da conta de crédito
          const { data: contaCreditoData } = await supabase
            .from("plano_contas")
            .select("codigo, descricao")
            .eq("id", lancamento.conta_credito_id)
            .single();

          // Formatar a data para DD/MM/YYYY
          let dataFormatada = lancamento.data;
          if (typeof lancamento.data === 'string' && lancamento.data.includes('-')) {
            const [ano, mes, dia] = lancamento.data.split('-');
            dataFormatada = `${dia.substring(0, 2)}/${mes}/${ano}`;
          }

          // Criar lançamento debitado
          const lancamentoDebito: LancamentoContabil = {
            id: lancamento.id,
            data: dataFormatada,
            historico: lancamento.historico,
            conta_debito_id: lancamento.conta_debito_id,
            conta_credito_id: lancamento.conta_credito_id,
            conta: lancamento.conta_debito_id,
            conta_nome: contaDebitoData?.descricao || "Conta não encontrada",
            conta_codigo: contaDebitoData?.codigo || "N/A",
            tipo: "debito",
            valor: lancamento.valor,
            movimentacao_id: lancamento.movimentacao_id,
            parcela_id: lancamento.parcela_id,
            tipo_lancamento: lancamento.tipo_lancamento as 'principal' | 'juros' | 'multa' | 'desconto' || 'principal',
          };

          // Criar lançamento creditado
          const lancamentoCredito: LancamentoContabil = {
            id: `${lancamento.id}-credito`,
            data: dataFormatada,
            historico: lancamento.historico,
            conta_debito_id: lancamento.conta_debito_id,
            conta_credito_id: lancamento.conta_credito_id,
            conta: lancamento.conta_credito_id,
            conta_nome: contaCreditoData?.descricao || "Conta não encontrada",
            conta_codigo: contaCreditoData?.codigo || "N/A",
            tipo: "credito",
            valor: lancamento.valor,
            movimentacao_id: lancamento.movimentacao_id,
            parcela_id: lancamento.parcela_id,
            tipo_lancamento: lancamento.tipo_lancamento as 'principal' | 'juros' | 'multa' | 'desconto' || 'principal',
          };

          return [lancamentoDebito, lancamentoCredito];
        })
      );

      setLancamentos(lancamentosFormatados.flat());
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
      toast.error("Erro ao carregar lançamentos contábeis");
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  const carregarDados = useCallback(() => {
    carregarPlanosContas();
    carregarLancamentos();
  }, [carregarPlanosContas, carregarLancamentos]);

  useEffect(() => {
    if (empresaId) {
      carregarDados();
    }
  }, [empresaId, carregarDados]);

  // Função para adicionar um novo lançamento contábil
  const adicionarLancamento = async (
    novo: { 
      data: string; 
      historico: string; 
      debito: string; 
      credito: string; 
      valor: number;
      tipo_lancamento?: 'principal' | 'juros' | 'multa' | 'desconto';
      movimentacao_id?: string;
      parcela_id?: string;
    }
  ) => {
    if (!empresaId) {
      toast.error("Empresa não identificada");
      return false;
    }

    try {
      // Converter a data para o formato ISO (YYYY-MM-DD)
      const dataParts = novo.data.split('/');
      const dataIso = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`;

      const novoLancamento = {
        empresa_id: empresaId,
        data: dataIso,
        historico: novo.historico,
        conta_debito_id: novo.debito,
        conta_credito_id: novo.credito,
        valor: novo.valor,
        tipo_lancamento: novo.tipo_lancamento || 'principal',
        movimentacao_id: novo.movimentacao_id,
        parcela_id: novo.parcela_id,
      };

      const { error } = await supabase
        .from("lancamentos_contabeis")
        .insert(novoLancamento);

      if (error) throw error;

      toast.success("Lançamento contábil registrado com sucesso");
      await carregarLancamentos();
      return true;
    } catch (error) {
      console.error("Erro ao adicionar lançamento:", error);
      toast.error("Erro ao registrar lançamento contábil");
      return false;
    }
  };

  // Função para excluir um lançamento contábil
  const excluirLancamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lancamentos_contabeis")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLancamentos((prev) => 
        prev.filter(lanc => lanc.id !== id && lanc.id !== `${id}-credito`)
      );
      
      toast.success("Lançamento excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast.error("Erro ao excluir lançamento");
    }
  };

  // Função para contabilizar parcelas com juros, multas e descontos
  const contabilizarParcelasExtras = async (
    parcela: {
      id: string;
      movimentacao_id: string;
      data_pagamento: string;
      valor: number;
      multa?: number;
      juros?: number;
      desconto?: number;
    }
  ) => {
    if (!empresaId || !parcela.movimentacao_id) {
      toast.error("Dados insuficientes para contabilização");
      return false;
    }

    try {
      // Obter a movimentação relacionada à parcela
      const { data: movimentacaoData, error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .select("*, tipo_titulo:tipo_titulo_id(*)")
        .eq("id", parcela.movimentacao_id)
        .single();

      if (movimentacaoError) throw movimentacaoError;
      
      if (!movimentacaoData.tipo_titulo) {
        console.log("Tipo de título não encontrado para esta movimentação");
        return false;
      }

      const tipoTitulo = movimentacaoData.tipo_titulo;
      const dataPagamento = parcela.data_pagamento;
      const tipoOperacao = movimentacaoData.tipo_operacao;
      
      // Contabilizar juros se houver
      if (parcela.juros && parcela.juros > 0 && tipoTitulo.conta_juros_id && tipoTitulo.conta_juros_id !== 'sem_conta') {
        let contaDebito, contaCredito;
        
        if (tipoOperacao === 'pagar') {
          contaDebito = tipoTitulo.conta_juros_id;
          contaCredito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
        } else {
          contaDebito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
          contaCredito = tipoTitulo.conta_juros_id;
        }
        
        await adicionarLancamento({
          data: format(new Date(dataPagamento), 'dd/MM/yyyy'),
          historico: `Juros ref. parcela ${parcela.id.substring(0, 6)} - ${movimentacaoData.descricao || 'Sem descrição'}`,
          debito: contaDebito,
          credito: contaCredito,
          valor: parcela.juros,
          tipo_lancamento: 'juros',
          movimentacao_id: parcela.movimentacao_id,
          parcela_id: parcela.id
        });
      }
      
      // Contabilizar multa se houver
      if (parcela.multa && parcela.multa > 0 && tipoTitulo.conta_multa_id && tipoTitulo.conta_multa_id !== 'sem_conta') {
        let contaDebito, contaCredito;
        
        if (tipoOperacao === 'pagar') {
          contaDebito = tipoTitulo.conta_multa_id;
          contaCredito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
        } else {
          contaDebito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
          contaCredito = tipoTitulo.conta_multa_id;
        }
        
        await adicionarLancamento({
          data: format(new Date(dataPagamento), 'dd/MM/yyyy'),
          historico: `Multa ref. parcela ${parcela.id.substring(0, 6)} - ${movimentacaoData.descricao || 'Sem descrição'}`,
          debito: contaDebito,
          credito: contaCredito,
          valor: parcela.multa,
          tipo_lancamento: 'multa',
          movimentacao_id: parcela.movimentacao_id,
          parcela_id: parcela.id
        });
      }
      
      // Contabilizar desconto se houver
      if (parcela.desconto && parcela.desconto > 0 && tipoTitulo.conta_desconto_id && tipoTitulo.conta_desconto_id !== 'sem_conta') {
        let contaDebito, contaCredito;
        
        if (tipoOperacao === 'pagar') {
          contaDebito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
          contaCredito = tipoTitulo.conta_desconto_id;
        } else {
          contaDebito = tipoTitulo.conta_desconto_id;
          contaCredito = movimentacaoData.conta_destino_id || tipoTitulo.conta_contabil_id;
        }
        
        await adicionarLancamento({
          data: format(new Date(dataPagamento), 'dd/MM/yyyy'),
          historico: `Desconto ref. parcela ${parcela.id.substring(0, 6)} - ${movimentacaoData.descricao || 'Sem descrição'}`,
          debito: contaDebito,
          credito: contaCredito,
          valor: parcela.desconto,
          tipo_lancamento: 'desconto',
          movimentacao_id: parcela.movimentacao_id,
          parcela_id: parcela.id
        });
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao contabilizar juros/multa/desconto:", error);
      toast.error("Erro ao contabilizar valores adicionais");
      return false;
    }
  };

  return {
    lancamentos,
    planosContas,
    isLoading,
    carregarDados,
    adicionarLancamento,
    excluirLancamento,
    contabilizarParcelasExtras
  };
}
