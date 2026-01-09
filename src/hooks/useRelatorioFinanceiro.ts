
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

      // Buscar parcelas pagas com join nas movimentações e plano_contas (regime de caixa)
      const { data: parcelas, error } = await supabase
        .from("movimentacoes_parcelas")
        .select(`
          id,
          valor,
          data_pagamento,
          juros,
          multa,
          desconto,
          movimentacoes:movimentacao_id (
            id,
            tipo_operacao,
            categoria_id,
            empresa_id,
            plano_contas:categoria_id (
              id,
              descricao,
              classificacao_dre
            )
          )
        `)
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", dataInicioStr)
        .lte("data_pagamento", dataFimStr);

      if (error) {
        console.error("Erro ao buscar parcelas:", error);
        return;
      }

      // Filtrar apenas parcelas da empresa atual
      const parcelasFiltradas = parcelas?.filter(
        (p: any) => p.movimentacoes?.empresa_id === currentCompany.id
      ) || [];

      // Agrupar por categoria
      const categoriasDespesasMap = new Map<string, CategoriaFinanceira>();
      const categoriasReceitasMap = new Map<string, CategoriaFinanceira>();
      const fluxoMensalMap = new Map<string, FluxoMensal>();

      let totalReceitas = 0;
      let totalDespesas = 0;

      parcelasFiltradas.forEach((parcela: any) => {
        const mov = parcela.movimentacoes;
        if (!mov) return;

        // Calcular valor efetivo da parcela (incluindo juros, multa e desconto)
        const valorEfetivo = 
          Number(parcela.valor || 0) + 
          Number(parcela.juros || 0) + 
          Number(parcela.multa || 0) - 
          Number(parcela.desconto || 0);

        const tipoOperacao = mov.tipo_operacao as "pagar" | "receber";
        const categoriaId = mov.categoria_id || "sem_categoria";
        const categoriaNome = mov.plano_contas?.descricao || "Sem Categoria";
        const classificacaoDre = mov.plano_contas?.classificacao_dre || "Não classificado";

        // Acumular totais
        if (tipoOperacao === "receber") {
          totalReceitas += valorEfetivo;
        } else {
          totalDespesas += valorEfetivo;
        }

        // Agrupar por categoria
        const mapAlvo = tipoOperacao === "pagar" ? categoriasDespesasMap : categoriasReceitasMap;
        const existente = mapAlvo.get(categoriaId);

        if (existente) {
          existente.total += valorEfetivo;
        } else {
          mapAlvo.set(categoriaId, {
            categoria_id: categoriaId,
            categoria_nome: categoriaNome,
            classificacao_dre: classificacaoDre,
            tipo_operacao: tipoOperacao,
            total: valorEfetivo,
            percentual: 0,
          });
        }

        // Agrupar por mês (usando data_pagamento)
        const dataPagamento = parseISO(parcela.data_pagamento);
        const mesAno = format(dataPagamento, "yyyy-MM");
        const mesNome = format(dataPagamento, "MMM/yyyy");
        const mesNumero = dataPagamento.getMonth() + 1;
        const ano = dataPagamento.getFullYear();

        const fluxoExistente = fluxoMensalMap.get(mesAno);
        if (fluxoExistente) {
          if (tipoOperacao === "receber") {
            fluxoExistente.receitas += valorEfetivo;
          } else {
            fluxoExistente.despesas += valorEfetivo;
          }
          fluxoExistente.saldo = fluxoExistente.receitas - fluxoExistente.despesas;
        } else {
          fluxoMensalMap.set(mesAno, {
            mes: mesNome,
            mes_numero: mesNumero,
            ano: ano,
            receitas: tipoOperacao === "receber" ? valorEfetivo : 0,
            despesas: tipoOperacao === "pagar" ? valorEfetivo : 0,
            saldo: tipoOperacao === "receber" ? valorEfetivo : -valorEfetivo,
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
