import { useMemo } from "react";
import { HoraTrabalhadaData, SpreadsheetData } from "./useSpreadsheetData";
import { extractProjectNumber } from "@/utils/timeUtils";

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

export interface TarefaAgrupada {
  tarefa: string;
  totalHoras: number;
  usuarios: string[];
  faturavel: boolean;
  detalhes: {
    usuario: string;
    horas: number;
    projetoCompleto: string;
    data: string;
  }[];
}

export interface ProjetoAgrupado {
  numeroProjeto: string;
  projeto: string;
  projetos: string[];
  cliente: string;
  totalHoras: number;
  valorFaturavel: number;
  percentualTotal: number;
  tarefasAgrupadas: TarefaAgrupada[];
}

export const useRelatorioTempo = (data: SpreadsheetData[]) => {
  const horasData: HoraTrabalhadaData[] = useMemo(() => {
    return data.map((item) => item.dados as HoraTrabalhadaData);
  }, [data]);

  console.log('[DEBUG useRelatorioTempo] Total de registros recebidos:', data.length);
  console.log('[DEBUG useRelatorioTempo] Horas processadas:', horasData.length);

  const metrics: TempoMetrics = useMemo(() => {
    const horasFiltradas = horasData.filter((h) => h.tarefa && h.tarefa.trim() !== '');
    const totalHoras = horasFiltradas.reduce((sum, h) => sum + h.duracao_decimal, 0);
    const horasFaturaveis = horasFiltradas
      .filter((h) => h.faturavel)
      .reduce((sum, h) => sum + h.duracao_decimal, 0);
    const valorTotalFaturavel = horasFiltradas.reduce((sum, h) => sum + h.valor_faturavel, 0);
    const projetos = new Set(horasFiltradas.map((h) => extractProjectNumber(h.projeto))).size;
    const usuarios = new Set(horasFiltradas.map((h) => h.usuario)).size;

    const result = {
      totalHoras,
      horasFaturaveis,
      horasNaoFaturaveis: totalHoras - horasFaturaveis,
      valorTotalFaturavel,
      totalProjetos: projetos,
      totalTarefas: horasFiltradas.length,
      totalUsuarios: usuarios,
      mediaHorasPorProjeto: projetos > 0 ? totalHoras / projetos : 0,
    };
    
    console.log('[DEBUG metrics] Total de horas calculado:', totalHoras);
    console.log('[DEBUG metrics] Total de registros processados:', horasData.length);
    return result;
  }, [horasData]);

  const projetosAgrupados: ProjetoAgrupado[] = useMemo(() => {
    const projetosMap = new Map<string, ProjetoAgrupado>();

    horasData.forEach((hora) => {
      const numeroProjeto = extractProjectNumber(hora.projeto);
      
      if (!projetosMap.has(numeroProjeto)) {
        projetosMap.set(numeroProjeto, {
          numeroProjeto,
          projeto: `Projeto ${numeroProjeto}`,
          projetos: [],
          cliente: hora.cliente,
          totalHoras: 0,
          valorFaturavel: 0,
          percentualTotal: 0,
          tarefasAgrupadas: [],
        });
      }

      const projeto = projetosMap.get(numeroProjeto)!;
      
      if (!projeto.projetos.includes(hora.projeto)) {
        projeto.projetos.push(hora.projeto);
      }
      
      projeto.totalHoras += hora.duracao_decimal;
      projeto.valorFaturavel += hora.valor_faturavel;
    });

    // Agrupar tarefas por tipo
    projetosMap.forEach((projeto) => {
      const tarefasMap = new Map<string, TarefaAgrupada>();
      
      horasData
        .filter((hora) => extractProjectNumber(hora.projeto) === projeto.numeroProjeto)
        .forEach((hora) => {
          if (!tarefasMap.has(hora.tarefa)) {
            tarefasMap.set(hora.tarefa, {
              tarefa: hora.tarefa,
              totalHoras: 0,
              usuarios: [],
              faturavel: hora.faturavel,
              detalhes: [],
            });
          }

          const tarefaAgrupada = tarefasMap.get(hora.tarefa)!;
          tarefaAgrupada.totalHoras += hora.duracao_decimal;
          
          if (!tarefaAgrupada.usuarios.includes(hora.usuario)) {
            tarefaAgrupada.usuarios.push(hora.usuario);
          }
          
          tarefaAgrupada.detalhes.push({
            usuario: hora.usuario,
            horas: hora.duracao_decimal,
            projetoCompleto: hora.projeto,
            data: hora.data_inicio,
          });
        });

      projeto.tarefasAgrupadas = Array.from(tarefasMap.values()).sort(
        (a, b) => b.totalHoras - a.totalHoras
      );

      // Ordenar os detalhes de cada tarefa por data
      projeto.tarefasAgrupadas.forEach(tarefa => {
        tarefa.detalhes.sort((a, b) => {
          // Função auxiliar para converter data para número comparável
          const getNumericDate = (date: any): number => {
            if (!date) return 0;
            
            // Se for número (serial do Excel), usar diretamente
            if (typeof date === 'number') return date;
            
            // Se for string numérica (serial do Excel como string)
            if (typeof date === 'string' && !date.includes('/')) {
              const num = parseFloat(date);
              return isNaN(num) ? 0 : num;
            }
            
            // Se for string no formato dd/mm/yyyy, converter para serial do Excel
            if (typeof date === 'string' && date.includes('/')) {
              const parts = date.split('/');
              if (parts.length !== 3) return 0;
              
              const [day, month, year] = parts.map(Number);
              if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
              
              const dateObj = new Date(year, month - 1, day);
              const excelEpoch = new Date(1899, 11, 30);
              return (dateObj.getTime() - excelEpoch.getTime()) / (24 * 60 * 60 * 1000);
            }
            
            return 0;
          };
          
          return getNumericDate(a.data) - getNumericDate(b.data);
        });
      });
    });

    const totalGeral = metrics.totalHoras;
    const projetos = Array.from(projetosMap.values());
    projetos.forEach((p) => {
      p.percentualTotal = totalGeral > 0 ? (p.totalHoras / totalGeral) * 100 : 0;
    });

    return projetos.sort((a, b) => {
      const numA = parseInt(a.numeroProjeto) || 0;
      const numB = parseInt(b.numeroProjeto) || 0;
      return numA - numB;
    });
  }, [horasData, metrics.totalHoras]);

  const tarefasDistribuicao = useMemo(() => {
    const tarefasMap = new Map<string, number>();
    horasData
      .filter((hora) => hora.tarefa && hora.tarefa.trim() !== '')
      .forEach((hora) => {
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

  const dadosPorAno = useMemo(() => {
    const anosMap = new Map<number, { totalHoras: number; projetos: Set<string> }>();
    
    horasData
      .filter((hora) => hora.tarefa && hora.tarefa.trim() !== '')
      .forEach((hora) => {
        // Extrair ano da data_inicio
        let ano: number;
        const dataInicio = hora.data_inicio;
        
        if (typeof dataInicio === 'number') {
          // Serial do Excel
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + dataInicio * 24 * 60 * 60 * 1000);
          ano = date.getFullYear();
        } else if (typeof dataInicio === 'string' && dataInicio.includes('/')) {
          // Formato dd/mm/yyyy
          const parts = dataInicio.split('/');
          ano = parseInt(parts[2]);
        } else {
          return; // Ignorar se não conseguir extrair o ano
        }
        
        if (!anosMap.has(ano)) {
          anosMap.set(ano, { totalHoras: 0, projetos: new Set() });
        }
        
        const dadosAno = anosMap.get(ano)!;
        dadosAno.totalHoras += hora.duracao_decimal;
        dadosAno.projetos.add(extractProjectNumber(hora.projeto));
      });
    
    return Array.from(anosMap.entries())
      .map(([ano, dados]) => ({
        ano: ano.toString(),
        totalHoras: parseFloat(dados.totalHoras.toFixed(2)),
        totalProjetos: dados.projetos.size,
      }))
      .sort((a, b) => parseInt(a.ano) - parseInt(b.ano));
  }, [horasData]);

  return {
    horasData,
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    usuariosDistribuicao,
    dadosPorAno,
  };
};
