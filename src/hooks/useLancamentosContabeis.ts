
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { ContaContabil, LancamentoContabil } from "@/types/lancamentos-contabeis";

export const useLancamentosContabeis = () => {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(true);
  const [contasContabeis, setContasContabeis] = useState<ContaContabil[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);

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
        tipo: conta.tipo as "ativo" | "passivo" | "receita" | "despesa" | "patrimonio",
        categoria: conta.categoria as "título" | "movimentação",
        considerar_dre: conta.considerar_dre || false,
        classificacao_dre: conta.classificacao_dre || 'nao_classificado',
        status: conta.status,
        created_at: conta.created_at,
        updated_at: conta.updated_at,
        empresa_id: conta.empresa_id
      }));

      setContasContabeis(contasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar contas contábeis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas contábeis",
        variant: "destructive",
      });
    }
  };

  const fetchLancamentos = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data: lancamentosData, error } = await supabase
        .from('lancamentos_contabeis')
        .select(`
          id,
          data,
          conta_debito_id,
          conta_credito_id,
          valor,
          historico,
          created_at,
          updated_at,
          empresa_id
        `)
        .eq('empresa_id', currentCompany.id)
        .order('data', { ascending: false });

      if (error) throw error;

      // Buscar dados das contas para enriquecer os lançamentos
      const { data: contasData } = await supabase
        .from('plano_contas')
        .select('id, codigo, descricao')
        .eq('empresa_id', currentCompany.id);

      const contasMap = new Map(contasData?.map(conta => [conta.id, conta]) || []);

      const lancamentosFormatados: LancamentoContabil[] = (lancamentosData || []).map(lancamento => {
        const contaDebito = contasMap.get(lancamento.conta_debito_id);
        const contaCredito = contasMap.get(lancamento.conta_credito_id);

        return {
          id: lancamento.id,
          data: lancamento.data,
          conta_debito_id: lancamento.conta_debito_id,
          conta_credito_id: lancamento.conta_credito_id,
          valor: Number(lancamento.valor),
          historico: lancamento.historico,
          created_at: lancamento.created_at,
          updated_at: lancamento.updated_at,
          empresa_id: lancamento.empresa_id,
          tipo_lancamento: 'principal',
          conta_codigo: contaDebito?.codigo || '',
          conta_nome: contaDebito?.descricao || '',
          tipo: 'debito',
          saldo: 0
        };
      });

      setLancamentos(lancamentosFormatados);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos contábeis",
        variant: "destructive",
      });
    }
  };

  const criarLancamento = async (data: {
    data: string;
    conta_debito_id: string;
    conta_credito_id: string;
    valor: number;
    historico: string;
  }) => {
    if (!currentCompany?.id) {
      toast({
        title: "Erro",
        description: "Nenhuma empresa selecionada",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('lancamentos_contabeis')
        .insert({
          ...data,
          empresa_id: currentCompany.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lançamento criado com sucesso",
      });

      await fetchLancamentos();
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar lançamento",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentCompany?.id) {
      fetchContasContabeis();
      fetchLancamentos();
    }
    setIsLoading(false);
  }, [currentCompany?.id]);

  return {
    isLoading,
    contasContabeis,
    lancamentos,
    criarLancamento,
    fetchLancamentos,
    fetchContasContabeis
  };
};
