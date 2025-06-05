
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
      // 1. Buscar lançamentos manuais da tabela lancamentos_contabeis
      const { data: lancamentosManuais, error: errorManuais } = await supabase
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

      if (errorManuais) throw errorManuais;

      // 2. Buscar movimentações automáticas
      const { data: movimentacoes, error: errorMovimentacoes } = await supabase
        .from('movimentacoes')
        .select(`
          id,
          data_lancamento,
          descricao,
          valor,
          tipo_operacao,
          favorecido_id,
          created_at,
          updated_at,
          empresa_id,
          favorecido:favorecidos(nome)
        `)
        .eq('empresa_id', currentCompany.id)
        .not('data_lancamento', 'is', null)
        .order('data_lancamento', { ascending: false });

      if (errorMovimentacoes) throw errorMovimentacoes;

      // 3. Buscar dados das contas para enriquecer os lançamentos
      const { data: contasData } = await supabase
        .from('plano_contas')
        .select('id, codigo, descricao, tipo')
        .eq('empresa_id', currentCompany.id);

      const contasMap = new Map(contasData?.map(conta => [conta.id, conta]) || []);

      // 4. Processar lançamentos manuais
      const lancamentosManuaisFormatados: LancamentoContabil[] = (lancamentosManuais || []).map(lancamento => {
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

      // 5. Processar movimentações automáticas - criar lançamentos de débito e crédito
      const lancamentosAutomaticos: LancamentoContabil[] = [];
      
      (movimentacoes || []).forEach(mov => {
        // Determinar contas baseado no tipo de operação
        let contaDebito: any = null;
        let contaCredito: any = null;
        
        // Buscar contas padrão baseado no tipo de operação
        const contasArray = Array.from(contasMap.values());
        
        if (mov.tipo_operacao === 'recebimento') {
          // Débito: Caixa/Bancos, Crédito: Contas a Receber
          contaDebito = contasArray.find(c => c.tipo === 'ativo' && c.codigo?.includes('1.1'));
          contaCredito = contasArray.find(c => c.tipo === 'ativo' && c.codigo?.includes('1.2'));
        } else if (mov.tipo_operacao === 'pagamento') {
          // Débito: Contas a Pagar, Crédito: Caixa/Bancos
          contaDebito = contasArray.find(c => c.tipo === 'passivo' && c.codigo?.includes('2.1'));
          contaCredito = contasArray.find(c => c.tipo === 'ativo' && c.codigo?.includes('1.1'));
        } else if (mov.tipo_operacao === 'transferencia') {
          // Débito: Conta Destino, Crédito: Conta Origem
          contaDebito = contasArray.find(c => c.tipo === 'ativo' && c.codigo?.includes('1.1'));
          contaCredito = contasArray.find(c => c.tipo === 'ativo' && c.codigo?.includes('1.1'));
        }

        if (contaDebito && contaCredito) {
          // Criar lançamento de débito
          lancamentosAutomaticos.push({
            id: `${mov.id}_debito`,
            data: mov.data_lancamento,
            conta_debito_id: contaDebito.id,
            conta_credito_id: contaCredito.id,
            valor: Number(mov.valor),
            historico: `${mov.tipo_operacao.toUpperCase()}: ${mov.descricao}`,
            created_at: mov.created_at,
            updated_at: mov.updated_at,
            empresa_id: mov.empresa_id,
            movimentacao_id: mov.id,
            tipo_lancamento: 'principal',
            conta_codigo: contaDebito.codigo || '',
            conta_nome: contaDebito.descricao || '',
            favorecido: (mov.favorecido as any)?.nome || '',
            tipo: 'debito',
            saldo: 0
          });

          // Criar lançamento de crédito
          lancamentosAutomaticos.push({
            id: `${mov.id}_credito`,
            data: mov.data_lancamento,
            conta_debito_id: contaDebito.id,
            conta_credito_id: contaCredito.id,
            valor: Number(mov.valor),
            historico: `${mov.tipo_operacao.toUpperCase()}: ${mov.descricao}`,
            created_at: mov.created_at,
            updated_at: mov.updated_at,
            empresa_id: mov.empresa_id,
            movimentacao_id: mov.id,
            tipo_lancamento: 'principal',
            conta_codigo: contaCredito.codigo || '',
            conta_nome: contaCredito.descricao || '',
            favorecido: (mov.favorecido as any)?.nome || '',
            tipo: 'credito',
            saldo: 0
          });
        }
      });

      // 6. Combinar todos os lançamentos e ordenar por data
      const todosLancamentos = [...lancamentosManuaisFormatados, ...lancamentosAutomaticos]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setLancamentos(todosLancamentos);
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
