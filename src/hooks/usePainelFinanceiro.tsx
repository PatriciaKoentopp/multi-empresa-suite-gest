import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/company-context';
import { FiltroFluxoCaixa, FluxoCaixaItem, FluxoCaixaSaldo } from '@/types/financeiro';

export function usePainelFinanceiro() {
  const { currentCompany } = useCompany();
  
  const [filtro, setFiltro] = useState<FiltroFluxoCaixa>({
    dataInicio: new Date(),
    dataFim: new Date(),
    conta_corrente_id: null,
    situacao: null,
  });

  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem[]>([]);
  const [saldos, setSaldos] = useState<FluxoCaixaSaldo>({
    saldoAnterior: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    saldoFinal: 0,
  });
  const [contasCorrente, setContasCorrente] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatarData = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const calcularSaldos = (fluxo: FluxoCaixaItem[]): FluxoCaixaSaldo => {
    let saldoAnterior = 0;
    let totalEntradas = 0;
    let totalSaidas = 0;
    let saldoFinal = 0;

    fluxo.forEach(item => {
      if (item.tipo === 'entrada') {
        totalEntradas += item.valor;
      } else {
        totalSaidas += item.valor;
      }
    });

    saldoFinal = saldoAnterior + totalEntradas - totalSaidas;

    return {
      saldoAnterior,
      totalEntradas,
      totalSaidas,
      saldoFinal,
    };
  };

  const carregarFluxoCaixa = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data: fluxoData, error } = await supabase
        .from('fluxo_caixa')
        .select(`
          *,
          conta_corrente:contas_correntes(nome),
          favorecido:favorecidos(nome)
        `)
        .eq('empresa_id', currentCompany.id)
        .gte('data_movimentacao', filtro.dataInicio.toISOString().split('T')[0])
        .lte('data_movimentacao', filtro.dataFim.toISOString().split('T')[0])
        .order('data_movimentacao', { ascending: false });

      if (error) throw error;

      const fluxoFormatado: FluxoCaixaItem[] = (fluxoData || []).map(item => ({
        id: item.id,
        data: new Date(item.data_movimentacao),
        descricao: item.descricao || '',
        conta_nome: item.conta_corrente?.nome || 'N/A',
        conta_id: item.conta_corrente_id || '',
        valor: item.valor,
        tipo: item.tipo_operacao === 'entrada' ? 'entrada' : 'saida',
        favorecido: (item.favorecido as any)?.nome || 'N/A',
        origem: item.origem,
        situacao: item.situacao
      }));

      setFluxoCaixa(fluxoFormatado);
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarContasCorrente = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('contas_correntes')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;

      setContasCorrente(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas correntes:', error);
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      carregarFluxoCaixa();
      carregarContasCorrente();
    }
  }, [currentCompany?.id, filtro]);

  useEffect(() => {
    setSaldos(calcularSaldos(fluxoCaixa));
  }, [fluxoCaixa]);

  return {
    filtro,
    setFiltro,
    fluxoCaixa,
    saldos,
    contasCorrente,
    isLoading,
    carregarFluxoCaixa,
  };
}
