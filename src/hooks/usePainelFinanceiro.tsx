
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DadosFinanceiros, FluxoMensal, FiltroFluxoCaixa, FluxoCaixaItem } from "@/types/financeiro";
import { startOfMonth, subDays } from "date-fns";

export const usePainelFinanceiro = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dadosFinanceiros, setDadosFinanceiros] = useState<DadosFinanceiros | null>(null);
  const [filtroFluxoCaixa, setFiltroFluxoCaixa] = useState<FiltroFluxoCaixa>({
    dataInicio: subDays(new Date(), 30),
    dataFim: new Date(),
    contaId: null,
  });
  const [saldoInicialPeriodo, setSaldoInicialPeriodo] = useState<number>(0);
  
  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  // Função para extrair data sem timezone
  function extrairDataSemTimeZone(dataStr: string): Date {
    if (!dataStr) return new Date(0); // Data inválida para comparações
    
    // Se a data já estiver no formato YYYY-MM-DD
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dataStr.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    
    // Caso esteja em outro formato, tenta extrair a data ignorando a parte de hora
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      const ano = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1; // mês em JS é 0-indexed
      const dia = parseInt(partes[2], 10);
      return new Date(ano, mes, dia);
    }
    
    // Se não conseguiu extrair, retorna a data atual
    return new Date();
  }

  // Função para calcular o saldo inicial do período para o fluxo de caixa
  const calcularSaldoInicialPeriodo = async (filtro: FiltroFluxoCaixa) => {
    try {
      // Formatar as datas para o formato do Supabase (YYYY-MM-DD)
      const dataInicioStr = filtro.dataInicio.toISOString().split('T')[0];
      
      // Criar a query base para buscar movimentações anteriores ao período do filtro
      let query = supabase
        .from('fluxo_caixa')
        .select(`
          valor,
          tipo_operacao,
          conta_corrente_id
        `)
        .lt('data_movimentacao', dataInicioStr);
      
      // Adicionar filtro por conta corrente se especificado
      if (filtro.contaId) {
        query = query.eq('conta_corrente_id', filtro.contaId);
      }
      
      const { data: movimentacoesAnteriores, error } = await query;
      
      if (error) throw error;
      
      // Buscar saldo inicial das contas e considerar apenas as contas com considerar_saldo = true
      let queryContas = supabase
        .from('contas_correntes')
        .select('id, saldo_inicial, considerar_saldo')
        .eq('status', 'ativo');
      
      // Se houver filtro por conta, aplicar também aqui
      if (filtro.contaId) {
        queryContas = queryContas.eq('id', filtro.contaId);
      } else {
        // Quando não filtrar por conta específica, usar apenas contas com considerar_saldo = true
        queryContas = queryContas.eq('considerar_saldo', true);
      }
      
      const { data: contasCorrentes, error: errorContas } = await queryContas;
      
      if (errorContas) throw errorContas;
      
      // Calcular saldo inicial total das contas filtradas
      let saldoInicial = 0;
      
      if (contasCorrentes && contasCorrentes.length > 0) {
        if (filtro.contaId) {
          // Se tiver filtro de conta, considerar apenas o saldo inicial da conta específica
          const contaFiltrada = contasCorrentes.find(c => c.id === filtro.contaId);
          if (contaFiltrada) {
            saldoInicial = Number(contaFiltrada.saldo_inicial || 0);
          }
        } else {
          // Se não tiver filtro, somar o saldo inicial de todas as contas consideráveis
          saldoInicial = contasCorrentes.reduce((total, conta) => {
            return total + Number(conta.saldo_inicial || 0);
          }, 0);
        }
      }
      
      // Filtrar as movimentações para considerar apenas contas que devem entrar no cálculo
      if (movimentacoesAnteriores && movimentacoesAnteriores.length > 0) {
        // Se não há filtro de conta específica, precisamos verificar conta por conta
        if (!filtro.contaId) {
          // Criar um mapa das contas que devem ser consideradas no cálculo
          const contasConsideraveis = new Map();
          contasCorrentes.forEach(conta => {
            contasConsideraveis.set(conta.id, conta.considerar_saldo);
          });
          
          // Somar apenas as movimentações de contas que devem ser consideradas
          for (const mov of movimentacoesAnteriores) {
            // Verificar se a conta da movimentação deve ser considerada
            if (contasConsideraveis.get(mov.conta_corrente_id)) {
              saldoInicial += Number(mov.valor || 0);
            }
          }
        } else {
          // Se há filtro de conta específica, somar todas as movimentações dessa conta
          movimentacoesAnteriores.forEach(mov => {
            saldoInicial += Number(mov.valor || 0);
          });
        }
      }
      
      return saldoInicial;
    } catch (error) {
      console.error('Erro ao calcular saldo inicial:', error);
      return 0;
    }
  };

  const fetchFluxoCaixa = async (filtro: FiltroFluxoCaixa) => {
    try {
      // Formatar as datas para o formato do Supabase (YYYY-MM-DD)
      const dataInicioStr = filtro.dataInicio.toISOString().split('T')[0];
      const dataFimStr = filtro.dataFim.toISOString().split('T')[0];
      
      // Calcular o saldo inicial do período
      const saldoInicial = await calcularSaldoInicialPeriodo(filtro);
      setSaldoInicialPeriodo(saldoInicial);
      
      // Criar a query base
      let query = supabase
        .from('fluxo_caixa')
        .select(`
          id,
          data_movimentacao,
          descricao,
          valor,
          tipo_operacao,
          conta_corrente_id,
          contas_correntes:conta_corrente_id (
            id,
            nome,
            considerar_saldo
          )
        `)
        .gte('data_movimentacao', dataInicioStr)
        .lte('data_movimentacao', dataFimStr)
        .order('data_movimentacao', { ascending: true });
      
      // Adicionar filtro por conta corrente se especificado
      if (filtro.contaId) {
        query = query.eq('conta_corrente_id', filtro.contaId);
      }
      
      const { data: fluxoCaixaData, error } = await query;
      
      if (error) throw error;
      
      // Transformar os dados para o formato correto
      // Quando não tem filtro de conta específica, filtrar para considerar apenas contas com considerar_saldo = true
      const fluxoCaixa: FluxoCaixaItem[] = (fluxoCaixaData || [])
        .filter(item => filtro.contaId || item.contas_correntes?.considerar_saldo)
        .map(item => ({
          id: item.id,
          data: extrairDataSemTimeZone(item.data_movimentacao),
          descricao: item.descricao || '',
          conta_nome: item.contas_correntes?.nome || '',
          conta_id: item.conta_corrente_id,
          valor: Number(item.valor) || 0,
          tipo: item.tipo_operacao === 'receber' ? 'entrada' : 'saida',
        }));
      
      return fluxoCaixa;
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error);
      throw error;
    }
  };
  
  const fetchContas = async () => {
    try {
      // Buscar contas correntes com status ativo e incluindo o campo considerar_saldo
      const { data: contasCorrentes, error: errorContas } = await supabase
        .from('contas_correntes')
        .select('id, nome, saldo_inicial, status, considerar_saldo')
        .eq('status', 'ativo');
      
      if (errorContas) throw errorContas;
      
      let totalSaldo = 0;
      const contas = [];
      
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
          
          contas.push({
            id: conta.id,
            nome: conta.nome,
            saldo: saldoAtual,
            considerar_saldo: conta.considerar_saldo
          });

          // Adicionar ao total apenas se a conta deve ser considerada no saldo
          if (conta.considerar_saldo) {
            totalSaldo += saldoAtual;
          }
        }
      }
      
      return { contas, totalSaldo };
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw error;
    }
  };

  const fetchDadosFinanceiros = async () => {
    try {
      setIsLoading(true);
      
      // Buscar contas correntes e seus saldos iniciais
      const { contas, totalSaldo } = await fetchContas();
      
      // Buscar fluxo de caixa com os filtros atuais
      const fluxoCaixa = await fetchFluxoCaixa(filtroFluxoCaixa);
      
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
      
      // Busca fluxo financeiro de todos os períodos (sem limitar aos últimos 12 meses)
      // Buscar dados de movimentações pagas/recebidas agrupadas por mês de TODAS as contas
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
        .not('data_pagamento', 'is', null);
      
      if (errorFluxoMensal) throw errorFluxoMensal;

      // Processar dados - Garantir que trabalhamos com datas sem efeito de timezone
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataAtualStr = hoje.toISOString().split('T')[0];
      
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
      
      // Calcular contas vencidas a receber - uso do método correto de comparação de datas
      const contasVencidasReceber = parcelasReceberFiltradas
        .filter(p => {
          const dataVencimento = extrairDataSemTimeZone(p.data_vencimento);
          return dataVencimento < hoje;
        })
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas vencidas a pagar - uso do método correto de comparação de datas
      const contasVencidasPagar = parcelasPagarFiltradas
        .filter(p => {
          const dataVencimento = extrairDataSemTimeZone(p.data_vencimento);
          return dataVencimento < hoje;
        })
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas a vencer a receber - uso do método correto de comparação de datas
      const contasAVencerReceber = parcelasReceberFiltradas
        .filter(p => {
          const dataVencimento = extrairDataSemTimeZone(p.data_vencimento);
          return dataVencimento >= hoje;
        })
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Calcular contas a vencer a pagar - uso do método correto de comparação de datas
      const contasAVencerPagar = parcelasPagarFiltradas
        .filter(p => {
          const dataVencimento = extrairDataSemTimeZone(p.data_vencimento);
          return dataVencimento >= hoje;
        })
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      
      // Processar o fluxo financeiro mensal - considerando todas as contas
      const mesesMap = new Map<string, FluxoMensal>();
      
      // Processar todos os dados de movimentações para obter todos os períodos
      if (fluxoMensal && fluxoMensal.length > 0) {
        fluxoMensal.forEach(item => {
          if (item.data_pagamento && item.movimentacoes?.tipo_operacao) {
            // Extrai a data sem efeitos de timezone
            const dataPagamento = extrairDataSemTimeZone(item.data_pagamento);
            const ano = dataPagamento.getFullYear();
            const mesNumero = dataPagamento.getMonth() + 1;
            
            // Nome do mês em português
            const nomesMeses = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            const mes = nomesMeses[dataPagamento.getMonth()];
            
            const chave = `${ano}-${mesNumero}`;
            
            // Inicializar o mês se ainda não existir no Map
            if (!mesesMap.has(chave)) {
              mesesMap.set(chave, {
                mes,
                mes_numero: mesNumero,
                ano,
                total_recebido: 0,
                total_pago: 0,
                saldo: 0
              });
            }
            
            // Atualizar os valores
            const mesAtual = mesesMap.get(chave)!;
            
            if (item.movimentacoes.tipo_operacao === 'receber') {
              mesAtual.total_recebido += Number(item.valor || 0);
            } else if (item.movimentacoes.tipo_operacao === 'pagar') {
              mesAtual.total_pago += Number(item.valor || 0);
            }
            
            mesAtual.saldo = mesAtual.total_recebido - mesAtual.total_pago;
            mesesMap.set(chave, mesAtual);
          }
        });
      }
      
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
        fluxo_por_mes: fluxoPorMes,
        fluxo_caixa: fluxoCaixa,
        contas_correntes: contas
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
  
  const atualizarFiltroFluxoCaixa = async (novoFiltro: FiltroFluxoCaixa) => {
    setFiltroFluxoCaixa(novoFiltro);
    
    try {
      setIsLoading(true);
      const fluxoCaixa = await fetchFluxoCaixa(novoFiltro);
      
      if (dadosFinanceiros) {
        setDadosFinanceiros({
          ...dadosFinanceiros,
          fluxo_caixa: fluxoCaixa
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar fluxo de caixa:', error);
      toast({
        title: "Erro ao filtrar dados",
        description: "Ocorreu um erro ao aplicar os filtros no fluxo de caixa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    dadosFinanceiros,
    fetchDadosFinanceiros,
    filtroFluxoCaixa,
    atualizarFiltroFluxoCaixa,
    saldoInicialPeriodo
  };
};
