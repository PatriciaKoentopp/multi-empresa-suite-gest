import { useMemo } from "react";
import { HoraTrabalhadaData, SpreadsheetData } from "./useSpreadsheetData";

export interface TempoMetrics {
  totalHoras: number;
  horasFaturaveis: number;
  horasNaoFaturaveis: number;
  valorTotalFaturavel: number;
  totalProjetos: number;
  totalTarefas: number;
  totalUsuarios: number;
  mediaHorasPorProjeto: number;
}

export interface ProjetoAgrupado {
  projeto: string;
  cliente: string;
  totalHoras: number;
  valorFaturavel: number;
  percentualTotal: number;
  tarefas: {
    tarefa: string;
    usuario: string;
    horas: number;
    faturavel: boolean;
  }[];
}

export const useRelatorioTempo = (data: SpreadsheetData[]) => {
  const horasData: HoraTrabalhadaData[] = useMemo(() => {
    return data.map((item) => item.dados as HoraTrabalhadaData);
  }, [data]);

  const metrics: TempoMetrics = useMemo(() => {
    const totalHoras = horasData.reduce((sum, h) => sum + h.duracao_decimal, 0);
    const horasFaturaveis = horasData
      .filter((h) => h.faturavel)
      .reduce((sum, h) => sum + h.duracao_decimal, 0);
    const valorTotalFaturavel = horasData.reduce((sum, h) => sum + h.valor_faturavel, 0);
    const projetos = new Set(horasData.map((h) => h.projeto)).size;
    const usuarios = new Set(horasData.map((h) => h.usuario)).size;

    return {
      totalHoras,
      horasFaturaveis,
      horasNaoFaturaveis: totalHoras - horasFaturaveis,
      valorTotalFaturavel,
      totalProjetos: projetos,
      totalTarefas: horasData.length,
      totalUsuarios: usuarios,
      mediaHorasPorProjeto: projetos > 0 ? totalHoras / projetos : 0,
    };
  }, [horasData]);

  const projetosAgrupados: ProjetoAgrupado[] = useMemo(() => {
    const projetosMap = new Map<string, ProjetoAgrupado>();

    horasData.forEach((hora) => {
      const key = hora.projeto;
      if (!projetosMap.has(key)) {
        projetosMap.set(key, {
          projeto: hora.projeto,
          cliente: hora.cliente,
          totalHoras: 0,
          valorFaturavel: 0,
          percentualTotal: 0,
          tarefas: [],
        });
      }

      const projeto = projetosMap.get(key)!;
      projeto.totalHoras += hora.duracao_decimal;
      projeto.valorFaturavel += hora.valor_faturavel;
      projeto.tarefas.push({
        tarefa: hora.tarefa,
        usuario: hora.usuario,
        horas: hora.duracao_decimal,
        faturavel: hora.faturavel,
      });
    });

    // Calcular percentuais
    const totalGeral = metrics.totalHoras;
    const projetos = Array.from(projetosMap.values());
    projetos.forEach((p) => {
      p.percentualTotal = totalGeral > 0 ? (p.totalHoras / totalGeral) * 100 : 0;
    });

    return projetos.sort((a, b) => b.totalHoras - a.totalHoras);
  }, [horasData, metrics.totalHoras]);

  const tarefasDistribuicao = useMemo(() => {
    const tarefasMap = new Map<string, number>();
    horasData.forEach((hora) => {
      const key = hora.tarefa;
      tarefasMap.set(key, (tarefasMap.get(key) || 0) + hora.duracao_decimal);
    });

    return Array.from(tarefasMap.entries())
      .map(([tarefa, horas]) => ({ tarefa, horas }))
      .sort((a, b) => b.horas - a.horas)
      .slice(0, 10);
  }, [horasData]);

  const usuariosDistribuicao = useMemo(() => {
    const usuariosMap = new Map<string, { horas: number; faturavel: number; valor: number }>();
    
    horasData.forEach((hora) => {
      const key = hora.usuario;
      if (!usuariosMap.has(key)) {
        usuariosMap.set(key, { horas: 0, faturavel: 0, valor: 0 });
      }
      const usuario = usuariosMap.get(key)!;
      usuario.horas += hora.duracao_decimal;
      if (hora.faturavel) {
        usuario.faturavel += hora.duracao_decimal;
      }
      usuario.valor += hora.valor_faturavel;
    });

    return Array.from(usuariosMap.entries())
      .map(([usuario, stats]) => ({
        usuario,
        horas: stats.horas,
        percentualFaturavel: stats.horas > 0 ? (stats.faturavel / stats.horas) * 100 : 0,
        valor: stats.valor,
      }))
      .sort((a, b) => b.horas - a.horas);
  }, [horasData]);

  return {
    horasData,
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    usuariosDistribuicao,
  };
};
