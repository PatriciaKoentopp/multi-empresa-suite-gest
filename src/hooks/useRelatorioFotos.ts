import { useMemo } from "react";

interface FotosMetrics {
  totalHoras: number;
  totalProjetos: number;
  totalClientes: number;
  horasMediasPorProjeto: number;
  projetosAtivos: number;
  projetosArquivados: number;
}

interface TarefaFotosAgrupada {
  nome: string;
  totalHoras: number;
  percentual: number;
}

interface ProjetoFotosAgrupado {
  numero: string;
  nome: string;
  cliente: string;
  status: string;
  visibilidade: string;
  totalHoras: number;
  horasEstimadas: number;
  horasRemanescentes: number;
  horasExcesso: number;
  progresso: number;
  horasFaturaveis: number;
  horasNaoFaturaveis: number;
  valorFaturavel: number;
  membros: string;
  gerente: string;
  observacao: string;
  tarefas: TarefaFotosAgrupada[];
  percentualTotal: number;
}

interface ClienteFotosAgrupado {
  nome: string;
  totalHoras: number;
  totalProjetos: number;
  percentual: number;
}

interface SpreadsheetData {
  id: string;
  dados: any;
}

export const useRelatorioFotos = (data: SpreadsheetData[]) => {
  const fotosData = useMemo(() => {
    return data
      .map((item) => item.dados)
      .filter((dados) => dados && typeof dados === "object");
  }, [data]);

  const metrics = useMemo((): FotosMetrics => {
    const projetos = new Set<string>();
    const clientes = new Set<string>();
    let totalHoras = 0;
    let projetosAtivos = 0;
    let projetosArquivados = 0;

    fotosData.forEach((item) => {
      const projeto = item.projeto || "";
      const cliente = item.cliente || "";
      const rastreado = parseFloat(item.rastreado_h) || 0;
      const status = item.status || "";

      if (projeto) projetos.add(projeto);
      if (cliente) clientes.add(cliente);
      totalHoras += rastreado;

      if (status === "Ativo") projetosAtivos++;
      if (status === "Arquivado") projetosArquivados++;
    });

    return {
      totalHoras,
      totalProjetos: projetos.size,
      totalClientes: clientes.size,
      horasMediasPorProjeto: projetos.size > 0 ? totalHoras / projetos.size : 0,
      projetosAtivos,
      projetosArquivados,
    };
  }, [fotosData]);

  const projetosAgrupados = useMemo((): ProjetoFotosAgrupado[] => {
    const projetosMap = new Map<string, ProjetoFotosAgrupado>();

    fotosData.forEach((item) => {
      const projetoKey = item.projeto || "";
      if (!projetoKey) return;

      const [numero, ...nomePartes] = projetoKey.split(" - ");
      const nome = nomePartes.join(" - ");

      if (!projetosMap.has(projetoKey)) {
        projetosMap.set(projetoKey, {
          numero: numero || "",
          nome: nome || projetoKey,
          cliente: item.cliente || "",
          status: item.status || "",
          visibilidade: item.visibilidade || "",
          totalHoras: 0,
          horasEstimadas: parseFloat(item.estimado_h) || 0,
          horasRemanescentes: parseFloat(item.remanescente_h) || 0,
          horasExcesso: parseFloat(item.excesso_h) || 0,
          progresso: parseFloat(item.progresso_pct) || 0,
          horasFaturaveis: parseFloat(item.faturavel_h) || 0,
          horasNaoFaturaveis: parseFloat(item.nao_faturavel_h) || 0,
          valorFaturavel: parseFloat(item.valor_faturavel) || 0,
          membros: item.membros || "",
          gerente: item.gerente || "",
          observacao: item.observacao || "",
          tarefas: [],
          percentualTotal: 0,
        });
      }

      const projeto = projetosMap.get(projetoKey)!;
      const rastreado = parseFloat(item.rastreado_h) || 0;
      projeto.totalHoras += rastreado;

      const tarefasStr = item.tarefa || "";
      const tarefas = tarefasStr.split(",").map((t: string) => t.trim()).filter((t: string) => t);

      tarefas.forEach((tarefaNome: string) => {
        const tarefaExistente = projeto.tarefas.find((t) => t.nome === tarefaNome);
        if (tarefaExistente) {
          tarefaExistente.totalHoras += rastreado / tarefas.length;
        } else {
          projeto.tarefas.push({
            nome: tarefaNome,
            totalHoras: rastreado / tarefas.length,
            percentual: 0,
          });
        }
      });
    });

    const projetos = Array.from(projetosMap.values());
    const totalHorasGeral = metrics.totalHoras;

    projetos.forEach((projeto) => {
      projeto.percentualTotal = totalHorasGeral > 0 ? (projeto.totalHoras / totalHorasGeral) * 100 : 0;
      projeto.tarefas.forEach((tarefa) => {
        tarefa.percentual = projeto.totalHoras > 0 ? (tarefa.totalHoras / projeto.totalHoras) * 100 : 0;
      });
      projeto.tarefas.sort((a, b) => b.totalHoras - a.totalHoras);
    });

    return projetos.sort((a, b) => a.numero.localeCompare(b.numero));
  }, [fotosData, metrics.totalHoras]);

  const tarefasDistribuicao = useMemo((): TarefaFotosAgrupada[] => {
    const tarefasMap = new Map<string, number>();

    fotosData.forEach((item) => {
      const tarefasStr = item.tarefa || "";
      const tarefas = tarefasStr.split(",").map((t: string) => t.trim()).filter((t: string) => t);
      const rastreado = parseFloat(item.rastreado_h) || 0;

      tarefas.forEach((tarefaNome: string) => {
        const horasPorTarefa = rastreado / tarefas.length;
        tarefasMap.set(tarefaNome, (tarefasMap.get(tarefaNome) || 0) + horasPorTarefa);
      });
    });

    const totalHoras = metrics.totalHoras;
    const tarefas = Array.from(tarefasMap.entries())
      .map(([nome, horas]) => ({
        nome,
        totalHoras: horas,
        percentual: totalHoras > 0 ? (horas / totalHoras) * 100 : 0,
      }))
      .sort((a, b) => b.totalHoras - a.totalHoras)
      .slice(0, 10);

    return tarefas;
  }, [fotosData, metrics.totalHoras]);

  const clientesDistribuicao = useMemo((): ClienteFotosAgrupado[] => {
    const clientesMap = new Map<string, { horas: number; projetos: Set<string> }>();

    fotosData.forEach((item) => {
      const cliente = item.cliente || "Sem cliente";
      const projeto = item.projeto || "";
      const rastreado = parseFloat(item.rastreado_h) || 0;

      if (!clientesMap.has(cliente)) {
        clientesMap.set(cliente, { horas: 0, projetos: new Set() });
      }

      const clienteData = clientesMap.get(cliente)!;
      clienteData.horas += rastreado;
      if (projeto) clienteData.projetos.add(projeto);
    });

    const totalHoras = metrics.totalHoras;
    const clientes = Array.from(clientesMap.entries())
      .map(([nome, data]) => ({
        nome,
        totalHoras: data.horas,
        totalProjetos: data.projetos.size,
        percentual: totalHoras > 0 ? (data.horas / totalHoras) * 100 : 0,
      }))
      .sort((a, b) => b.totalHoras - a.totalHoras)
      .slice(0, 10);

    return clientes;
  }, [fotosData, metrics.totalHoras]);

  const dadosPorStatus = useMemo(() => {
    const statusMap = new Map<string, { horas: number; projetos: Set<string> }>();

    fotosData.forEach((item) => {
      const status = item.status || "Sem status";
      const projeto = item.projeto || "";
      const rastreado = parseFloat(item.rastreado_h) || 0;

      if (!statusMap.has(status)) {
        statusMap.set(status, { horas: 0, projetos: new Set() });
      }

      const statusData = statusMap.get(status)!;
      statusData.horas += rastreado;
      if (projeto) statusData.projetos.add(projeto);
    });

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      totalHoras: data.horas,
      totalProjetos: data.projetos.size,
    }));
  }, [fotosData]);

  return {
    metrics,
    projetosAgrupados,
    tarefasDistribuicao,
    clientesDistribuicao,
    dadosPorStatus,
  };
};
