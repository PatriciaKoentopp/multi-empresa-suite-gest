
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { LancamentoContabil, Movimentacao, MovimentacaoParcela } from '@/types/movimentacoes';

export function useLancamentosContabeis() {
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [planosContas, setPlanosContas] = useState<{id: string; codigo: string; descricao: string; tipo: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentCompany } = useCompany();

  // Função para carregar o plano de contas
  async function carregarPlanosContas() {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, codigo, descricao, tipo")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("codigo", { ascending: true });
        
      if (error) throw error;
      
      setPlanosContas(data || []);
    } catch (error) {
      console.error("Erro ao carregar planos de contas:", error);
      toast.error("Erro ao carregar planos de contas");
    }
  }
  
  // Função para processar movimentações e gerar lançamentos contábeis
  function processarMovimentacoesParaLancamentos(
    movimentacoes: Movimentacao[], 
    parcelas: MovimentacaoParcela[],
    contas: {id: string; codigo: string; descricao: string; tipo: string}[]
  ): LancamentoContabil[] {
    const lancamentosGerados: LancamentoContabil[] = [];
    
    // Mapear planos de contas por id para fácil acesso
    const contasMap = new Map();
    contas.forEach(conta => {
      contasMap.set(conta.id, conta);
    });
    
    // Gerar lançamentos baseados em movimentações
    movimentacoes.forEach(mov => {
      // Skip se não tem conta origem ou destino (no caso de transferências)
      // ou categoria_id (no caso de pagamentos e recebimentos)
      if (mov.tipo_operacao === 'transferencia' && (!mov.conta_origem_id || !mov.conta_destino_id)) {
        return;
      } else if ((mov.tipo_operacao === 'pagar' || mov.tipo_operacao === 'receber') && !mov.categoria_id) {
        return;
      }
      
      // Formatando data
      const dataFormatada = new Date(mov.data_lancamento).toISOString().split('T')[0];
      const historico = mov.descricao || (mov.tipo_operacao === 'transferencia' ? 'Transferência entre contas' : 
        mov.tipo_operacao === 'pagar' ? 'Pagamento' : 'Recebimento');
      
      // Lançamento para pagamentos
      if (mov.tipo_operacao === 'pagar') {
        const contaDespesa = contasMap.get(mov.categoria_id);
        
        if (!contaDespesa) return; // Skip se não encontrar a conta
        
        // Parcela de lançamento de despesa
        const lancamentoDespesa: LancamentoContabil = {
          id: `${mov.id}_despesa`,
          data: dataFormatada,
          historico: historico,
          conta: mov.categoria_id || '',
          conta_nome: contaDespesa?.descricao || '',
          conta_codigo: contaDespesa?.codigo || '',
          tipo: 'debito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        // Contrapartida (crédito em conta bancária ou a pagar)
        const lancamentoContrapartida: LancamentoContabil = {
          id: `${mov.id}_contrapartida`,
          data: dataFormatada,
          historico: historico,
          conta: 'passivo', // Representativo
          conta_nome: 'Contas a Pagar',
          conta_codigo: '2.01.01', // Código representativo
          tipo: 'credito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoDespesa, lancamentoContrapartida);
      }
      // Lançamento para recebimentos
      else if (mov.tipo_operacao === 'receber') {
        const contaReceita = contasMap.get(mov.categoria_id);
        
        if (!contaReceita) return; // Skip se não encontrar a conta
        
        // Receita (crédito)
        const lancamentoReceita: LancamentoContabil = {
          id: `${mov.id}_receita`,
          data: dataFormatada,
          historico: historico,
          conta: mov.categoria_id || '',
          conta_nome: contaReceita?.descricao || '',
          conta_codigo: contaReceita?.codigo || '',
          tipo: 'credito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        // Contrapartida (débito em conta bancária ou a receber)
        const lancamentoContrapartida: LancamentoContabil = {
          id: `${mov.id}_contrapartida`,
          data: dataFormatada,
          historico: historico,
          conta: 'ativo', // Representativo
          conta_nome: 'Contas a Receber',
          conta_codigo: '1.02.01', // Código representativo
          tipo: 'debito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoReceita, lancamentoContrapartida);
      }
      // Lançamento para transferências
      else if (mov.tipo_operacao === 'transferencia') {
        const contaOrigem = contasMap.get(mov.conta_origem_id);
        const contaDestino = contasMap.get(mov.conta_destino_id);
        
        if (!contaOrigem || !contaDestino) return; // Skip se não encontrar alguma das contas
        
        // Débito na conta de destino
        const lancamentoDebito: LancamentoContabil = {
          id: `${mov.id}_debito`,
          data: dataFormatada,
          historico: historico,
          conta: mov.conta_destino_id || '',
          conta_nome: contaDestino?.descricao || '',
          conta_codigo: contaDestino?.codigo || '',
          tipo: 'debito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        // Crédito na conta de origem
        const lancamentoCredito: LancamentoContabil = {
          id: `${mov.id}_credito`,
          data: dataFormatada,
          historico: historico,
          conta: mov.conta_origem_id || '',
          conta_nome: contaOrigem?.descricao || '',
          conta_codigo: contaOrigem?.codigo || '',
          tipo: 'credito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoDebito, lancamentoCredito);
      }
    });
    
    // Também poderíamos processar parcelas aqui para lançamentos mais detalhados
    // mas por simplicidade, vamos manter apenas os lançamentos principais
    
    return lancamentosGerados;
  }
  
  // Calcular saldos para cada conta
  function calcularSaldos(lancamentos: LancamentoContabil[]): LancamentoContabil[] {
    const saldosPorConta: {[contaId: string]: number} = {};
    
    // Ordenar por data para calcular saldo progressivamente
    const lancamentosOrdenados = [...lancamentos].sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    
    return lancamentosOrdenados.map(lancamento => {
      if (!saldosPorConta[lancamento.conta]) {
        saldosPorConta[lancamento.conta] = 0;
      }
      
      // Atualizar saldo conforme tipo de lançamento
      if (lancamento.tipo === 'debito') {
        saldosPorConta[lancamento.conta] -= lancamento.valor;
      } else {
        saldosPorConta[lancamento.conta] += lancamento.valor;
      }
      
      return {
        ...lancamento,
        saldo: saldosPorConta[lancamento.conta]
      };
    });
  }

  // Função principal para carregar todos os dados
  async function carregarDados() {
    if (!currentCompany?.id) return;
    
    setIsLoading(true);
    
    try {
      // 1. Carregar planos de contas
      await carregarPlanosContas();
      
      // 2. Carregar movimentações
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("empresa_id", currentCompany.id);
        
      if (movError) throw movError;
      
      // 3. Carregar parcelas (opcional para versão inicial)
      const { data: parcelas, error: parcError } = await supabase
        .from("movimentacoes_parcelas")
        .select("*")
        .in("movimentacao_id", movimentacoes.map(m => m.id));
        
      if (parcError) throw parcError;
      
      // 4. Processar dados para gerar lançamentos contábeis
      const lancamentosProcessados = processarMovimentacoesParaLancamentos(
        movimentacoes || [], 
        parcelas || [],
        planosContas
      );
      
      // 5. Calcular saldos para cada conta
      const lancamentosComSaldo = calcularSaldos(lancamentosProcessados);
      
      setLancamentos(lancamentosComSaldo);
    } catch (error) {
      console.error("Erro ao carregar dados contábeis:", error);
      toast.error("Erro ao carregar dados contábeis");
    } finally {
      setIsLoading(false);
    }
  }

  // Carregar dados quando o componente montar
  useEffect(() => {
    if (currentCompany?.id) {
      carregarDados();
    }
  }, [currentCompany?.id]);

  // Função para adicionar um novo lançamento
  async function adicionarLancamento(dados: { data: string; historico: string; debito: string; credito: string; valor: number }) {
    if (!currentCompany?.id) return;

    try {
      // 1. Obter contas do débito e crédito
      const contaDebito = planosContas.find(c => c.id === dados.debito);
      const contaCredito = planosContas.find(c => c.id === dados.credito);
      
      if (!contaDebito || !contaCredito) {
        toast.error("Contas contábeis não encontradas");
        return;
      }
      
      // 2. Criar dois lançamentos: Débito e Crédito
      const novoLancamentoDebito: LancamentoContabil = {
        id: `novo_${Date.now()}_d`,
        data: dados.data,
        historico: dados.historico,
        conta: dados.debito,
        conta_nome: contaDebito.descricao,
        conta_codigo: contaDebito.codigo,
        tipo: 'debito',
        valor: dados.valor,
        saldo: 0 // Será recalculado
      };
      
      const novoLancamentoCredito: LancamentoContabil = {
        id: `novo_${Date.now()}_c`,
        data: dados.data,
        historico: dados.historico,
        conta: dados.credito,
        conta_nome: contaCredito.descricao,
        conta_codigo: contaCredito.codigo,
        tipo: 'credito',
        valor: dados.valor,
        saldo: 0 // Será recalculado
      };
      
      // 3. Adicionar aos lançamentos existentes e recalcular saldos
      const novosLancamentos = [...lancamentos, novoLancamentoDebito, novoLancamentoCredito];
      const lancamentosComSaldo = calcularSaldos(novosLancamentos);
      
      setLancamentos(lancamentosComSaldo);
      
      toast.success("Lançamento adicionado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao adicionar lançamento:", error);
      toast.error("Erro ao adicionar lançamento");
      return false;
    }
  }

  // Função para excluir um lançamento
  async function excluirLancamento(id: string) {
    try {
      // Remover o par de lançamentos (débito e crédito)
      const idBase = id.split('_').slice(0, -1).join('_');
      const lancamentosFiltrados = lancamentos.filter(l => !l.id.startsWith(idBase));
      
      // Recalcular saldos
      const lancamentosComSaldo = calcularSaldos(lancamentosFiltrados);
      
      setLancamentos(lancamentosComSaldo);
      toast.success("Lançamento excluído com sucesso");
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast.error("Erro ao excluir lançamento");
    }
  }

  return {
    lancamentos,
    planosContas,
    isLoading,
    carregarDados,
    adicionarLancamento,
    excluirLancamento
  };
}
