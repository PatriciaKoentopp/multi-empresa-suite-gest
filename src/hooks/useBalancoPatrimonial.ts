import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContaContabil, LancamentoContabil } from '@/types/lancamentos-contabeis';
import { useCompany } from '@/contexts/company-context';
import { toast } from 'sonner';

interface SaldoConta {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  saldo: number;
}

export const useBalancoPatrimonial = (dataInicio: string, dataFim: string) => {
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [saldos, setSaldos] = useState<SaldoConta[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentCompany } = useCompany();

  const fetchContas = useCallback(async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contas_contabeis')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) {
        console.error("Erro ao buscar contas contábeis:", error);
        toast.error("Erro ao buscar contas contábeis.");
        return;
      }

      if (data) {
        setContas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar contas contábeis:", error);
      toast.error("Erro ao buscar contas contábeis.");
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  const fetchLancamentos = useCallback(async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (error) {
        console.error("Erro ao buscar lançamentos contábeis:", error);
        toast.error("Erro ao buscar lançamentos contábeis.");
        return;
      }

      if (data) {
        setLancamentos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar lançamentos contábeis:", error);
      toast.error("Erro ao buscar lançamentos contábeis.");
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    fetchContas();
    fetchLancamentos();
  }, [fetchContas, fetchLancamentos]);

  const formatarData = (data: string | Date): string => {
    if (typeof data === 'string') return data;
    return data.toISOString().split('T')[0];
  };

  const processarLancamentos = useCallback(() => {
    if (!lancamentos.length || !contas.length) return;

    const lancamentosFiltrados = lancamentos.filter(lancamento => {
      const dataLancamento = formatarData(lancamento.data);
      return dataLancamento >= dataInicio && dataLancamento <= dataFim;
    });

    const saldosIniciais: SaldoConta[] = contas.map(conta => ({
      id: conta.id,
      codigo: conta.codigo,
      descricao: conta.descricao,
      tipo: conta.tipo,
      categoria: conta.categoria,
      saldo: 0
    }));

    setSaldos(saldosIniciais);

    const adicionarSaldo = (conta: SaldoConta, valor: number, isDebito: boolean) => {
      setSaldos(prevSaldos => {
        return prevSaldos.map(saldo => {
          if (saldo.id === conta.id) {
            const novoSaldo = isDebito ? saldo.saldo + valor : saldo.saldo - valor;
            return { ...saldo, saldo: novoSaldo };
          }
          return saldo;
        });
      });
    };

    lancamentosFiltrados.forEach(lancamento => {
      const contaDebito = contas.find(conta => conta.id === lancamento.conta_debito_id);
      const contaCredito = contas.find(conta => conta.id === lancamento.conta_credito_id);
      
      if (contaDebito) {
        adicionarSaldo(contaDebito as any, lancamento.valor, true);
      }
      
      if (contaCredito) {
        adicionarSaldo(contaCredito as any, lancamento.valor, false);
      }
    });

  }, [lancamentos, contas, dataInicio, dataFim]);

  useEffect(() => {
    processarLancamentos();
  }, [processarLancamentos]);

  return { saldos, loading };
};
