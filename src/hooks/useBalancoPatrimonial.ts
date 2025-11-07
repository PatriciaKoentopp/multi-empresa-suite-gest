
import { useState, useMemo } from 'react';
import { useLancamentosContabeis } from './useLancamentosContabeis';
import { PlanoConta } from '@/types/plano-contas';
import { LancamentoContabil } from '@/types/lancamentos-contabeis';

export interface ContaBalanco {
  codigo: string;
  descricao: string;
  grupo: "Ativo" | "Passivo" | "Patrimônio";
  saldoInicial: number;
  debito: number;
  credito: number;
  saldoFinal: number;
  tipo: "título" | "movimentação";
  filhas?: ContaBalanco[];
  nivel?: number; // Adicionado para indentação na UI
}

export function useBalancoPatrimonial() {
  const { lancamentos, planosContas, isLoading, carregarDados } = useLancamentosContabeis();
  const [periodo, setPeriodo] = useState<"acumulado" | "mensal">("acumulado");
  const [ano, setAno] = useState<string>(new Date().getFullYear().toString());
  const [mes, setMes] = useState<string>("todos");

  // Separar lançamentos em anteriores ao período e dentro do período selecionado
  const { lancamentosAnteriores, lancamentosDoPeriodo } = useMemo(() => {
    // Determinamos a data limite para o período atual
    let dataLimite: Date;
    
    if (periodo === "mensal" && mes !== "todos") {
      // Se for mensal, a data limite é o primeiro dia do mês selecionado
      dataLimite = new Date(Number(ano), Number(mes) - 1, 1);
    } else {
      // Se for acumulado ou todos os meses, a data limite é o primeiro dia do ano
      dataLimite = new Date(Number(ano), 0, 1);
    }
    
    console.log(`Data limite para saldo inicial: ${dataLimite.toLocaleDateString('pt-BR')}`);
    
    // Função para converter string de data para objeto Date
    const converterData = (dataStr: string): Date => {
      if (dataStr.includes('/')) {
        const [dd, mm, yyyy] = dataStr.split('/');
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      }
      return new Date(dataStr);
    };

    // Separar lançamentos anteriores e do período atual
    const anteriores: LancamentoContabil[] = [];
    const doPeriodo: LancamentoContabil[] = [];

    lancamentos.forEach(lancamento => {
      if (!lancamento.data) return;
      
      const dataLanc = converterData(lancamento.data);
      
      // Filtrar por data limite
      if (dataLanc < dataLimite) {
        anteriores.push(lancamento);
      } else {
        // Para o período atual, ainda precisamos filtrar por ano e mês
        const anoLancamento = dataLanc.getFullYear().toString();
        
        if (anoLancamento === ano) {
          // Se for mensal, verificamos o mês selecionado
          if (periodo === "mensal" && mes !== "todos") {
            const mesLancamento = (dataLanc.getMonth() + 1).toString().padStart(2, "0");
            if (mesLancamento === mes) {
              doPeriodo.push(lancamento);
            }
          } else {
            // Se for acumulado ou todos os meses, incluímos todos os lançamentos do ano
            doPeriodo.push(lancamento);
          }
        }
      }
    });
    
    console.log(`Lançamentos anteriores ao período: ${anteriores.length}`);
    console.log(`Lançamentos do período: ${doPeriodo.length}`);
    
    return {
      lancamentosAnteriores: anteriores,
      lancamentosDoPeriodo: doPeriodo
    };
  }, [lancamentos, ano, mes, periodo]);

  // Processar contas do balanço
  const contasBalanco = useMemo(() => {
    console.log("Total de lançamentos do período:", lancamentosDoPeriodo.length);
    console.log("Total de lançamentos anteriores:", lancamentosAnteriores.length);
    
    // Agrupar plano de contas por tipo
    const contasAtivo = planosContas.filter(c => c.tipo === "ativo");
    const contasPassivo = planosContas.filter(c => c.tipo === "passivo");
    const contasPatrimonio = planosContas.filter(c => c.tipo === "patrimonio");
    
    console.log("Contas Ativo:", contasAtivo.length);
    console.log("Contas Passivo:", contasPassivo.length);
    console.log("Contas Patrimônio:", contasPatrimonio.length);

    // Função auxiliar para calcular saldo inicial da conta baseado em lançamentos anteriores
    const calcularSaldoInicial = (conta: PlanoConta): number => {
      const lancamentosConta = lancamentosAnteriores.filter(l => l.conta === conta.id);
      
      // Calcular débitos e créditos
      const totalDebitosAnteriores = lancamentosConta
        .filter(l => l.tipo === "debito")
        .reduce((sum, l) => sum + l.valor, 0);
        
      const totalCreditosAnteriores = lancamentosConta
        .filter(l => l.tipo === "credito")
        .reduce((sum, l) => sum + l.valor, 0);
      
      // Calcular saldo inicial baseado no tipo de conta
      let saldoInicial = 0;
      
      // Para contas do ativo: Saldo = Débitos - Créditos
      // Para contas do passivo e patrimônio: Saldo = Créditos - Débitos
      if (conta.tipo === "ativo") {
        saldoInicial = totalDebitosAnteriores - totalCreditosAnteriores;
      } else {
        saldoInicial = totalCreditosAnteriores - totalDebitosAnteriores;
      }
      
      return saldoInicial;
    };
    
    // Função auxiliar para calcular valores das contas no período selecionado
    const calcularSaldoConta = (conta: PlanoConta): ContaBalanco => {
      // Filtrar lançamentos desta conta no período selecionado
      const lancamentosConta = lancamentosDoPeriodo.filter(l => l.conta === conta.id);
      
      console.log(`Conta ${conta.codigo} (${conta.descricao}): ${lancamentosConta.length} lançamentos no período`);
      
      // Calcular saldo inicial baseado em lançamentos anteriores
      const saldoInicial = calcularSaldoInicial(conta);
      
      // Calcular débitos e créditos do período
      const totalDebitos = lancamentosConta
        .filter(l => l.tipo === "debito")
        .reduce((sum, l) => sum + l.valor, 0);
        
      const totalCreditos = lancamentosConta
        .filter(l => l.tipo === "credito")
        .reduce((sum, l) => sum + l.valor, 0);
      
      // Calcular saldo final baseado no tipo de conta
      // Saldo final = Saldo inicial + movimentações do período
      let saldoFinal = 0;
      
      // Determinar o grupo da conta
      let grupo: "Ativo" | "Passivo" | "Patrimônio";
      
      if (conta.tipo === "ativo") {
        grupo = "Ativo";
        saldoFinal = saldoInicial + (totalDebitos - totalCreditos);
      } else if (conta.tipo === "passivo") {
        grupo = "Passivo";
        saldoFinal = saldoInicial + (totalCreditos - totalDebitos);
      } else {
        grupo = "Patrimônio";
        saldoFinal = saldoInicial + (totalCreditos - totalDebitos);
      }
      
      return {
        codigo: conta.codigo,
        descricao: conta.descricao,
        grupo: grupo,
        saldoInicial: saldoInicial,
        debito: totalDebitos,
        credito: totalCreditos,
        saldoFinal: saldoFinal,
        tipo: conta.categoria
      };
    };

    // Ordenar contas por código para facilitar a estrutura hierárquica
    const contasAtivoOrdenadas = [...contasAtivo].sort((a, b) => a.codigo.localeCompare(b.codigo));
    const contasPassivoOrdenadas = [...contasPassivo].sort((a, b) => a.codigo.localeCompare(b.codigo));
    const contasPatrimonioOrdenadas = [...contasPatrimonio].sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    // Calcular o balanço para todas as contas
    const todasContasAtivo = contasAtivoOrdenadas.map(calcularSaldoConta);
    const todasContasPassivo = contasPassivoOrdenadas.map(calcularSaldoConta);
    const todasContasPatrimonio = contasPatrimonioOrdenadas.map(calcularSaldoConta);
    
    // Função para verificar se uma conta é filha direta de outra
    const isFilhaDireta = (possibleChild: string, possibleParent: string): boolean => {
      // Se os códigos são iguais, não é filha
      if (possibleChild === possibleParent) return false;
      
      // Se a possível filha não começa com o código do pai + '.', não é filha
      if (!possibleChild.startsWith(possibleParent + '.')) return false;
      
      // Verificar se é filha direta (não tem outro nível intermediário)
      // Exemplo: '01.1' é filha direta de '01', mas '01.1.1' não é filha direta de '01'
      const parentParts = possibleParent.split('.');
      const childParts = possibleChild.split('.');
      
      // Se a diferença de níveis é 1, é filha direta
      return childParts.length === parentParts.length + 1;
    };
    
    // Função para encontrar todas as contas filhas diretas de um código
    const encontrarFilhasDirectas = (codigo: string, contas: ContaBalanco[]): ContaBalanco[] => {
      return contas.filter(c => isFilhaDireta(c.codigo, codigo));
    };
    
    // Função para montar a árvore hierárquica completa
    const montarArvoreHierarquica = (contas: ContaBalanco[]): ContaBalanco[] => {
      // Map para armazenar todas as contas por código
      const contasPorCodigo = new Map<string, ContaBalanco>();
      
      // Primeiro, adicionar todas as contas ao map
      contas.forEach(conta => {
        contasPorCodigo.set(conta.codigo, { ...conta, filhas: [] });
      });
      
      // Contas raiz (serão retornadas no final)
      const contasRaiz: ContaBalanco[] = [];
      
      // Para cada conta, encontrar as filhas diretas e adicionar
      Array.from(contasPorCodigo.keys()).forEach(codigo => {
        const conta = contasPorCodigo.get(codigo)!;
        
        // Encontrar todas as filhas diretas
        const filhasDirectas = Array.from(contasPorCodigo.values())
          .filter(c => isFilhaDireta(c.codigo, codigo));
        
        if (filhasDirectas.length > 0) {
          conta.filhas = filhasDirectas;
        }
        
        // Se não é filha de ninguém, é uma conta raiz
        const temPai = Array.from(contasPorCodigo.keys())
          .some(codigoPai => isFilhaDireta(codigo, codigoPai));
        
        if (!temPai) {
          contasRaiz.push(conta);
        }
      });
      
      return contasRaiz;
    };
    
    // Função recursiva para calcular saldos acumulados de cada nível
    const calcularSaldosAcumulados = (conta: ContaBalanco): ContaBalanco => {
      // Se a conta não tem filhas ou é do tipo 'movimentação', retorna a própria conta
      if (!conta.filhas || conta.filhas.length === 0) {
        return conta;
      }
      
      // Processar recursivamente todas as filhas para garantir que seus valores estão atualizados
      const filhasProcessadas = conta.filhas.map(calcularSaldosAcumulados);
      
      // Recalcular os totais somando os valores das filhas
      let saldoInicialTotal = 0;
      let debitoTotal = 0;
      let creditoTotal = 0;
      
      filhasProcessadas.forEach(filha => {
        saldoInicialTotal += filha.saldoInicial;
        debitoTotal += filha.debito;
        creditoTotal += filha.credito;
      });
      
      // Calcular o saldo final acumulado baseado no grupo da conta
      const saldoFinalAcumulado = saldoInicialTotal + (
        conta.grupo === "Ativo" 
        ? debitoTotal - creditoTotal
        : creditoTotal - debitoTotal
      );
      
      // Atualizar a conta com os valores acumulados das filhas
      return {
        ...conta,
        saldoInicial: saldoInicialTotal,
        debito: debitoTotal,
        credito: creditoTotal,
        saldoFinal: saldoFinalAcumulado,
        filhas: filhasProcessadas
      };
    };
    
    // Montar as árvores hierárquicas
    const arvoreAtivo = montarArvoreHierarquica(todasContasAtivo);
    const arvorePassivo = montarArvoreHierarquica(todasContasPassivo);
    const arvorePatrimonio = montarArvoreHierarquica(todasContasPatrimonio);
    
    // Calcular os saldos acumulados para as árvores
    const arvoreAtivoProcessada = arvoreAtivo.map(calcularSaldosAcumulados);
    const arvorePassivoProcessada = arvorePassivo.map(calcularSaldosAcumulados);
    const arvorePatrimonioProcessada = arvorePatrimonio.map(calcularSaldosAcumulados);
    
    // Função para nivelar a árvore em uma lista plana para renderização
    const nivelarArvore = (contas: ContaBalanco[], nivel = 0): ContaBalanco[] => {
      let resultado: ContaBalanco[] = [];
      
      contas.forEach(conta => {
        // Adicionar a conta atual com seu nível
        resultado.push({
          ...conta,
          nivel,
          filhas: undefined // Remover filhas para evitar duplicação
        });
        
        // Se tem filhas, adicionar recursivamente com nível incrementado
        if (conta.filhas && conta.filhas.length > 0) {
          resultado = [...resultado, ...nivelarArvore(conta.filhas, nivel + 1)];
        }
      });
      
      return resultado;
    };
    
    // Nivelar as árvores para renderização
    const contasAtivoNiveladas = nivelarArvore(arvoreAtivoProcessada);
    const contasPassivoNiveladas = nivelarArvore(arvorePassivoProcessada);
    const contasPatrimonioNiveladas = nivelarArvore(arvorePatrimonioProcessada);
    
    // Calcular totais gerais
    const totalAtivo = arvoreAtivoProcessada.reduce((sum, conta) => sum + conta.saldoFinal, 0);
    const totalPassivo = arvorePassivoProcessada.reduce((sum, conta) => sum + conta.saldoFinal, 0);
    const totalPatrimonio = arvorePatrimonioProcessada.reduce((sum, conta) => sum + conta.saldoFinal, 0);
    
    // Total passivo + patrimônio juntos
    const totalPassivoPatrimonio = totalPassivo + totalPatrimonio;
    
    console.log("Total Ativo:", totalAtivo);
    console.log("Total Passivo:", totalPassivo);
    console.log("Total Patrimônio:", totalPatrimonio);
    console.log("Total Passivo + Patrimônio:", totalPassivoPatrimonio);

    return {
      contasAtivo: contasAtivoNiveladas,
      contasPassivo: contasPassivoNiveladas,
      contasPatrimonio: contasPatrimonioNiveladas,
      totalAtivo,
      totalPassivo,
      totalPatrimonio,
      totalPassivoPatrimonio
    };
  }, [planosContas, lancamentosDoPeriodo, lancamentosAnteriores]);

  return {
    contasBalanco,
    isLoading,
    carregarDados,
    periodo,
    setPeriodo,
    ano,
    setAno,
    mes,
    setMes
  };
}
