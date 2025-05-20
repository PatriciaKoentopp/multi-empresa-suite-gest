
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
        saldoFinal: saldoFinal
      };
    };

    // Mapear contas para formato de balanço
    const contasBalancoAtivo = contasAtivo.map(calcularSaldoConta);
    const contasBalancoPassivo = contasPassivo.map(calcularSaldoConta);
    
    // Calcular totais
    const totalAtivo = contasBalancoAtivo.reduce((sum, c) => sum + c.saldoFinal, 0);
    const totalPassivo = contasBalancoPassivo.reduce((sum, c) => sum + c.saldoFinal, 0);
    
    console.log("Total Ativo:", totalAtivo);
    console.log("Total Passivo:", totalPassivo);

    return {
      contasAtivo: contasBalancoAtivo,
      contasPassivo: contasBalancoPassivo,
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
