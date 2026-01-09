
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/company-context";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, parseISO } from "date-fns";

export interface CategoriaFinanceira {
  categoria_id: string;
  categoria_nome: string;
  classificacao_dre: string;
  tipo_operacao: "pagar" | "receber";
  total: number;
  percentual: number;
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  resultadoLiquido: number;
}

export type PeriodoFiltro = "mes_atual" | "trimestre" | "ano" | "personalizado";

export interface FiltroFinanceiro {
  periodo: PeriodoFiltro;
  dataInicio: Date;
  dataFim: Date;
}

export function useRelatorioFinanceiro() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [categoriasDespesas, setCategoriasDespesas] = useState<CategoriaFinanceira[]>([]);
  const [categoriasReceitas, setCategoriasReceitas] = useState<CategoriaFinanceira[]>([]);
  const [fluxoMensal, setFluxoMensal] = useState<FluxoMensal[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalReceitas: 0,
    totalDespesas: 0,
    resultadoLiquido: 0,
  });
  const [filtro, setFiltro] = useState<FiltroFinanceiro>({
    periodo: "ano",
    dataInicio: startOfYear(new Date()),
    dataFim: endOfYear(new Date()),
  });

  const atualizarPeriodo = (periodo: PeriodoFiltro, dataInicio?: Date, dataFim?: Date) => {
    let novaDataInicio: Date;
    let novaDataFim: Date;

    switch (periodo) {
      case "mes_atual":
        novaDataInicio = startOfMonth(new Date());
        novaDataFim = endOfMonth(new Date());
        break;
      case "trimestre":
        novaDataInicio = subMonths(startOfMonth(new Date()), 2);
        novaDataFim = endOfMonth(new Date());
        break;
      case "ano":
        novaDataInicio = startOfYear(new Date());
        novaDataFim = endOfYear(new Date());
        break;
      case "personalizado":
        novaDataInicio = dataInicio || startOfMonth(new Date());
        novaDataFim = dataFim || endOfMonth(new Date());
        break;
      default:
        novaDataInicio = startOfYear(new Date());
        novaDataFim = endOfYear(new Date());
    }

    setFiltro({
      periodo,
      dataInicio: novaDataInicio,
      dataFim: novaDataFim,
    });
  };

  const fetchDados = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const dataInicioStr = format(filtro.dataInicio, "yyyy-MM-dd");
      const dataFimStr = format(filtro.dataFim, "yyyy-MM-dd");

      // Buscar movimentações com join no plano_contas
      const { data: movimentacoes, error } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          tipo_operacao,
          valor,
          data_lancamento,
          categoria_id,
          plano_contas:categoria_id (
            id,
            descricao,
            classificacao_dre
          )
        `)
        .eq("empresa_id", currentCompany.id)
        .gte("data_lancamento", dataInicioStr)
        .lte("data_lancamento", dataFimStr)
        .in("tipo_operacao", ["pagar", "receber"]);

      if (error) {
        console.error("Erro ao buscar movimentações:", error);
        return;
      }

      // Agrupar por categoria
      const categoriasDespesasMap = new Map<string, CategoriaFinanceira>();
      const categoriasReceitasMap = new Map<string, CategoriaFinanceira>();
      const fluxoMensalMap = new Map<string, FluxoMensal>();

      let totalReceitas = 0;
      let totalDespesas = 0;

      movimentacoes?.forEach((mov: any) => {
        const valor = Number(mov.valor) || 0;
        const tipoOperacao = mov.tipo_operacao as "pagar" | "receber";
        const categoriaId = mov.categoria_id || "sem_categoria";
        const categoriaNome = mov.plano_contas?.descricao || "Sem Categoria";
        const classificacaoDre = mov.plano_contas?.classificacao_dre || "Não classificado";

        // Acumular totais
        if (tipoOperacao === "receber") {
          totalReceitas += valor;
        } else {
          totalDespesas += valor;
        }

        // Agrupar por categoria
        const mapAlvo = tipoOperacao === "pagar" ? categoriasDespesasMap : categoriasReceitasMap;
        const existente = mapAlvo.get(categoriaId);

        if (existente) {
          existente.total += valor;
        } else {
          mapAlvo.set(categoriaId, {
            categoria_id: categoriaId,
            categoria_nome: categoriaNome,
            classificacao_dre: classificacaoDre,
            tipo_operacao: tipoOperacao,
            total: valor,
            percentual: 0,
          });
        }

        // Agrupar por mês
        const dataLancamento = parseISO(mov.data_lancamento);
        const mesAno = format(dataLancamento, "yyyy-MM");
        const mesNome = format(dataLancamento, "MMM/yyyy");
        const mesNumero = dataLancamento.getMonth() + 1;
        const ano = dataLancamento.getFullYear();

        const fluxoExistente = fluxoMensalMap.get(mesAno);
        if (fluxoExistente) {
          if (tipoOperacao === "receber") {
            fluxoExistente.receitas += valor;
          } else {
            fluxoExistente.despesas += valor;
          }
          fluxoExistente.saldo = fluxoExistente.receitas - fluxoExistente.despesas;
        } else {
          fluxoMensalMap.set(mesAno, {
            mes: mesNome,
            mes_numero: mesNumero,
            ano: ano,
            receitas: tipoOperacao === "receber" ? valor : 0,
            despesas: tipoOperacao === "pagar" ? valor : 0,
            saldo: tipoOperacao === "receber" ? valor : -valor,
          });
        }
      });

      // Calcular percentuais
      const despesasArray = Array.from(categoriasDespesasMap.values()).map(cat => ({
        ...cat,
        percentual: totalDespesas > 0 ? (cat.total / totalDespesas) * 100 : 0,
      }));

      const receitasArray = Array.from(categoriasReceitasMap.values()).map(cat => ({
        ...cat,
        percentual: totalReceitas > 0 ? (cat.total / totalReceitas) * 100 : 0,
      }));

      // Ordenar por valor (maior primeiro)
      despesasArray.sort((a, b) => b.total - a.total);
      receitasArray.sort((a, b) => b.total - a.total);

      // Ordenar fluxo mensal por data
      const fluxoArray = Array.from(fluxoMensalMap.values()).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes_numero - b.mes_numero;
      });

      setCategoriasDespesas(despesasArray);
      setCategoriasReceitas(receitasArray);
      setFluxoMensal(fluxoArray);
      setResumo({
        totalReceitas,
        totalDespesas,
        resultadoLiquido: totalReceitas - totalDespesas,
      });
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [currentCompany?.id, filtro.dataInicio, filtro.dataFim]);

  return {
    loading,
    categoriasDespesas,
    categoriasReceitas,
    fluxoMensal,
    resumo,
    filtro,
    atualizarPeriodo,
    refetch: fetchDados,
  };
}
