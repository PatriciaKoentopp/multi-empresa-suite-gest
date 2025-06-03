
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";

interface ContaContabil {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  considerar_dre: boolean;
  classificacao_dre: string;
  status: string;
}

interface SaldoConta {
  conta_id: string;
  saldo: number;
}

export const useBalancoPatrimonial = () => {
  const { currentCompany } = useCompany();
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [saldosContas, setSaldosContas] = useState<SaldoConta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContasContabeis = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data: contas, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('codigo');

      if (error) throw error;

      const contasFormatadas: ContaContabil[] = (contas || []).map(conta => ({
        id: conta.id,
        codigo: conta.codigo,
        descricao: conta.descricao,
        tipo: conta.tipo,
        categoria: conta.categoria,
        considerar_dre: conta.considerar_dre || false,
        classificacao_dre: conta.classificacao_dre || 'nao_classificado',
        status: conta.status
      }));

      setContasContabeis(contasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar contas contábeis:', error);
    }
  };

  const fetchSaldosContas = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos_contabeis')
        .select('conta_debito_id, conta_credito_id, valor')
        .eq('empresa_id', currentCompany.id);

      if (error) throw error;

      const saldos: { [key: string]: number } = {};

      (lancamentos || []).forEach(lancamento => {
        // Débito aumenta o saldo da conta de débito
        if (!saldos[lancamento.conta_debito_id]) {
          saldos[lancamento.conta_debito_id] = 0;
        }
        saldos[lancamento.conta_debito_id] += Number(lancamento.valor);

        // Crédito diminui o saldo da conta de crédito
        if (!saldos[lancamento.conta_credito_id]) {
          saldos[lancamento.conta_credito_id] = 0;
        }
        saldos[lancamento.conta_credito_id] -= Number(lancamento.valor);
      });

      const saldosArray: SaldoConta[] = Object.entries(saldos).map(([conta_id, saldo]) => ({
        conta_id,
        saldo
      }));

      setSaldosContas(saldosArray);
    } catch (error) {
      console.error('Erro ao calcular saldos:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchContasContabeis();
      await fetchSaldosContas();
      setIsLoading(false);
    };

    if (currentCompany?.id) {
      loadData();
    }
  }, [currentCompany?.id]);

  return {
    contasContabeis,
    saldosContas,
    isLoading,
    refetch: async () => {
      await fetchContasContabeis();
      await fetchSaldosContas();
    }
  };
};
