
import { useState, useMemo } from 'react';
import { useLancamentosContabeis } from './useLancamentosContabeis';
import { PlanoConta } from '@/types/plano-contas';
import { LancamentoContabil } from '@/types/movimentacoes';

export interface ContaBalanco {
  codigo: string;
  descricao: string;
  grupo: "Ativo" | "Passivo";
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

  // Filtrar lançamentos conforme período selecionado
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter(l => {
      // Converter a data do lançamento para um objeto Date para filtro
      if (!l.data) return false;
      
      let dataLanc: Date | null = null;
      if (typeof l.data === "string") {
        if (l.data.includes("/")) {
          const [dd, mm, yyyy] = l.data.split("/");
          dataLanc = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
        } else {
          // Se for uma data ISO, converter para Date
          dataLanc = new Date(l.data);
        }
      }

      if (!dataLanc) return false;
      
      // Filtrar por ano
      const anoLancamento = dataLanc.getFullYear().toString();
      if (anoLancamento !== ano) return false;
      
      // Filtrar por mês se necessário
      if (mes !== "todos" && periodo === "mensal") {
        const mesLancamento = (dataLanc.getMonth() + 1).toString().padStart(2, "0");
        if (mesLancamento !== mes) return false;
      }
      
      return true;
    });
  }, [lancamentos, ano, mes, periodo]);

  // Processar contas do balanço
  const contasBalanco = useMemo(() => {
    console.log("Total de lançamentos filtrados:", lancamentosFiltrados.length);
    
    // Agrupar plano de contas por tipo (Ativo/Passivo)
    const contasAtivo = planosContas.filter(c => c.tipo === "ativo");
    const contasPassivo = planosContas.filter(c => c.tipo === "passivo");
    
    console.log("Contas Ativo:", contasAtivo.length);
    console.log("Contas Passivo:", contasPassivo.length);

    // Função auxiliar para calcular valores das contas
    const calcularSaldoConta = (conta: PlanoConta): ContaBalanco => {
      // Filtrar lançamentos desta conta
      const lancamentosConta = lancamentosFiltrados.filter(l => l.conta === conta.id);
      
      console.log(`Conta ${conta.codigo} (${conta.descricao}): ${lancamentosConta.length} lançamentos`);
      
      // Calcular débitos e créditos
      const totalDebitos = lancamentosConta
        .filter(l => l.tipo === "debito")
        .reduce((sum, l) => sum + l.valor, 0);
        
      const totalCreditos = lancamentosConta
        .filter(l => l.tipo === "credito")
        .reduce((sum, l) => sum + l.valor, 0);
      
      // Calcular saldo final baseado no tipo de conta
      let saldoFinal = 0;
      
      // Para contas do ativo: Saldo = Débitos - Créditos
      // Para contas do passivo: Saldo = Créditos - Débitos
      if (conta.tipo === "ativo") {
        saldoFinal = totalDebitos - totalCreditos;
      } else {
        saldoFinal = totalCreditos - totalDebitos;
      }
      
      return {
        codigo: conta.codigo,
        descricao: conta.descricao,
        grupo: conta.tipo === "ativo" ? "Ativo" : "Passivo",
        saldoInicial: 0, // Não temos saldo inicial nos dados, começamos de zero
        debito: totalDebitos,
        credito: totalCreditos,
        saldoFinal: saldoFinal,
        tipo: conta.categoria
      };
    };

    // Ordenar contas por código para facilitar a estrutura hierárquica
    const contasAtivoOrdenadas = [...contasAtivo].sort((a, b) => a.codigo.localeCompare(b.codigo));
    const contasPassivoOrdenadas = [...contasPassivo].sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    // Calcular o balanço para todas as contas
    const todasContasAtivo = contasAtivoOrdenadas.map(calcularSaldoConta);
    const todasContasPassivo = contasPassivoOrdenadas.map(calcularSaldoConta);
    
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
      let debitoTotal = 0;
      let creditoTotal = 0;
      
      filhasProcessadas.forEach(filha => {
        debitoTotal += filha.debito;
        creditoTotal += filha.credito;
      });
      
      // Calcular o saldo final conforme o grupo (Ativo ou Passivo)
      const saldoFinalAcumulado = conta.grupo === "Ativo" 
        ? debitoTotal - creditoTotal
        : creditoTotal - debitoTotal;
      
      // Atualizar a conta com os valores acumulados das filhas
      return {
        ...conta,
        debito: debitoTotal,
        credito: creditoTotal,
        saldoFinal: saldoFinalAcumulado,
        filhas: filhasProcessadas
      };
    };
    
    // Montar as árvores hierárquicas
    const arvoreAtivo = montarArvoreHierarquica(todasContasAtivo);
    const arvorePassivo = montarArvoreHierarquica(todasContasPassivo);
    
    // Calcular os saldos acumulados para as árvores
    const arvoreAtivoProcessada = arvoreAtivo.map(calcularSaldosAcumulados);
    const arvorePassivoProcessada = arvorePassivo.map(calcularSaldosAcumulados);
    
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
    
    // Calcular totais gerais
    const totalAtivo = arvoreAtivoProcessada.reduce((sum, conta) => sum + conta.saldoFinal, 0);
    const totalPassivo = arvorePassivoProcessada.reduce((sum, conta) => sum + conta.saldoFinal, 0);
    
    console.log("Total Ativo:", totalAtivo);
    console.log("Total Passivo:", totalPassivo);

    return {
      contasAtivo: contasAtivoNiveladas,
      contasPassivo: contasPassivoNiveladas,
      totalAtivo,
      totalPassivo
    };
  }, [planosContas, lancamentosFiltrados]);

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
