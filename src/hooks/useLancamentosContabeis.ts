import { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/company-context";
import { LancamentoContabil } from '@/types/lancamentos-contabeis';
import { Movimentacao, MovimentacaoParcela } from '@/types/movimentacoes';
import { TipoTitulo } from '@/types/tipos-titulos';
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
        .select("id, codigo, descricao, tipo, categoria, considerar_dre, classificacao_dre, status, created_at, updated_at")
        .eq("empresa_id", currentCompany.id)
        .eq("status", "ativo")
        .order("codigo", { ascending: true });
        
      if (error) throw error;
      
      // Convertendo para o tipo PlanoConta
      const contas: PlanoConta[] = data?.map(conta => ({
        ...conta,
        empresa_id: currentCompany.id,
        created_at: conta.created_at || new Date().toISOString(),
        updated_at: conta.updated_at || new Date().toISOString(),
        categoria: conta.categoria as "título" | "movimentação",
        status: conta.status as "ativo" | "inativo",
        classificacao_dre: conta.classificacao_dre || undefined
      })) || [];
      
      setPlanosContas(contas);
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
  
  // Função para carregar lançamentos do Supabase
  async function carregarLancamentosContabeis() {
    if (!currentCompany?.id) return [];
    
    try {
      // Carregar lançamentos da tabela lancamentos_contabeis
      const { data, error } = await supabase
        .from("lancamentos_contabeis")
        .select("id, empresa_id, data, historico, conta_debito_id, conta_credito_id, valor, movimentacao_id, parcela_id, tipo_lancamento, created_at, updated_at")
        .eq("empresa_id", currentCompany.id)
        .order("data", { ascending: true })
        .limit(20000);
        
      if (error) throw error;
      
      // Converter para o formato usado na interface
      const lancamentosProcessados: LancamentoContabil[] = [];
      
      for (const lanc of data || []) {
        const contaDebito = planosContas.find(c => c.id === lanc.conta_debito_id);
        const contaCredito = planosContas.find(c => c.id === lanc.conta_credito_id);
        
        if (contaDebito) {
          // Lançamento de débito
          const lancamentoDebito: LancamentoContabil = {
            id: `${lanc.id}_debito`,
            data: lanc.data,
            historico: lanc.historico,
            conta: lanc.conta_debito_id,
            conta_nome: contaDebito.descricao,
            conta_codigo: contaDebito.codigo,
            tipo: 'debito',
            valor: lanc.valor,
            saldo: 0, // Será calculado depois
            movimentacao_id: lanc.movimentacao_id,
            parcela_id: lanc.parcela_id,
            tipo_lancamento: (lanc.tipo_lancamento || 'principal') as 'principal' | 'juros' | 'multa' | 'desconto'
          };
          lancamentosProcessados.push(lancamentoDebito);
        }
        
        if (contaCredito) {
          // Lançamento de crédito
          const lancamentoCredito: LancamentoContabil = {
            id: `${lanc.id}_credito`,
            data: lanc.data,
            historico: lanc.historico,
            conta: lanc.conta_credito_id,
            conta_nome: contaCredito.descricao,
            conta_codigo: contaCredito.codigo,
            tipo: 'credito',
            valor: lanc.valor,
            saldo: 0, // Será calculado depois
            movimentacao_id: lanc.movimentacao_id,
            parcela_id: lanc.parcela_id,
            tipo_lancamento: (lanc.tipo_lancamento || 'principal') as 'principal' | 'juros' | 'multa' | 'desconto'
          };
          lancamentosProcessados.push(lancamentoCredito);
        }
      }
      
      return lancamentosProcessados;
    } catch (error) {
      console.error("Erro ao carregar lançamentos contábeis:", error);
      toast.error("Erro ao carregar lançamentos contábeis");
      return [];
    }
  }
  
  // Processar movimentações e gerar lançamentos contábeis
  function processarMovimentacoesParaLancamentos(
    movimentacoes: Movimentacao[], 
    parcelas: MovimentacaoParcela[],
    contas: PlanoConta[],
    tiposTitulos: TipoTitulo[],
    contasCorrentes: {id: string; nome: string; conta_contabil_id: string}[],
    parcelasAntecipacoes?: Map<string, {antecipacao_id: string; valor_utilizado: number}[]>,
    antecipacoesMap?: Map<string, any>
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
      
      // Extrair nome do favorecido (se vier da consulta com JOIN)
      const favorecidoNome = (mov as any).favorecido?.nome || '';
      
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
          movimentacao_id: mov.id,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome
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
            
            // Obter a conta contábil do tipo do título e as contas de juros, multa e desconto
            let tipoTitulo = null;
            if (mov.tipo_titulo_id) {
              tipoTitulo = tiposTitulosMap.get(mov.tipo_titulo_id);
            }
            
            // Lançamento para parcelas pagas
            if (tipoOperacao === 'pagar') {
              // Obter a conta contábil do tipo do título
              let contaContrapartidaId = '';
              let contaContrapartidaNome = 'Contas a Pagar';
              let contaContrapartidaCodigo = '2.01.01';
              
              if (tipoTitulo && tipoTitulo.conta_contabil_id) {
                contaContrapartidaId = tipoTitulo.conta_contabil_id;
                const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
                if (contaContrapartida) {
                  contaContrapartidaNome = contaContrapartida.descricao;
                  contaContrapartidaCodigo = contaContrapartida.codigo;
                }
              }
              
              // Verificar antecipações utilizadas nesta parcela
              const antecipacoesDaParcela = parcelasAntecipacoes?.get(parcela.id) || [];
              let totalAntecipacoes = 0;
              
              // Gerar lançamentos para cada antecipação usada
              antecipacoesDaParcela.forEach((antUso, idx) => {
                if (antUso.valor_utilizado > 0 && antecipacoesMap) {
                  const antecipacao = antecipacoesMap.get(antUso.antecipacao_id);
                  if (antecipacao && antecipacao.tipo_titulo_id) {
                    const tipoTituloAnt = tiposTitulosMap.get(antecipacao.tipo_titulo_id);
                    if (tipoTituloAnt && tipoTituloAnt.conta_contabil_id) {
                      const contaAnt = contasMap.get(tipoTituloAnt.conta_contabil_id);
                      if (contaAnt) {
                        totalAntecipacoes += antUso.valor_utilizado;
                        
                        // D - Fornecedores a Pagar (tipo título da movimentação)
                        lancamentosGerados.push({
                          id: `${parcela.id}_ant${idx}_debito_ap`,
                          data: dataFormatadaParcela,
                          historico: `${historicoParcela} - Compensação Antecipação`,
                          conta: contaContrapartidaId || 'passivo',
                          conta_nome: contaContrapartidaNome,
                          conta_codigo: contaContrapartidaCodigo,
                          tipo: 'debito',
                          valor: antUso.valor_utilizado,
                          saldo: 0,
                          parcela_id: parcela.id,
                          movimentacao_id: mov.id,
                          tipo_lancamento: 'principal',
                          favorecido: favorecidoNome
                        });
                        
                        // C - Adiantamento de Fornecedores (tipo título da antecipação)
                        lancamentosGerados.push({
                          id: `${parcela.id}_ant${idx}_credito_adiant`,
                          data: dataFormatadaParcela,
                          historico: `${historicoParcela} - Compensação Antecipação`,
                          conta: tipoTituloAnt.conta_contabil_id,
                          conta_nome: contaAnt.descricao,
                          conta_codigo: contaAnt.codigo,
                          tipo: 'credito',
                          valor: antUso.valor_utilizado,
                          saldo: 0,
                          parcela_id: parcela.id,
                          movimentacao_id: mov.id,
                          tipo_lancamento: 'principal',
                          favorecido: favorecidoNome
                        });
                      }
                    }
                  }
                }
              });
              
              // Valor restante pago em dinheiro
              const valorEfetivo = parcela.valor - totalAntecipacoes;
              
              if (valorEfetivo > 0) {
                // Débito em contas a pagar (conta do tipo de título)
                lancamentosGerados.push({
                  id: `${parcela.id}_debito_ap`,
                  data: dataFormatadaParcela,
                  historico: historicoParcela,
                  conta: contaContrapartidaId || 'passivo',
                  conta_nome: contaContrapartidaNome,
                  conta_codigo: contaContrapartidaCodigo,
                  tipo: 'debito',
                  valor: valorEfetivo,
                  saldo: 0,
                  parcela_id: parcela.id,
                  movimentacao_id: mov.id,
                  tipo_lancamento: 'principal',
                  favorecido: favorecidoNome
                });
                
                // Crédito na conta contábil associada à conta corrente
                lancamentosGerados.push({
                  id: `${parcela.id}_banco_credito`,
                  data: dataFormatadaParcela,
                  historico: historicoParcela,
                  conta: contaContabilCorrenteId || 'caixa',
                  conta_nome: contaContabilCorrenteNome,
                  conta_codigo: contaContabilCorrenteCodigo,
                  tipo: 'credito',
                  valor: valorEfetivo,
                  saldo: 0,
                  parcela_id: parcela.id,
                  movimentacao_id: mov.id,
                  tipo_lancamento: 'principal',
                  favorecido: favorecidoNome
                });
              }
              
              // Processar juros se houver
              if (parcela.juros && parcela.juros > 0 && tipoTitulo && tipoTitulo.conta_juros_id) {
                const contaJuros = contasMap.get(tipoTitulo.conta_juros_id);
                if (contaJuros) {
                  // Débito na conta de juros
                  const lancamentoJurosDebito: LancamentoContabil = {
                    id: `${parcela.id}_juros_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Juros`,
                    conta: tipoTitulo.conta_juros_id,
                    conta_nome: contaJuros.descricao,
                    conta_codigo: contaJuros.codigo,
                    tipo: 'debito',
                    valor: parcela.juros,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'juros',
                    favorecido: favorecidoNome
                  };
                  
                  // Crédito na conta contábil associada à conta corrente
                  const lancamentoJurosCredito: LancamentoContabil = {
                    id: `${parcela.id}_juros_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Juros`,
                    conta: contaContabilCorrenteId || 'caixa',
                    conta_nome: contaContabilCorrenteNome,
                    conta_codigo: contaContabilCorrenteCodigo,
                    tipo: 'credito',
                    valor: parcela.juros,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'juros',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoJurosDebito, lancamentoJurosCredito);
                }
              }
              
              // Processar multa se houver
              if (parcela.multa && parcela.multa > 0 && tipoTitulo && tipoTitulo.conta_multa_id) {
                const contaMulta = contasMap.get(tipoTitulo.conta_multa_id);
                if (contaMulta) {
                  // Débito na conta de multa
                  const lancamentoMultaDebito: LancamentoContabil = {
                    id: `${parcela.id}_multa_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Multa`,
                    conta: tipoTitulo.conta_multa_id,
                    conta_nome: contaMulta.descricao,
                    conta_codigo: contaMulta.codigo,
                    tipo: 'debito',
                    valor: parcela.multa,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'multa',
                    favorecido: favorecidoNome
                  };
                  
                  // Crédito na conta contábil associada à conta corrente
                  const lancamentoMultaCredito: LancamentoContabil = {
                    id: `${parcela.id}_multa_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Multa`,
                    conta: contaContabilCorrenteId || 'caixa',
                    conta_nome: contaContabilCorrenteNome,
                    conta_codigo: contaContabilCorrenteCodigo,
                    tipo: 'credito',
                    valor: parcela.multa,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'multa',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoMultaDebito, lancamentoMultaCredito);
                }
              }
              
              // Processar desconto se houver
              if (parcela.desconto && parcela.desconto > 0 && tipoTitulo && tipoTitulo.conta_desconto_id) {
                const contaDesconto = contasMap.get(tipoTitulo.conta_desconto_id);
                if (contaDesconto) {
                  // Crédito na conta de desconto
                  const lancamentoDescontoCredito: LancamentoContabil = {
                    id: `${parcela.id}_desconto_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Desconto`,
                    conta: tipoTitulo.conta_desconto_id,
                    conta_nome: contaDesconto.descricao,
                    conta_codigo: contaDesconto.codigo,
                    tipo: 'credito',
                    valor: parcela.desconto,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'desconto',
                    favorecido: favorecidoNome
                  };
                  
                  // Débito na conta do tipo de título
                  const lancamentoDescontoDebito: LancamentoContabil = {
                    id: `${parcela.id}_desconto_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Desconto`,
                    conta: contaContrapartidaId || 'passivo',
                    conta_nome: contaContrapartidaNome,
                    conta_codigo: contaContrapartidaCodigo,
                    tipo: 'debito',
                    valor: parcela.desconto,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'desconto',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoDescontoCredito, lancamentoDescontoDebito);
                }
              }
            }
            else if (tipoOperacao === 'receber') {
              // Obter a conta contábil do tipo do título
              let contaContrapartidaId = '';
              let contaContrapartidaNome = 'Contas a Receber';
              let contaContrapartidaCodigo = '1.02.01';
              
              if (tipoTitulo && tipoTitulo.conta_contabil_id) {
                contaContrapartidaId = tipoTitulo.conta_contabil_id;
                const contaContrapartida = contasMap.get(tipoTitulo.conta_contabil_id);
                if (contaContrapartida) {
                  contaContrapartidaNome = contaContrapartida.descricao;
                  contaContrapartidaCodigo = contaContrapartida.codigo;
                }
              }
              
              // Verificar antecipações utilizadas nesta parcela
              const antecipacoesDaParcela = parcelasAntecipacoes?.get(parcela.id) || [];
              let totalAntecipacoes = 0;
              
              // Gerar lançamentos para cada antecipação usada
              antecipacoesDaParcela.forEach((antUso, idx) => {
                if (antUso.valor_utilizado > 0 && antecipacoesMap) {
                  const antecipacao = antecipacoesMap.get(antUso.antecipacao_id);
                  if (antecipacao && antecipacao.tipo_titulo_id) {
                    const tipoTituloAnt = tiposTitulosMap.get(antecipacao.tipo_titulo_id);
                    if (tipoTituloAnt && tipoTituloAnt.conta_contabil_id) {
                      const contaAnt = contasMap.get(tipoTituloAnt.conta_contabil_id);
                      if (contaAnt) {
                        totalAntecipacoes += antUso.valor_utilizado;
                        
                        // D - Adiantamento de Clientes (tipo título da antecipação)
                        lancamentosGerados.push({
                          id: `${parcela.id}_ant${idx}_debito_adiant`,
                          data: dataFormatadaParcela,
                          historico: `${historicoParcela} - Compensação Antecipação`,
                          conta: tipoTituloAnt.conta_contabil_id,
                          conta_nome: contaAnt.descricao,
                          conta_codigo: contaAnt.codigo,
                          tipo: 'debito',
                          valor: antUso.valor_utilizado,
                          saldo: 0,
                          parcela_id: parcela.id,
                          movimentacao_id: mov.id,
                          tipo_lancamento: 'principal',
                          favorecido: favorecidoNome
                        });
                        
                        // C - Clientes a Receber (tipo título da movimentação)
                        lancamentosGerados.push({
                          id: `${parcela.id}_ant${idx}_credito_ar`,
                          data: dataFormatadaParcela,
                          historico: `${historicoParcela} - Compensação Antecipação`,
                          conta: contaContrapartidaId || 'ativo',
                          conta_nome: contaContrapartidaNome,
                          conta_codigo: contaContrapartidaCodigo,
                          tipo: 'credito',
                          valor: antUso.valor_utilizado,
                          saldo: 0,
                          parcela_id: parcela.id,
                          movimentacao_id: mov.id,
                          tipo_lancamento: 'principal',
                          favorecido: favorecidoNome
                        });
                      }
                    }
                  }
                }
              });
              
              // Valor restante pago em dinheiro
              const valorEfetivo = parcela.valor - totalAntecipacoes;
              
              if (valorEfetivo > 0) {
                // Débito na conta contábil associada à conta corrente
                lancamentosGerados.push({
                  id: `${parcela.id}_banco_debito`,
                  data: dataFormatadaParcela,
                  historico: historicoParcela,
                  conta: contaContabilCorrenteId || 'caixa',
                  conta_nome: contaContabilCorrenteNome,
                  conta_codigo: contaContabilCorrenteCodigo,
                  tipo: 'debito',
                  valor: valorEfetivo,
                  saldo: 0,
                  parcela_id: parcela.id,
                  movimentacao_id: mov.id,
                  tipo_lancamento: 'principal',
                  favorecido: favorecidoNome
                });
                
                // Crédito em contas a receber (conta do tipo de título)
                lancamentosGerados.push({
                  id: `${parcela.id}_credito_ar`,
                  data: dataFormatadaParcela,
                  historico: historicoParcela,
                  conta: contaContrapartidaId || 'ativo',
                  conta_nome: contaContrapartidaNome,
                  conta_codigo: contaContrapartidaCodigo,
                  tipo: 'credito',
                  valor: valorEfetivo,
                  saldo: 0,
                  parcela_id: parcela.id,
                  movimentacao_id: mov.id,
                  tipo_lancamento: 'principal',
                  favorecido: favorecidoNome
                });
              }
              
              // Processar juros se houver
              if (parcela.juros && parcela.juros > 0 && tipoTitulo && tipoTitulo.conta_juros_id) {
                const contaJuros = contasMap.get(tipoTitulo.conta_juros_id);
                if (contaJuros) {
                  // Débito na conta contábil associada à conta corrente
                  const lancamentoJurosDebito: LancamentoContabil = {
                    id: `${parcela.id}_juros_banco_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Juros`,
                    conta: contaContabilCorrenteId || 'caixa',
                    conta_nome: contaContabilCorrenteNome,
                    conta_codigo: contaContabilCorrenteCodigo,
                    tipo: 'debito',
                    valor: parcela.juros,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'juros',
                    favorecido: favorecidoNome
                  };
                  
                  // Crédito na conta de juros
                  const lancamentoJurosCredito: LancamentoContabil = {
                    id: `${parcela.id}_juros_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Juros`,
                    conta: tipoTitulo.conta_juros_id,
                    conta_nome: contaJuros.descricao,
                    conta_codigo: contaJuros.codigo,
                    tipo: 'credito',
                    valor: parcela.juros,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'juros',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoJurosDebito, lancamentoJurosCredito);
                }
              }
              
              // Processar multa se houver
              if (parcela.multa && parcela.multa > 0 && tipoTitulo && tipoTitulo.conta_multa_id) {
                const contaMulta = contasMap.get(tipoTitulo.conta_multa_id);
                if (contaMulta) {
                  // Débito na conta contábil associada à conta corrente
                  const lancamentoMultaDebito: LancamentoContabil = {
                    id: `${parcela.id}_multa_banco_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Multa`,
                    conta: contaContabilCorrenteId || 'caixa',
                    conta_nome: contaContabilCorrenteNome,
                    conta_codigo: contaContabilCorrenteCodigo,
                    tipo: 'debito',
                    valor: parcela.multa,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'multa',
                    favorecido: favorecidoNome
                  };
                  
                  // Crédito na conta de multa
                  const lancamentoMultaCredito: LancamentoContabil = {
                    id: `${parcela.id}_multa_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Multa`,
                    conta: tipoTitulo.conta_multa_id,
                    conta_nome: contaMulta.descricao,
                    conta_codigo: contaMulta.codigo,
                    tipo: 'credito',
                    valor: parcela.multa,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'multa',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoMultaDebito, lancamentoMultaCredito);
                }
              }
              
              // Processar desconto se houver
              if (parcela.desconto && parcela.desconto > 0 && tipoTitulo && tipoTitulo.conta_desconto_id) {
                const contaDesconto = contasMap.get(tipoTitulo.conta_desconto_id);
                if (contaDesconto) {
                  // Débito na conta de desconto
                  const lancamentoDescontoDebito: LancamentoContabil = {
                    id: `${parcela.id}_desconto_debito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Desconto`,
                    conta: tipoTitulo.conta_desconto_id,
                    conta_nome: contaDesconto.descricao,
                    conta_codigo: contaDesconto.codigo,
                    tipo: 'debito',
                    valor: parcela.desconto,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'desconto',
                    favorecido: favorecidoNome
                  };
                  
                  // Crédito na conta do tipo de título
                  const lancamentoDescontoCredito: LancamentoContabil = {
                    id: `${parcela.id}_desconto_credito`,
                    data: dataFormatadaParcela,
                    historico: `${historicoParcela} - Desconto`,
                    conta: contaContrapartidaId || 'ativo',
                    conta_nome: contaContrapartidaNome,
                    conta_codigo: contaContrapartidaCodigo,
                    tipo: 'credito',
                    valor: parcela.desconto,
                    saldo: 0,
                    parcela_id: parcela.id,
                    movimentacao_id: mov.id,
                    tipo_lancamento: 'desconto',
                    favorecido: favorecidoNome
                  };
                  
                  lancamentosGerados.push(lancamentoDescontoDebito, lancamentoDescontoCredito);
                }
              }
            }
          }
        });
      }
    });
    
    return lancamentosGerados;
  }
  
  // Processar antecipações e gerar lançamentos contábeis
  function processarAntecipacoesParaLancamentos(
    antecipacoes: any[],
    favorecidos: any[],
    contas: PlanoConta[],
    tiposTitulos: TipoTitulo[],
    contasCorrentes: {id: string; nome: string; conta_contabil_id: string}[]
  ): LancamentoContabil[] {
    const lancamentosGerados: LancamentoContabil[] = [];
    
    const contasMap = new Map<string, PlanoConta>();
    contas.forEach(c => contasMap.set(c.id, c));
    
    const tiposTitulosMap = new Map<string, TipoTitulo>();
    tiposTitulos.forEach(t => tiposTitulosMap.set(t.id, t));
    
    const contasCorrentesMap = new Map<string, {id: string; nome: string; conta_contabil_id: string}>();
    contasCorrentes.forEach(cc => contasCorrentesMap.set(cc.id, cc));
    
    const favorecidosMap = new Map<string, string>();
    favorecidos.forEach((f: any) => favorecidosMap.set(f.id, f.nome));
    
    antecipacoes.forEach(ant => {
      // Precisamos do tipo_titulo_id e conta_corrente_id para contabilizar
      if (!ant.tipo_titulo_id || !ant.conta_corrente_id) {
        console.log(`Antecipação ${ant.id} sem tipo_titulo_id ou conta_corrente_id, skipping.`);
        return;
      }
      
      const tipoTitulo = tiposTitulosMap.get(ant.tipo_titulo_id);
      if (!tipoTitulo || !tipoTitulo.conta_contabil_id) {
        console.log(`Tipo título ${ant.tipo_titulo_id} sem conta_contabil_id, skipping.`);
        return;
      }
      
      const contaTitulo = contasMap.get(tipoTitulo.conta_contabil_id);
      if (!contaTitulo) return;
      
      const contaCorrente = contasCorrentesMap.get(ant.conta_corrente_id);
      if (!contaCorrente || !contaCorrente.conta_contabil_id) return;
      
      const contaBanco = contasMap.get(contaCorrente.conta_contabil_id);
      if (!contaBanco) return;
      
      const dataFormatada = formatarDataPtBr(ant.data_lancamento);
      const favorecidoNome = ant.favorecido_id ? (favorecidosMap.get(ant.favorecido_id) || '') : '';
      const historico = ant.descricao || 'Antecipação';
      const valor = Number(ant.valor_total);
      
      if (ant.tipo_operacao === 'receber') {
        // D - Banco / C - Tipo Título
        lancamentosGerados.push({
          id: `ant_${ant.id}_debito`,
          data: dataFormatada,
          historico,
          conta: contaCorrente.conta_contabil_id,
          conta_nome: contaBanco.descricao,
          conta_codigo: contaBanco.codigo,
          tipo: 'debito',
          valor,
          saldo: 0,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome,
          numero_documento: ant.numero_documento || undefined,
        });
        lancamentosGerados.push({
          id: `ant_${ant.id}_credito`,
          data: dataFormatada,
          historico,
          conta: tipoTitulo.conta_contabil_id,
          conta_nome: contaTitulo.descricao,
          conta_codigo: contaTitulo.codigo,
          tipo: 'credito',
          valor,
          saldo: 0,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome,
          numero_documento: ant.numero_documento || undefined,
        });
      } else if (ant.tipo_operacao === 'pagar') {
        // D - Tipo Título / C - Banco
        lancamentosGerados.push({
          id: `ant_${ant.id}_debito`,
          data: dataFormatada,
          historico,
          conta: tipoTitulo.conta_contabil_id,
          conta_nome: contaTitulo.descricao,
          conta_codigo: contaTitulo.codigo,
          tipo: 'debito',
          valor,
          saldo: 0,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome,
          numero_documento: ant.numero_documento || undefined,
        });
        lancamentosGerados.push({
          id: `ant_${ant.id}_credito`,
          data: dataFormatada,
          historico,
          conta: contaCorrente.conta_contabil_id,
          conta_nome: contaBanco.descricao,
          conta_codigo: contaBanco.codigo,
          tipo: 'credito',
          valor,
          saldo: 0,
          tipo_lancamento: 'principal',
          favorecido: favorecidoNome,
          numero_documento: ant.numero_documento || undefined,
        });
      }
      
      // Se devolvida, gerar lançamento inverso
      if (ant.status === 'devolvida' && ant.valor_devolvido && Number(ant.valor_devolvido) > 0) {
        const valorDevolvido = Number(ant.valor_devolvido);
        // Usar updated_at como data aproximada da devolução
        const dataDevolucao = formatarDataPtBr(ant.updated_at?.split('T')[0] || ant.data_lancamento);
        const historicoDev = `Devolução - ${historico}`;
        
        if (ant.tipo_operacao === 'receber') {
          // Inverso: D - Tipo Título / C - Banco
          lancamentosGerados.push({
            id: `ant_${ant.id}_dev_debito`,
            data: dataDevolucao,
            historico: historicoDev,
            conta: tipoTitulo.conta_contabil_id,
            conta_nome: contaTitulo.descricao,
            conta_codigo: contaTitulo.codigo,
            tipo: 'debito',
            valor: valorDevolvido,
            saldo: 0,
            tipo_lancamento: 'principal',
            favorecido: favorecidoNome,
            numero_documento: ant.numero_documento || undefined,
          });
          lancamentosGerados.push({
            id: `ant_${ant.id}_dev_credito`,
            data: dataDevolucao,
            historico: historicoDev,
            conta: contaCorrente.conta_contabil_id,
            conta_nome: contaBanco.descricao,
            conta_codigo: contaBanco.codigo,
            tipo: 'credito',
            valor: valorDevolvido,
            saldo: 0,
            tipo_lancamento: 'principal',
            favorecido: favorecidoNome,
            numero_documento: ant.numero_documento || undefined,
          });
        } else {
          // Inverso: D - Banco / C - Tipo Título
          lancamentosGerados.push({
            id: `ant_${ant.id}_dev_debito`,
            data: dataDevolucao,
            historico: historicoDev,
            conta: contaCorrente.conta_contabil_id,
            conta_nome: contaBanco.descricao,
            conta_codigo: contaBanco.codigo,
            tipo: 'debito',
            valor: valorDevolvido,
            saldo: 0,
            tipo_lancamento: 'principal',
            favorecido: favorecidoNome,
            numero_documento: ant.numero_documento || undefined,
          });
          lancamentosGerados.push({
            id: `ant_${ant.id}_dev_credito`,
            data: dataDevolucao,
            historico: historicoDev,
            conta: tipoTitulo.conta_contabil_id,
            conta_nome: contaTitulo.descricao,
            conta_codigo: contaTitulo.codigo,
            tipo: 'credito',
            valor: valorDevolvido,
            saldo: 0,
            tipo_lancamento: 'principal',
            favorecido: favorecidoNome,
            numero_documento: ant.numero_documento || undefined,
          });
        }
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
        : a.data instanceof Date ? a.data.toISOString() : '';
      const dataB = typeof b.data === 'string'
        ? b.data.split('/').reverse().join('-')
        : b.data instanceof Date ? b.data.toISOString() : '';
      
      return dataA.localeCompare(dataB);
    });
    
    return lancamentosOrdenados.map(lancamento => {
      if (!lancamento.conta) return lancamento;
      
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
      
      // 4. Carregar movimentações com JOIN para favorecidos
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          tipo_titulo:tipos_titulos(*),
          favorecido:favorecidos(nome)
        `)
        .eq("empresa_id", currentCompany.id);
        
      if (movError) throw movError;
      
      // 5. Carregar parcelas - fazer em lotes para evitar URL muito longa
      let parcelas: any[] = [];
      const movimentacoesIds = movimentacoes?.map(m => m.id) || [];
      
      if (movimentacoesIds.length > 0) {
        // Processar em lotes de 50 IDs por vez
        const batchSize = 50;
        for (let i = 0; i < movimentacoesIds.length; i += batchSize) {
          const batch = movimentacoesIds.slice(i, i + batchSize);
          const { data: batchParcelas, error: batchError } = await supabase
            .from("movimentacoes_parcelas")
            .select("*")
            .in("movimentacao_id", batch);
          
          if (batchError) throw batchError;
          if (batchParcelas) parcelas.push(...batchParcelas);
        }
      }
      
      const parcError = null;
        
      if (parcError) throw parcError;
      
      // Converter dados para os tipos corretos
      const movimentacoesTipadas = movimentacoes?.map(mov => ({
        ...mov, 
        tipo_operacao: mov.tipo_operacao as "pagar" | "receber" | "transferencia"
      })) || [];
      
      // 6. Carregar lançamentos da tabela lancamentos_contabeis
      const lancamentosContabeis = await carregarLancamentosContabeis();
      
      // 6.1 Carregar antecipações utilizadas nas parcelas (movimentacoes_parcelas_antecipacoes)
      let parcelasAntecipacoesList: {movimentacao_parcela_id: string; antecipacao_id: string; valor_utilizado: number}[] = [];
      const parcelasIds = parcelas.map(p => p.id);
      if (parcelasIds.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < parcelasIds.length; i += batchSize) {
          const batch = parcelasIds.slice(i, i + batchSize);
          const { data: batchData, error: batchErr } = await supabase
            .from("movimentacoes_parcelas_antecipacoes")
            .select("movimentacao_parcela_id, antecipacao_id, valor_utilizado")
            .in("movimentacao_parcela_id", batch);
          if (batchErr) throw batchErr;
          if (batchData) parcelasAntecipacoesList.push(...batchData);
        }
      }
      
      // Montar mapa de parcela -> antecipações usadas
      const parcelasAntecipacoesMap = new Map<string, {antecipacao_id: string; valor_utilizado: number}[]>();
      parcelasAntecipacoesList.forEach(pa => {
        const list = parcelasAntecipacoesMap.get(pa.movimentacao_parcela_id) || [];
        list.push({ antecipacao_id: pa.antecipacao_id, valor_utilizado: pa.valor_utilizado });
        parcelasAntecipacoesMap.set(pa.movimentacao_parcela_id, list);
      });
      
      // Buscar antecipações referenciadas para obter tipo_titulo_id
      const antecipacaoIdsUsadas = Array.from(new Set(parcelasAntecipacoesList.map(pa => pa.antecipacao_id)));
      let antecipacoesUsadasMap = new Map<string, any>();
      if (antecipacaoIdsUsadas.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < antecipacaoIdsUsadas.length; i += batchSize) {
          const batch = antecipacaoIdsUsadas.slice(i, i + batchSize);
          const { data: antData } = await supabase
            .from("antecipacoes")
            .select("id, tipo_titulo_id, tipo_operacao")
            .in("id", batch);
          if (antData) antData.forEach(a => antecipacoesUsadasMap.set(a.id, a));
        }
      }
      
      // 7. Processar movimentações para gerar lançamentos
      const lancamentosProcessados = processarMovimentacoesParaLancamentos(
        movimentacoesTipadas,
        parcelas || [],
        planosContas,
        tiposTitulos,
        contasCorrentes,
        parcelasAntecipacoesMap,
        antecipacoesUsadasMap
      );
      
      // 7.05 Carregar e processar impostos retidos das movimentações
      let lancamentosImpostosRetidos: LancamentoContabil[] = [];
      if (movimentacoesIds.length > 0) {
        let impostosRetidosMov: any[] = [];
        const batchSize = 50;
        for (let i = 0; i < movimentacoesIds.length; i += batchSize) {
          const batch = movimentacoesIds.slice(i, i + batchSize);
          const { data: irData, error: irError } = await supabase
            .from("movimentacoes_impostos_retidos")
            .select("*, impostos_retidos:imposto_retido_id(id, nome, tipo_titulo_id, conta_despesa_id, favorecido_id)")
            .in("movimentacao_id", batch);
          if (irError) throw irError;
          if (irData) impostosRetidosMov.push(...irData);
        }

        // Buscar nomes dos favorecidos dos impostos
        const favIdsIR = Array.from(new Set(impostosRetidosMov.map((ir: any) => ir.impostos_retidos?.favorecido_id).filter(Boolean)));
        let favorecidosIRMap = new Map<string, string>();
        if (favIdsIR.length > 0) {
          for (let i = 0; i < favIdsIR.length; i += batchSize) {
            const batch = favIdsIR.slice(i, i + batchSize);
            const { data: favData } = await supabase.from("favorecidos").select("id, nome").in("id", batch);
            if (favData) favData.forEach((f: any) => favorecidosIRMap.set(f.id, f.nome));
          }
        }

        // Gerar lançamentos contábeis para cada imposto retido
        const contasMap = new Map<string, PlanoConta>();
        planosContas.forEach(c => contasMap.set(c.id, c));
        const tiposTitulosMap = new Map<string, TipoTitulo>();
        tiposTitulos.forEach(t => tiposTitulosMap.set(t.id, t));
        const movMap = new Map<string, any>();
        movimentacoesTipadas.forEach(m => movMap.set(m.id, m));

        impostosRetidosMov.forEach((ir: any) => {
          const imposto = ir.impostos_retidos;
          if (!imposto) return;

          const mov = movMap.get(ir.movimentacao_id);
          if (!mov) return;

          const dataFormatada = typeof mov.data_lancamento === 'string'
            ? formatarDataPtBr(mov.data_lancamento)
            : formatarDataPtBr(new Date(mov.data_lancamento).toISOString().split('T')[0]);

          const favorecidoNome = imposto.favorecido_id ? (favorecidosIRMap.get(imposto.favorecido_id) || '') : '';
          const historico = `Imposto Retido - ${imposto.nome}`;
          const valor = Number(ir.valor);

          if (valor <= 0) return;

          // D - Conta de despesa do imposto
          if (imposto.conta_despesa_id) {
            const contaDespesa = contasMap.get(imposto.conta_despesa_id);
            if (contaDespesa) {
              lancamentosImpostosRetidos.push({
                id: `ir_${ir.id}_debito`,
                data: dataFormatada,
                historico,
                conta: imposto.conta_despesa_id,
                conta_nome: contaDespesa.descricao,
                conta_codigo: contaDespesa.codigo,
                tipo: 'debito',
                valor,
                saldo: 0,
                movimentacao_id: ir.movimentacao_id,
                tipo_lancamento: 'principal',
                favorecido: favorecidoNome
              });
            }
          }

          // C - Conta contábil do tipo de título do imposto
          if (imposto.tipo_titulo_id) {
            const tipoTituloImp = tiposTitulosMap.get(imposto.tipo_titulo_id);
            if (tipoTituloImp && tipoTituloImp.conta_contabil_id) {
              const contaTitulo = contasMap.get(tipoTituloImp.conta_contabil_id);
              if (contaTitulo) {
                lancamentosImpostosRetidos.push({
                  id: `ir_${ir.id}_credito`,
                  data: dataFormatada,
                  historico,
                  conta: tipoTituloImp.conta_contabil_id,
                  conta_nome: contaTitulo.descricao,
                  conta_codigo: contaTitulo.codigo,
                  tipo: 'credito',
                  valor,
                  saldo: 0,
                  movimentacao_id: ir.movimentacao_id,
                  tipo_lancamento: 'principal',
                  favorecido: favorecidoNome
                });
              }
            }
          }
        });
      }
      
      // 7.1 Carregar antecipações e gerar lançamentos contábeis
      const { data: antecipacoesData, error: antError } = await supabase
        .from("antecipacoes")
        .select("*")
        .eq("empresa_id", currentCompany.id)
        .neq("status", "cancelada");
      
      if (antError) throw antError;
      
      // Buscar favorecidos das antecipações
      const favIdsAnt = Array.from(new Set((antecipacoesData || []).map(a => a.favorecido_id).filter(Boolean)));
      let favorecidosAnt: any[] = [];
      if (favIdsAnt.length > 0) {
        const { data: favData } = await supabase
          .from("favorecidos")
          .select("id, nome")
          .in("id", favIdsAnt);
        favorecidosAnt = favData || [];
      }
      
      const lancamentosAntecipacoes = processarAntecipacoesParaLancamentos(
        antecipacoesData || [],
        favorecidosAnt,
        planosContas,
        tiposTitulos,
        contasCorrentes
      );
      
      // 8. Combinar os lançamentos da tabela com os processados das movimentações, impostos retidos e antecipações
      const todosLancamentos = [...lancamentosContabeis, ...lancamentosProcessados, ...lancamentosImpostosRetidos, ...lancamentosAntecipacoes];
      
      // 8.1 Enriquecer lançamentos com numero_documento e numero_parcela
      const movimentacoesMap = new Map<string, any>();
      (movimentacoesTipadas || []).forEach(m => movimentacoesMap.set(m.id, m));
      const parcelasMap = new Map<string, any>();
      (parcelas || []).forEach(p => parcelasMap.set(p.id, p));
      
      const todosLancamentosEnriquecidos = todosLancamentos.map(lanc => {
        let numero_documento = lanc.numero_documento;
        let numero_parcela = lanc.numero_parcela;
        
        if (!numero_documento && lanc.movimentacao_id) {
          const mov = movimentacoesMap.get(lanc.movimentacao_id);
          if (mov) {
            numero_documento = mov.numero_documento || undefined;
          }
        }
        
        if (numero_parcela === undefined && lanc.parcela_id) {
          const parc = parcelasMap.get(lanc.parcela_id);
          if (parc) {
            numero_parcela = parc.numero;
          }
        }
        
        return { ...lanc, numero_documento, numero_parcela };
      });
      
      // 9. Calcular saldos para todos os lançamentos
      const lancamentosComSaldo = calcularSaldos(todosLancamentosEnriquecidos);
      
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
    if (!currentCompany?.id) return false;

    try {
      // 1. Verificar contas do débito e crédito
      const contaDebito = planosContas.find(c => c.id === dados.debito);
      const contaCredito = planosContas.find(c => c.id === dados.credito);
      
      if (!contaDebito || !contaCredito) {
        toast.error("Contas contábeis não encontradas");
        return false;
      }
      
      // 2. Inserir na tabela lancamentos_contabeis
      const { data: lancamentoInserido, error } = await supabase
        .from('lancamentos_contabeis')
        .insert({
          empresa_id: currentCompany.id,
          data: formatarDataParaBackend(dados.data),
          historico: dados.historico,
          conta_debito_id: dados.debito,
          conta_credito_id: dados.credito,
          valor: dados.valor,
          tipo_lancamento: 'principal'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao inserir lançamento:", error);
        throw error;
      }
      
      // 3. Criar lançamentos para exibição na interface
      const novoLancamentoDebito: LancamentoContabil = {
        id: `${lancamentoInserido.id}_d`,
        data: dados.data,
        historico: dados.historico,
        conta: dados.debito,
        conta_nome: contaDebito.descricao,
        conta_codigo: contaDebito.codigo,
        tipo: 'debito',
        valor: dados.valor,
        saldo: 0, // Será recalculado
        tipo_lancamento: 'principal'
      };
      
      const novoLancamentoCredito: LancamentoContabil = {
        id: `${lancamentoInserido.id}_c`,
        data: dados.data,
        historico: dados.historico,
        conta: dados.credito,
        conta_nome: contaCredito.descricao,
        conta_codigo: contaCredito.codigo,
        tipo: 'credito',
        valor: dados.valor,
        saldo: 0, // Será recalculado
        tipo_lancamento: 'principal'
      };
      
      // 4. Adicionar aos lançamentos existentes e recalcular saldos
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

  // Função para formatar a data para o formato do backend (YYYY-MM-DD)
  function formatarDataParaBackend(dataStr: string): string {
    if (!dataStr) return '';
    
    // Se já estiver no formato ISO (YYYY-MM-DD), retornar como está
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dataStr;
    }
    
    // Se estiver no formato DD/MM/YYYY, converter para YYYY-MM-DD
    if (dataStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [dia, mes, ano] = dataStr.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    
    // Tentativa de converter Date para ISO
    try {
      const data = new Date(dataStr);
      return data.toISOString().split('T')[0];
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return dataStr;
    }
  }

  // Função para excluir um lançamento
  async function excluirLancamento(id: string) {
    try {
      // Extrair o ID real do lançamento (removendo o sufixo)
      const idBase = id.split('_')[0];
      
      // Excluir o lançamento do banco de dados
      const { error } = await supabase
        .from('lancamentos_contabeis')
        .delete()
        .eq('id', idBase);
        
      if (error) throw error;
      
      // Atualizar lançamentos na interface
      const lancamentosFiltrados = lancamentos.filter(l => !l.id.startsWith(idBase));
      
      // Recalcular saldos
      const lancamentosComSaldo = calcularSaldos(lancamentosFiltrados);
      
      setLancamentos(lancamentosComSaldo);
      toast.success("Lançamento excluído com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast.error("Erro ao excluir lançamento");
      return false;
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
