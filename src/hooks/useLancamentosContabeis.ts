
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LancamentoContabil, PlanoContas } from '@/types/lancamentos-contabeis';
import { useCompany } from '@/contexts/company-context';
import { toast } from '@/hooks/use-toast';

export function useLancamentosContabeis() {
  const { currentCompany } = useCompany();
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [contasDebito, setContasDebito] = useState<PlanoContas[]>([]);
  const [contasCredito, setContasCredito] = useState<PlanoContas[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const carregarContas = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('status', 'ativo')
        .order('codigo');

      if (error) throw error;

      const contasFormatadas = (data || []).map(conta => ({
        id: conta.id,
        codigo: conta.codigo,
        descricao: conta.descricao,
        tipo: conta.tipo,
        categoria: conta.categoria,
        considerar_dre: conta.considerar_dre,
        classificacao_dre: conta.classificacao_dre || 'nao_classificado',
        status: conta.status,
        empresa_id: conta.empresa_id,
        created_at: conta.created_at,
        updated_at: conta.updated_at
      }));

      setContasDebito(contasFormatadas);
      setContasCredito(contasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro ao carregar contas",
        description: "Não foi possível carregar as contas do plano de contas",
        variant: "destructive",
      });
    }
  };

  const carregarLancamentos = async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .select(`
          *,
          conta_debito:plano_contas!lancamentos_contabeis_conta_debito_id_fkey(codigo, descricao),
          conta_credito:plano_contas!lancamentos_contabeis_conta_credito_id_fkey(codigo, descricao)
        `)
        .eq('empresa_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const lancamentosFormatados = (data || []).map(lancamento => ({
        ...lancamento,
        data: lancamento.data,
        created_at: lancamento.created_at,
        updated_at: lancamento.updated_at
      }));

      setLancamentos(lancamentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      toast({
        title: "Erro ao carregar lançamentos",
        description: "Não foi possível carregar os lançamentos contábeis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const criarLancamento = async (dados: Omit<LancamentoContabil, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>) => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .insert({
          ...dados,
          empresa_id: currentCompany.id,
        })
        .select()
        .single();

      if (error) throw error;

      const novoLancamento = {
        ...data,
        data: data.data,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setLancamentos(prev => [novoLancamento, ...prev]);
      
      toast({
        title: "Lançamento criado",
        description: "O lançamento contábil foi criado com sucesso",
      });

      return novoLancamento;
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      toast({
        title: "Erro ao criar lançamento",
        description: "Não foi possível criar o lançamento contábil",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      carregarContas();
      carregarLancamentos();
    }
  }, [currentCompany?.id]);

  return {
    lancamentos,
    contasDebito,
    contasCredito,
    isLoading,
    criarLancamento,
    recarregarLancamentos: carregarLancamentos,
  };
}
