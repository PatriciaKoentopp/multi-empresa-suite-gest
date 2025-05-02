
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DadosFinanceiros, FluxoMensal } from "@/types/financeiro";

export const usePainelFinanceiro = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dadosFinanceiros, setDadosFinanceiros] = useState<DadosFinanceiros | null>(null);
  
  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  const fetchDadosFinanceiros = async () => {
    try {
      setIsLoading(true);
      
      // Busca dados das parcelas a receber
      const { data: parcelasReceber, error: errorReceber } = await supabase
        .from('movimentacoes_parcelas')
        .select(`
          id,
          valor,
          data_vencimento,
          data_pagamento,
          movimentacoes:movimentacao_id (
            tipo_operacao
          )
        `)
        .eq('movimentacoes.tipo_operacao', 'receber')
        .is('data_pagamento', null);
      
      if (errorReceber) throw errorReceber;

      // Busca dados das parcelas a pagar
      const { data: parcelasPagar, error: errorPagar } = await supabase
        .from('movimentacoes_parcelas')
        .select(`
          id,
          valor,
          data_vencimento,
          data_pagamento,
          movimentacoes:movimentacao_id (
            tipo_operacao
          )
        `)
        .eq('movimentacoes.tipo_operacao', 'pagar')
        .is('data_pagamento', null);
      
      if (errorPagar) throw errorPagar;

      // Busca contas correntes e seus saldos iniciais
      const { data: contasCorrentes, error: errorContas } = await supabase
        .from('contas_correntes')
        .select('*')
        .eq('status', 'ativo');
      
      if (errorContas) throw errorContas;

      // Calcula o saldo total
      let totalSaldo = 0;

      if (contasCorrentes && contasCorrentes.length > 0) {
        // Para cada conta, buscar TODAS as movimentações ordenadas por data
        for (const conta of contasCorrentes) {
          const { data: movimentacoes, error: erroMovimentacoes } = await supabase
            .from('fluxo_caixa')
            .select('*')
            .eq('conta_corrente_id', conta.id)
            .order('data_movimentacao', { ascending: true });

          if (erroMovimentacoes) throw erroMovimentacoes;

          // Calcular o saldo como na página de fluxo de caixa
          let saldoAtual = Number(conta.saldo_inicial || 0);

          if (movimentacoes && movimentacoes.length > 0) {
            // Somar todas as movimentações ordenadas cronologicamente
            for (const mov of movimentacoes) {
              saldoAtual += Number(mov.valor);
            }
          }

          totalSaldo += saldoAtual;
        }
      }
      
      // Busca fluxo financeiro dos últimos 12 meses
      const dataAtual = new Date();
      const anoAtual = dataAtual.getFullYear();
      const mesAtual = dataAtual.getMonth() + 1;
      
      // Data de 11 meses atrás (para compor 12 meses com o mês atual)
      const dataInicial = new Date(dataAtual);
      dataInicial.setMonth(dataInicial.getMonth() - 11);
      dataInicial.setDate(1);
      const anoInicial = dataInicial.getFullYear();
      const mesInicial = dataInicial.getMonth() + 1;
      
      // Formatar datas para o formato YYYY-MM-DD
      const dataInicialStr = `${anoInicial}-${mesInicial.toString().padStart(2, '0')}-01`;
      
      // Buscar dados de movimentações pagas/recebidas agrupadas por mês de TODAS as contas
      // Modificado para não filtrar por conta_corrente_id
      const { data: fluxoMensal, error: errorFluxoMensal } = await supabase
        .from('movimentacoes_parcelas')
        .select(`
          id,
          valor,
          data_pagamento,
          movimentacoes:movimentacao_id (
            tipo_operacao
          )
        `)
        .not('data_pagamento', 'is', null)
        .gte('data_pagamento', dataInicialStr);
      
      if (errorFluxoMensal) throw errorFluxoMensal;

      // Processar dados
      const dataAtualStr = new Date().toISOString().split('T')[0];
      
      // Filtrar corretamente as parcelas de contas a receber
      const parcelasReceberFiltradas = (parcelasReceber || []).filter(p => 
        p.movimentacoes?.tipo_operacao === 'receber'
      );
      
      // Filtrar corretamente as parcelas de contas a pagar
      const parcelasPagarFiltradas = (parcelasPagar || []).filter(p => 
        p.movimentacoes?.tipo_operacao === 'pagar'
      );
      
      // Total a receber
      const totalAReceber = parcelasReceberFiltradas
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Total a pagar
      const totalAPagar = parcelasPagarFiltradas
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas vencidas a receber
      const contasVencidasReceber = parcelasReceberFiltradas
        .filter(p => p.data_vencimento < dataAtualStr)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas vencidas a pagar
      const contasVencidasPagar = parcelasPagarFiltradas
        .filter(p => p.data_vencimento < dataAtualStr)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas a vencer a receber
      const contasAVencerReceber = parcelasReceberFiltradas
        .filter(p => p.data_vencimento >= dataAtualStr)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas a vencer a pagar
      const contasAVencerPagar = parcelasPagarFiltradas
        .filter(p => p.data_vencimento >= dataAtualStr)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Processar o fluxo financeiro mensal - considerando todas as contas
      const mesesMap = new Map<string, FluxoMensal>();
      
      // Inicializar os 12 meses
      for (let i = 0; i < 12; i++) {
        const data = new Date(dataInicial);
        data.setMonth(data.getMonth() + i);
        const ano = data.getFullYear();
        const mesNumero = data.getMonth() + 1;
        
        // Nome do mês em português
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const mes = nomesMeses[data.getMonth()];
        
        const chave = `${ano}-${mesNumero}`;
        mesesMap.set(chave, {
          mes,
          mes_numero: mesNumero,
          ano,
          total_recebido: 0,
          total_pago: 0,
          saldo: 0
        });
      }
      
      // Adicionar os valores de cada movimentação ao mês correspondente independente da conta
      fluxoMensal?.forEach(item => {
        if (item.data_pagamento && item.movimentacoes?.tipo_operacao) {
          const dataPagamento = new Date(item.data_pagamento);
          const ano = dataPagamento.getFullYear();
          const mesNumero = dataPagamento.getMonth() + 1;
          const chave = `${ano}-${mesNumero}`;
          
          if (mesesMap.has(chave)) {
            const mesAtual = mesesMap.get(chave)!;
            
            if (item.movimentacoes.tipo_operacao === 'receber') {
              mesAtual.total_recebido += Number(item.valor || 0);
            } else if (item.movimentacoes.tipo_operacao === 'pagar') {
              mesAtual.total_pago += Number(item.valor || 0);
            }
            
            mesAtual.saldo = mesAtual.total_recebido - mesAtual.total_pago;
            mesesMap.set(chave, mesAtual);
          }
        }
      });
      
      // Converter o Map para um array e ordenar por ano e mês - ordem decrescente (mais recente primeiro)
      const fluxoPorMes = Array.from(mesesMap.values())
        .sort((a, b) => {
          if (a.ano !== b.ano) return b.ano - a.ano; // Ano mais recente primeiro
          return b.mes_numero - a.mes_numero; // Mês mais recente primeiro
        });
      
      setDadosFinanceiros({
        total_a_receber: totalAReceber,
        total_a_pagar: totalAPagar,
        saldo_contas: totalSaldo,
        previsao_saldo: totalSaldo + totalAReceber - totalAPagar,
        contas_vencidas_receber: contasVencidasReceber,
        contas_vencidas_pagar: contasVencidasPagar,
        contas_a_vencer_receber: contasAVencerReceber,
        contas_a_vencer_pagar: contasAVencerPagar,
        fluxo_por_mes: fluxoPorMes
      });
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao carregar dados do painel financeiro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    dadosFinanceiros,
    fetchDadosFinanceiros
  };
};
