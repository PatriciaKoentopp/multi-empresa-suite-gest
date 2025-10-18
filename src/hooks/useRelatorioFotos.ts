import { useMemo } from "react";
import { extractProjectNumber } from "@/utils/timeUtils";

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
  numeroProjeto: string;
  numero: string;
  nome: string;
  projetos: string[];
  cliente: string;
  totalHoras: number;
  horasFaturaveis: number;
  horasNaoFaturaveis: number;
  valorFaturavel: number;
  membros: string;
  gerente: string;
  observacao: string;
  percentualTotal: number;
  fotosVendidas: number;
  fotosEnviadas: number;
  fotosTiradas: number;
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

    // Filtrar apenas itens com cliente não vazio
    const fotosDataComCliente = fotosData.filter((item) => {
      const cliente = item.cliente || "";
      return cliente.trim() !== "";
    });

    fotosDataComCliente.forEach((item) => {
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
      const projetoCompleto = item.projeto || "";
      if (!projetoCompleto) return;

      const numeroProjeto = extractProjectNumber(projetoCompleto);

      if (!projetosMap.has(numeroProjeto)) {
        projetosMap.set(numeroProjeto, {
          numeroProjeto,
          numero: numeroProjeto,
          nome: `Projeto ${numeroProjeto}`,
          projetos: [],
          cliente: item.cliente || "",
          totalHoras: 0,
          horasFaturaveis: 0,
          horasNaoFaturaveis: 0,
          valorFaturavel: 0,
          membros: item.membros || "",
          gerente: item.gerente || "",
          observacao: item.observacao || "",
          percentualTotal: 0,
          fotosVendidas: 0,
          fotosEnviadas: 0,
          fotosTiradas: 0,
        });
      }

      const projeto = projetosMap.get(numeroProjeto)!;
      
      // Adicionar projeto completo à lista e extrair valores de fotos
      if (!projeto.projetos.includes(projetoCompleto)) {
        projeto.projetos.push(projetoCompleto);
        
        // Extrair fotos vendidas (valor entre parênteses)
        const vendidasMatch = projetoCompleto.match(/\((\d+)\)/);
        if (vendidasMatch) {
          projeto.fotosVendidas += parseInt(vendidasMatch[1]) || 0;
        }
        
        // Extrair fotos enviadas (valor entre colchetes)
        const enviadasMatch = projetoCompleto.match(/\[(\d+)\]/);
        if (enviadasMatch) {
          projeto.fotosEnviadas += parseInt(enviadasMatch[1]) || 0;
        }
        
        // Extrair fotos tiradas (valor entre chaves)
        const tiradasMatch = projetoCompleto.match(/\{(\d+)\}/);
        if (tiradasMatch) {
          projeto.fotosTiradas += parseInt(tiradasMatch[1]) || 0;
        }
      }

      const rastreado = parseFloat(item.rastreado_h) || 0;
      projeto.totalHoras += rastreado;

      // Usar os valores máximos para as outras métricas
      const faturavel = parseFloat(item.faturavel_h) || 0;
      const naoFaturavel = parseFloat(item.nao_faturavel_h) || 0;
      const valorFat = parseFloat(item.valor_faturavel) || 0;

      if (faturavel > projeto.horasFaturaveis) projeto.horasFaturaveis = faturavel;
      if (naoFaturavel > projeto.horasNaoFaturaveis) projeto.horasNaoFaturaveis = naoFaturavel;
      if (valorFat > projeto.valorFaturavel) projeto.valorFaturavel = valorFat;
    });

    const projetos = Array.from(projetosMap.values());
    const totalHorasGeral = metrics.totalHoras;

    projetos.forEach((projeto) => {
      projeto.percentualTotal = totalHorasGeral > 0 ? (projeto.totalHoras / totalHorasGeral) * 100 : 0;
    });

    return projetos.sort((a, b) => {
      const numA = parseInt(a.numeroProjeto) || 0;
      const numB = parseInt(b.numeroProjeto) || 0;
      return numA - numB;
    });
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

  const totalFotos = useMemo(() => {
    let fotosVendidas = 0;
    let fotosEnviadas = 0;
    let fotosTiradas = 0;
    const projetosProcessados = new Set<string>();

    fotosData.forEach((item) => {
      const projetoCompleto = item.projeto || "";
      
      if (projetoCompleto && !projetosProcessados.has(projetoCompleto)) {
        projetosProcessados.add(projetoCompleto);
        
        // Extrair fotos vendidas (valor entre parênteses)
        const vendidasMatch = projetoCompleto.match(/\((\d+)\)/);
        if (vendidasMatch) {
          fotosVendidas += parseInt(vendidasMatch[1]) || 0;
        }
        
        // Extrair fotos enviadas (valor entre colchetes)
        const enviadasMatch = projetoCompleto.match(/\[(\d+)\]/);
        if (enviadasMatch) {
          fotosEnviadas += parseInt(enviadasMatch[1]) || 0;
        }
        
        // Extrair fotos tiradas (valor entre chaves)
        const tiradasMatch = projetoCompleto.match(/\{(\d+)\}/);
        if (tiradasMatch) {
          fotosTiradas += parseInt(tiradasMatch[1]) || 0;
        }
      }
    });

    return {
      fotosVendidas,
      fotosEnviadas,
      fotosTiradas,
      percentualVendidas: fotosEnviadas > 0 
        ? (fotosVendidas / fotosEnviadas) * 100 
        : 0,
      percentualEnviadas: fotosTiradas > 0
        ? (fotosEnviadas / fotosTiradas) * 100
        : 0,
      percentualVendidasTiradas: fotosTiradas > 0
        ? (fotosVendidas / fotosTiradas) * 100
        : 0,
    };
  }, [fotosData]);

  const dadosPorStatus = useMemo(() => {
    const statusMap = new Map<string, { 
      horas: number; 
      projetos: Set<string>;
    }>();

    fotosData.forEach((item) => {
      const status = item.status || "Sem status";
      const projetoCompleto = item.projeto || "";
      const rastreado = parseFloat(item.rastreado_h) || 0;

      if (!statusMap.has(status)) {
        statusMap.set(status, { 
          horas: 0, 
          projetos: new Set(),
        });
      }

      const statusData = statusMap.get(status)!;
      statusData.horas += rastreado;
      if (projetoCompleto) {
        statusData.projetos.add(projetoCompleto);
      }
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
    totalFotos,
  };
};
