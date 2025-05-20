
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
    
    // Função para verificar se uma conta é filha de outra
    const isFilha = (possibleChild: string, possibleParent: string): boolean => {
      // Ex: '01.1.1.01' é filha de '01.1.1'
      return possibleChild !== possibleParent && 
             possibleChild.startsWith(possibleParent) && 
             possibleChild.charAt(possibleParent.length) === '.';
    };
    
    // Função para montar a estrutura hierárquica de contas
    const montarHierarquia = (contas: ContaBalanco[]): ContaBalanco[] => {
      const result: ContaBalanco[] = [];
      const contasMap: Record<string, ContaBalanco> = {};
      
      // Primeiro, colocar todas as contas em um mapa para acesso rápido
      contas.forEach(conta => {
        contasMap[conta.codigo] = { ...conta, filhas: [] };
      });
      
      // Depois, montar a hierarquia
      Object.keys(contasMap).forEach(codigo => {
        const conta = contasMap[codigo];
        
        // Encontrar o pai direto desta conta
        let codigoPai = '';
        let depth = Number.MAX_VALUE;
        
        Object.keys(contasMap).forEach(possibleParent => {
          // Verificamos se possibleParent é um pai deste código
          // E se é o pai mais próximo (com mais níveis)
          if (isFilha(codigo, possibleParent)) {
            const possibleDepth = possibleParent.split('.').length;
            if (possibleDepth < depth) {
              depth = possibleDepth;
              codigoPai = possibleParent;
            }
          }
        });
        
        if (codigoPai) {
          // Se tem pai, adicionar como filha
          contasMap[codigoPai].filhas = contasMap[codigoPai].filhas || [];
          contasMap[codigoPai].filhas?.push(conta);
        } else {
          // Se não tem pai, é uma conta de nível raiz
          result.push(conta);
        }
      });
      
      return result;
    };
    
    // Função para calcular os saldos acumulados nas contas de título
    const calcularSaldosAcumulados = (conta: ContaBalanco): ContaBalanco => {
      // Se não tem filhas, retornar a própria conta
      if (!conta.filhas || conta.filhas.length === 0) {
        return conta;
      }
      
      // Processar recursivamente as filhas
      const filhasProcessadas = conta.filhas.map(calcularSaldosAcumulados);
      
      // Acumular os totais das filhas
      let debitoTotal = conta.debito;
      let creditoTotal = conta.credito;
      
      filhasProcessadas.forEach(filha => {
        debitoTotal += filha.debito;
        creditoTotal += filha.credito;
      });
      
      // Calcular saldo final baseado no tipo da conta
      let saldoFinalAcumulado = 0;
      if (conta.grupo === "Ativo") {
        saldoFinalAcumulado = debitoTotal - creditoTotal;
      } else {
        saldoFinalAcumulado = creditoTotal - debitoTotal;
      }
      
      // Atualizar a conta com os valores acumulados
      return {
        ...conta,
        debito: debitoTotal,
        credito: creditoTotal,
        saldoFinal: saldoFinalAcumulado,
        filhas: filhasProcessadas
      };
    };
    
    // Montar a hierarquia e calcular saldos acumulados
    const hierarquiaAtivo = montarHierarquia(todasContasAtivo);
    const hierarquiaPassivo = montarHierarquia(todasContasPassivo);
    
    const contasAtivoProcessadas = hierarquiaAtivo.map(calcularSaldosAcumulados);
    const contasPassivoProcessadas = hierarquiaPassivo.map(calcularSaldosAcumulados);
    
    // Função para nivelar a hierarquia em uma lista plana
    const nivelarContas = (contas: ContaBalanco[], nivel = 0): ContaBalanco[] => {
      let resultado: ContaBalanco[] = [];
      
      contas.forEach(conta => {
        // Adicionar a conta atual com seu nível de indentação
        resultado.push({
          ...conta,
          nivel: nivel, // Podemos usar isso para indentação na UI
          filhas: undefined // Remover filhas para evitar duplicação
        });
        
        // Se tem filhas, processar recursivamente
        if (conta.filhas && conta.filhas.length > 0) {
          resultado = [...resultado, ...nivelarContas(conta.filhas, nivel + 1)];
        }
      });
      
      return resultado;
    };
    
    // Nivelar a hierarquia para exibição linear na tabela
    const contasAtivoNiveladas = nivelarContas(contasAtivoProcessadas);
    const contasPassivoNiveladas = nivelarContas(contasPassivoProcessadas);
    
    // Calcular totais gerais
    const totalAtivo = contasAtivoNiveladas
      .filter(c => !c.codigo.includes('.')) // Apenas contas de primeiro nível
      .reduce((sum, c) => sum + c.saldoFinal, 0);
      
    const totalPassivo = contasPassivoNiveladas
      .filter(c => !c.codigo.includes('.')) // Apenas contas de primeiro nível
      .reduce((sum, c) => sum + c.saldoFinal, 0);
    
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
