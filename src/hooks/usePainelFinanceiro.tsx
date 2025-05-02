
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

      // Busca saldo inicial das contas correntes
      const { data: contasCorrentes, error: errorContas } = await supabase
        .from('contas_correntes')
        .select('id, saldo_inicial')
        .eq('status', 'ativo');
      
      if (errorContas) throw errorContas;
      
      // Busca dados do fluxo de caixa para calcular o saldo atual
      const { data: fluxoCaixa, error: errorFluxo } = await supabase
        .from('fluxo_caixa')
        .select('id, valor, tipo_operacao');
      
      if (errorFluxo) throw errorFluxo;
      
      // Calcula o saldo das contas considerando o saldo inicial e as movimentações do fluxo de caixa
      let saldoInicial = contasCorrentes?.reduce((sum, conta) => 
        sum + Number(conta.saldo_inicial || 0), 0) || 0;
      
      let saldoMovimentacoes = 0;
      if (fluxoCaixa && fluxoCaixa.length > 0) {
        saldoMovimentacoes = fluxoCaixa.reduce((sum, movimento) => {
          if (movimento.tipo_operacao === 'receber') {
            return sum + Number(movimento.valor || 0);
          } else if (movimento.tipo_operacao === 'pagar') {
            return sum - Number(movimento.valor || 0);
          } else if (movimento.tipo_operacao === 'transferencia') {
            // Transferências não afetam o saldo total
            return sum;
          }
          return sum;
        }, 0);
      }
      
      // Saldo final é o saldo inicial mais as movimentações
      const saldoContas = saldoInicial + saldoMovimentacoes;

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
      
      // Buscar dados de movimentações pagas/recebidas agrupadas por mês
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
      const totalAReceber = parcelasReceber
        ?.filter(p => p.movimentacoes?.tipo_operacao === 'receber')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
      
      const totalAPagar = parcelasPagar
        ?.filter(p => p.movimentacoes?.tipo_operacao === 'pagar')
        .reduce((sum, item) => sum + Number(item.valor || 0), 0) || 0;
      
      const dataAtualStr = new Date().toISOString().split('T')[0];
      
      const contasVencidas = [
        ...(parcelasReceber || []).filter(p => p.data_vencimento < dataAtualStr),
        ...(parcelasPagar || []).filter(p => p.data_vencimento < dataAtualStr)
      ].reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      const contasAVencer = [
        ...(parcelasReceber || []).filter(p => p.data_vencimento >= dataAtualStr),
        ...(parcelasPagar || []).filter(p => p.data_vencimento >= dataAtualStr)
      ].reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Processar o fluxo financeiro mensal
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
      
      // Adicionar os valores de cada movimentação ao mês correspondente
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
      
      // Converter o Map para um array e ordenar por ano e mês
      const fluxoPorMes = Array.from(mesesMap.values())
        .sort((a, b) => {
          if (a.ano !== b.ano) return a.ano - b.ano;
          return a.mes_numero - b.mes_numero;
        });
      
      setDadosFinanceiros({
        total_a_receber: totalAReceber,
        total_a_pagar: totalAPagar,
        saldo_contas: saldoContas,
        previsao_saldo: saldoContas + totalAReceber - totalAPagar,
        contas_vencidas: contasVencidas,
        contas_a_vencer: contasAVencer,
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
