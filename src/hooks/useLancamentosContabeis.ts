
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
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

interface LancamentoContabil {
  id: string;
  data: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number;
  historico: string;
  created_at: string;
  updated_at: string;
  empresa_id: string;
}

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
        tipo: conta.tipo,
        categoria: conta.categoria,
        considerar_dre: conta.considerar_dre || false,
        classificacao_dre: conta.classificacao_dre || 'nao_classificado',
        status: conta.status
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

      const lancamentosFormatados: LancamentoContabil[] = (lancamentosData || []).map(lancamento => ({
        id: lancamento.id,
        data: lancamento.data,
        conta_debito_id: lancamento.conta_debito_id,
        conta_credito_id: lancamento.conta_credito_id,
        valor: Number(lancamento.valor),
        historico: lancamento.historico,
        created_at: lancamento.created_at,
        updated_at: lancamento.updated_at,
        empresa_id: lancamento.empresa_id
      }));

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
