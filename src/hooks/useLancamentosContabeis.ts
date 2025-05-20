import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { LancamentoContabil, Movimentacao, MovimentacaoParcela } from '@/types/movimentacoes';
import { TipoTitulo } from '@/types/tipos-titulos';
import { ContaCorrente } from '@/types/conta-corrente';
import { PlanoConta } from '@/types/plano-contas';

export function useLancamentosContabeis() {
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([]);
  const [planosContas, setPlanosContas] = useState<PlanoConta[]>([]);
  const [tiposTitulos, setTiposTitulos] = useState<TipoTitulo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contasCorrentes, setContasCorrentes] = useState<{id: string; nome: string; conta_contabil_id: string}[]>([]);
  const { currentCompany } = useCompany();

  // Função para carregar o plano de contas
  async function carregarPlanosContas() {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("id, codigo, descricao, tipo, categoria, considerar_dre, classificacao_dre, status")
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
  
  // Função para carregar contas correntes
  async function carregarContasCorrentes() {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("contas_correntes")
        .select("id, nome, conta_contabil_id")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (error) throw error;
      
      setContasCorrentes(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas correntes:", error);
      toast.error("Erro ao carregar contas correntes");
    }
  }
  
  // Função para carregar tipos de títulos
  async function carregarTiposTitulos() {
    if (!currentCompany?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("tipos_titulos")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo");
        
      if (error) throw error;
      
      // Conversão explícita do tipo de dado
      const tiposTitulosFormatados: TipoTitulo[] = data?.map(tipo => ({
        ...tipo,
        tipo: tipo.tipo as "pagar" | "receber"
      })) || [];
      
      setTiposTitulos(tiposTitulosFormatados);
    } catch (error) {
      console.error("Erro ao carregar tipos de títulos:", error);
      toast.error("Erro ao carregar tipos de títulos");
    }
  }
  
  // Função para processar movimentações e gerar lançamentos contábeis
  function processarMovimentacoesParaLancamentos(
    movimentacoes: Movimentacao[], 
    parcelas: MovimentacaoParcela[],
    contas: PlanoConta[],
    tiposTitulos: TipoTitulo[],
    contasCorrentes: {id: string; nome: string; conta_contabil_id: string}[]
  ): LancamentoContabil[] {
    const lancamentosGerados: LancamentoContabil[] = [];
    
    // Mapear planos de contas por id para fácil acesso
    const contasMap = new Map();
    contas.forEach(conta => {
      contasMap.set(conta.id, conta);
    });
    
    // Mapear tipos de títulos por id para fácil acesso
    const tiposTitulosMap = new Map();
    tiposTitulos.forEach(tipo => {
      tiposTitulosMap.set(tipo.id, tipo);
    });
    
    // Mapear contas correntes por id para fácil acesso
    const contasCorrentesMap = new Map();
    contasCorrentes.forEach(conta => {
      contasCorrentesMap.set(conta.id, conta);
    });
    
    // Gerar lançamentos baseados em movimentações
    movimentacoes.forEach(mov => {
      // Verificar o tipo de operação (garantir que é um dos tipos válidos)
      const tipoOperacao = mov.tipo_operacao as "pagar" | "receber" | "transferencia";
      
      // Formatando data no formato PT-BR (DD/MM/YYYY)
      const dataFormatada = typeof mov.data_lancamento === 'string' 
        ? formatarDataPtBr(mov.data_lancamento)
        : formatarDataPtBr(new Date(mov.data_lancamento).toISOString().split('T')[0]);
      
      const historico = mov.descricao || (tipoOperacao === 'transferencia' ? 'Transferência entre contas' : 
        tipoOperacao === 'pagar' ? 'Pagamento' : 'Recebimento');
      
      // Lançamento para pagamentos
      if (tipoOperacao === 'pagar') {
        // Skip se não tem categoria_id
        if (!mov.categoria_id) {
          console.log(`Movimentação ${mov.id} do tipo 'pagar' sem categoria_id, skipping.`);
          return;
        }
        
        // Obter conta da despesa (débito)
        const contaDespesa = contasMap.get(mov.categoria_id);
        
        if (!contaDespesa) {
          console.log(`Conta de despesa não encontrada para categoria_id: ${mov.categoria_id}, skipping.`);
          return;
        }
        
        // Obter a conta contábil do tipo de título para a contrapartida
        let contaContrapartidaId = '';
        let contaContrapartidaNome = 'Contas a Pagar';
        let contaContrapartidaCodigo = '2.01.01'; // Código padrão caso não encontre o tipo título
        
        if (mov.tipo_titulo_id) {
          const tipoTitulo = tiposTitulosMap.get(mov.tipo_titulo_id);
          if (tipoTitulo && tipoTitulo.conta_contabil_id) {
            contaContrapartidaId = tipoTitulo.conta_contabil_id;
            const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
            if (contaContrapartida) {
              contaContrapartidaNome = contaContrapartida.descricao;
              contaContrapartidaCodigo = contaContrapartida.codigo;
            }
          }
        }
        
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
        
        // Contrapartida (crédito na conta definida pelo tipo título)
        const lancamentoContrapartida: LancamentoContabil = {
          id: `${mov.id}_contrapartida`,
          data: dataFormatada,
          historico: historico,
          conta: contaContrapartidaId || 'passivo',
          conta_nome: contaContrapartidaNome,
          conta_codigo: contaContrapartidaCodigo,
          tipo: 'credito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoDespesa, lancamentoContrapartida);
      }
      // Lançamento para recebimentos
      else if (tipoOperacao === 'receber') {
        // Skip se não tem categoria_id
        if (!mov.categoria_id) {
          console.log(`Movimentação ${mov.id} do tipo 'receber' sem categoria_id, skipping.`);
          return;
        }
        
        const contaReceita = contasMap.get(mov.categoria_id);
        
        if (!contaReceita) {
          console.log(`Conta de receita não encontrada para categoria_id: ${mov.categoria_id}, skipping.`);
          return;
        }
        
        // Obter a conta contábil do tipo de título para a contrapartida
        let contaContrapartidaId = '';
        let contaContrapartidaNome = 'Contas a Receber';
        let contaContrapartidaCodigo = '1.02.01'; // Código padrão caso não encontre o tipo título
        
        if (mov.tipo_titulo_id) {
          const tipoTitulo = tiposTitulosMap.get(mov.tipo_titulo_id);
          if (tipoTitulo && tipoTitulo.conta_contabil_id) {
            contaContrapartidaId = tipoTitulo.conta_contabil_id;
            const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
            if (contaContrapartida) {
              contaContrapartidaNome = contaContrapartida.descricao;
              contaContrapartidaCodigo = contaContrapartida.codigo;
            }
          }
        }
        
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
        
        // Contrapartida (débito na conta definida pelo tipo título)
        const lancamentoContrapartida: LancamentoContabil = {
          id: `${mov.id}_contrapartida`,
          data: dataFormatada,
          historico: historico,
          conta: contaContrapartidaId || 'ativo',
          conta_nome: contaContrapartidaNome,
          conta_codigo: contaContrapartidaCodigo,
          tipo: 'debito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoReceita, lancamentoContrapartida);
      }
      // Lançamento para transferências
      else if (tipoOperacao === 'transferencia') {
        // Skip se não tem conta origem ou destino
        if (!mov.conta_origem_id || !mov.conta_destino_id) {
          console.log(`Movimentação ${mov.id} do tipo 'transferencia' sem conta_origem_id ou conta_destino_id, skipping.`);
          return;
        }
        
        // Obter conta contábil da conta corrente origem
        const contaCorrenteOrigem = contasCorrentesMap.get(mov.conta_origem_id);
        if (!contaCorrenteOrigem || !contaCorrenteOrigem.conta_contabil_id) {
          console.log(`Conta corrente origem ${mov.conta_origem_id} sem conta_contabil_id, skipping.`);
          return;
        }
        
        // Obter conta contábil da conta corrente destino
        const contaCorrenteDestino = contasCorrentesMap.get(mov.conta_destino_id);
        if (!contaCorrenteDestino || !contaCorrenteDestino.conta_contabil_id) {
          console.log(`Conta corrente destino ${mov.conta_destino_id} sem conta_contabil_id, skipping.`);
          return;
        }
        
        // Obter detalhes das contas contábeis
        const contaContabilOrigem = contasMap.get(contaCorrenteOrigem.conta_contabil_id);
        const contaContabilDestino = contasMap.get(contaCorrenteDestino.conta_contabil_id);
        
        if (!contaContabilOrigem || !contaContabilDestino) {
          console.log(`Conta contábil não encontrada para origem ${contaCorrenteOrigem.conta_contabil_id} ou destino ${contaCorrenteDestino.conta_contabil_id}, skipping.`);
          return;
        }
        
        // Débito na conta contábil associada à conta corrente destino
        const lancamentoDebito: LancamentoContabil = {
          id: `${mov.id}_debito`,
          data: dataFormatada,
          historico: historico,
          conta: contaCorrenteDestino.conta_contabil_id,
          conta_nome: contaContabilDestino.descricao,
          conta_codigo: contaContabilDestino.codigo,
          tipo: 'debito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        // Crédito na conta contábil associada à conta corrente origem
        const lancamentoCredito: LancamentoContabil = {
          id: `${mov.id}_credito`,
          data: dataFormatada,
          historico: historico,
          conta: contaCorrenteOrigem.conta_contabil_id,
          conta_nome: contaContabilOrigem.descricao,
          conta_codigo: contaContabilOrigem.codigo,
          tipo: 'credito',
          valor: mov.valor,
          saldo: 0, // Será calculado depois
          movimentacao_id: mov.id
        };
        
        lancamentosGerados.push(lancamentoDebito, lancamentoCredito);
      }
      
      // Processar parcelas para lançamentos mais detalhados se necessário
      const parcelasDaMovimentacao = parcelas.filter(p => p.movimentacao_id === mov.id);
      if (parcelasDaMovimentacao.length > 0 && (tipoOperacao === 'pagar' || tipoOperacao === 'receber')) {
        parcelasDaMovimentacao.forEach(parcela => {
          if (parcela.data_pagamento) {
            // Formatando data no formato PT-BR (DD/MM/YYYY)
            const dataFormatadaParcela = typeof parcela.data_pagamento === 'string'
              ? formatarDataPtBr(parcela.data_pagamento)
              : formatarDataPtBr(new Date(parcela.data_pagamento).toISOString().split('T')[0]);
              
            const historicoParcela = `${historico} - Parcela ${parcela.numero}`;
            
            // Obter conta contábil da conta corrente usada no pagamento
            let contaContabilCorrenteId = '';
            let contaContabilCorrenteNome = 'Caixa/Banco';
            let contaContabilCorrenteCodigo = '1.01.01';
            
            if (parcela.conta_corrente_id) {
              const contaCorrenteInfo = contasCorrentesMap.get(parcela.conta_corrente_id);
              if (contaCorrenteInfo && contaCorrenteInfo.conta_contabil_id) {
                contaContabilCorrenteId = contaCorrenteInfo.conta_contabil_id;
                const contaContabilCorrente = contasMap.get(contaContabilCorrenteId);
                if (contaContabilCorrente) {
                  contaContabilCorrenteNome = contaContabilCorrente.descricao;
                  contaContabilCorrenteCodigo = contaContabilCorrente.codigo;
                }
              }
            }
            
            // Lançamento para parcelas pagas
            if (tipoOperacao === 'pagar') {
              // Obter a conta contábil do tipo do título
              let contaContrapartidaId = '';
              let contaContrapartidaNome = 'Contas a Pagar';
              let contaContrapartidaCodigo = '2.01.01'; // Código padrão caso não encontre o tipo título
              
              if (mov.tipo_titulo_id) {
                const tipoTitulo = tiposTitulosMap.get(mov.tipo_titulo_id);
                if (tipoTitulo && tipoTitulo.conta_contabil_id) {
                  contaContrapartidaId = tipoTitulo.conta_contabil_id;
                  const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
                  if (contaContrapartida) {
                    contaContrapartidaNome = contaContrapartida.descricao;
                    contaContrapartidaCodigo = contaContrapartida.codigo;
                  }
                }
              }
              
              // Débito em contas a pagar (conta do tipo de título)
              const lancamentoAPagar: LancamentoContabil = {
                id: `${parcela.id}_debito_ap`,
                data: dataFormatadaParcela,
                historico: historicoParcela,
                conta: contaContrapartidaId || 'passivo',
                conta_nome: contaContrapartidaNome,
                conta_codigo: contaContrapartidaCodigo,
                tipo: 'debito',
                valor: parcela.valor,
                saldo: 0,
                parcela_id: parcela.id,
                movimentacao_id: mov.id
              };
              
              // Crédito na conta contábil associada à conta corrente
              const lancamentoBanco: LancamentoContabil = {
                id: `${parcela.id}_banco_credito`,
                data: dataFormatadaParcela,
                historico: historicoParcela,
                conta: contaContabilCorrenteId || 'caixa',
                conta_nome: contaContabilCorrenteNome,
                conta_codigo: contaContabilCorrenteCodigo,
                tipo: 'credito',
                valor: parcela.valor,
                saldo: 0,
                parcela_id: parcela.id,
                movimentacao_id: mov.id
              };
              
              lancamentosGerados.push(lancamentoAPagar, lancamentoBanco);
            }
            else if (tipoOperacao === 'receber') {
              // Obter a conta contábil do tipo do título
              let contaContrapartidaId = '';
              let contaContrapartidaNome = 'Contas a Receber';
              let contaContrapartidaCodigo = '1.02.01'; // Código padrão caso não encontre o tipo título
              
              if (mov.tipo_titulo_id) {
                const tipoTitulo = tiposTitulosMap.get(mov.tipo_titulo_id);
                if (tipoTitulo && tipoTitulo.conta_contabil_id) {
                  contaContrapartidaId = tipoTitulo.conta_contabil_id;
                  const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
                  if (contaContrapartida) {
                    contaContrapartidaNome = contaContrapartida.descricao;
                    contaContrapartidaCodigo = contaContrapartida.codigo;
                  }
                }
              }
              
              // Débito na conta contábil associada à conta corrente
              const lancamentoBanco: LancamentoContabil = {
                id: `${parcela.id}_banco_debito`,
                data: dataFormatadaParcela,
                historico: historicoParcela,
                conta: contaContabilCorrenteId || 'caixa',
                conta_nome: contaContabilCorrenteNome,
                conta_codigo: contaContabilCorrenteCodigo,
                tipo: 'debito',
                valor: parcela.valor,
                saldo: 0,
                parcela_id: parcela.id,
                movimentacao_id: mov.id
              };
              
              // Crédito em contas a receber (conta do tipo de título)
              const lancamentoAReceber: LancamentoContabil = {
                id: `${parcela.id}_credito_ar`,
                data: dataFormatadaParcela,
                historico: historicoParcela,
                conta: contaContrapartidaId || 'ativo',
                conta_nome: contaContrapartidaNome,
                conta_codigo: contaContrapartidaCodigo,
                tipo: 'credito',
                valor: parcela.valor,
                saldo: 0,
                parcela_id: parcela.id,
                movimentacao_id: mov.id
              };
              
              lancamentosGerados.push(lancamentoBanco, lancamentoAReceber);
            }
          }
        });
      }
    });
    
    return lancamentosGerados;
  }
  
  // Função para formatar datas no padrão PT-BR (DD/MM/YYYY)
  function formatarDataPtBr(dataStr: string): string {
    // Se já estiver no formato DD/MM/YYYY, retornar como está
    if (dataStr.includes('/')) {
      return dataStr;
    }
    
    // Se estiver no formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS.mmmZ)
    try {
      const dataParts = dataStr.split('T')[0].split('-');
      if (dataParts.length === 3) {
        const [ano, mes, dia] = dataParts;
        return `${dia}/${mes}/${ano}`;
      }
      return dataStr; // Retorna original se não conseguir converter
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dataStr;
    }
  }
  
  // Calcular saldos para cada conta
  function calcularSaldos(lancamentos: LancamentoContabil[]): LancamentoContabil[] {
    const saldosPorConta: {[contaId: string]: number} = {};
    
    // Ordenar por data para calcular saldo progressivamente
    const lancamentosOrdenados = [...lancamentos].sort((a, b) => {
      // Converter datas para formato comparável
      const dataA = typeof a.data === 'string' 
        ? a.data.split('/').reverse().join('-') 
        : new Date(a.data).toISOString();
      const dataB = typeof b.data === 'string'
        ? b.data.split('/').reverse().join('-')
        : new Date(b.data).toISOString();
      
      return dataA.localeCompare(dataB);
    });
    
    return lancamentosOrdenados.map(lancamento => {
      if (!saldosPorConta[lancamento.conta]) {
        saldosPorConta[lancamento.conta] = 0;
      }
      
      // Atualizar saldo conforme tipo de lançamento
      if (lancamento.tipo === 'debito') {
        saldosPorConta[lancamento.conta] += lancamento.valor;
      } else {
        saldosPorConta[lancamento.conta] -= lancamento.valor;
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
      
      // 2. Carregar tipos de títulos
      await carregarTiposTitulos();
      
      // 3. Carregar contas correntes
      await carregarContasCorrentes();
      
      // 4. Carregar movimentações com join em tipos_titulos
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          tipo_titulo:tipos_titulos(*)
        `)
        .eq("empresa_id", currentCompany.id);
        
      if (movError) throw movError;
      
      // 5. Carregar parcelas
      const { data: parcelas, error: parcError } = await supabase
        .from("movimentacoes_parcelas")
        .select("*")
        .in("movimentacao_id", movimentacoes?.map(m => m.id) || []);
        
      if (parcError) throw parcError;
      
      // Converter dados para os tipos corretos
      const movimentacoesTipadas = movimentacoes?.map(mov => ({
        ...mov, 
        tipo_operacao: mov.tipo_operacao as "pagar" | "receber" | "transferencia"
      })) || [];
      
      console.log("Tipos de títulos carregados:", tiposTitulos.length);
      console.log("Contas correntes carregadas:", contasCorrentes.length);
      
      // 6. Processar dados para gerar lançamentos contábeis
      const lancamentosProcessados = processarMovimentacoesParaLancamentos(
        movimentacoesTipadas,
        parcelas || [],
        planosContas,
        tiposTitulos,
        contasCorrentes
      );
      
      console.log("Movimentações carregadas:", movimentacoesTipadas.length);
      console.log("Parcelas carregadas:", parcelas?.length || 0);
      console.log("Lançamentos gerados:", lancamentosProcessados.length);
      
      // 7. Calcular saldos para cada conta
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
    tiposTitulos,
    isLoading,
    carregarDados,
    adicionarLancamento,
    excluirLancamento
  };
}
