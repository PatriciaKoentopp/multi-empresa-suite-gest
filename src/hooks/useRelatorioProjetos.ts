import { useMemo } from "react";
import { extractProjectNumber } from "@/utils/timeUtils";
import { useRelatorioFotos } from "./useRelatorioFotos";

export interface ProjetoCompleto {
  numeroProjeto: string;
  cliente: string;
  codigoVenda: string;
  dataVenda: Date | null;
  receita: number;
  fotosVendidas: number;
  fotosEnviadas: number;
  fotosTiradas: number;
  totalHoras: number;
  valorPorFoto: number;
  valorPorHora: number;
  fotosPorHora: number;
  horasPorFoto: number;
  eficienciaFotos: number;
  temVenda: boolean;
  temDadosFotos: boolean;
}

export interface MetricasProjetos {
  totalProjetos: number;
  totalReceita: number;
  totalFotos: number;
  totalHoras: number;
  receitaMedia: number;
  valorMedioPorFoto: number;
  valorMedioPorHora: number;
  horasMediasPorFoto: number;
}

interface VendaData {
  codigo: string;
  dataVenda: Date | null;
  cliente: string;
  receita: number;
}

export function useRelatorioProjetos(vendasData: any[], fotosSpreadsheetData: any[]) {
  // Processar vendas em um Map
  const vendasMap = useMemo(() => {
    const map = new Map<string, VendaData>();
    vendasData.forEach(venda => {
      if (venda.codigo_projeto) {
        map.set(venda.codigo_projeto, {
          codigo: venda.codigo,
          dataVenda: venda.data_venda ? new Date(venda.data_venda) : null,
          cliente: venda.cliente || '',
          receita: Number(venda.valor_total) || 0
        });
      }
    });
    return map;
  }, [vendasData]);

  // Processar dados de fotos
  const { projetosAgrupados: fotosProjetos } = useRelatorioFotos(fotosSpreadsheetData);

  // Combinar dados
  const projetos = useMemo(() => {
    const projetosCombinados: ProjetoCompleto[] = [];
    const numerosProcessados = new Set<string>();

    // Processar projetos que têm fotos
    fotosProjetos.forEach(fotoProjeto => {
      const venda = vendasMap.get(fotoProjeto.numeroProjeto);
      
      projetosCombinados.push({
        numeroProjeto: fotoProjeto.numeroProjeto,
        cliente: venda?.cliente || fotoProjeto.cliente,
        codigoVenda: venda?.codigo || '-',
        dataVenda: venda?.dataVenda || null,
        receita: venda?.receita || 0,
        fotosVendidas: fotoProjeto.fotosVendidas,
        fotosEnviadas: fotoProjeto.fotosEnviadas,
        fotosTiradas: fotoProjeto.fotosTiradas,
        totalHoras: fotoProjeto.totalHoras,
        valorPorFoto: fotoProjeto.fotosVendidas > 0 && venda 
          ? venda.receita / fotoProjeto.fotosVendidas 
          : 0,
        valorPorHora: fotoProjeto.totalHoras > 0 && venda
          ? venda.receita / fotoProjeto.totalHoras
          : 0,
        fotosPorHora: fotoProjeto.totalHoras > 0
          ? fotoProjeto.fotosVendidas / fotoProjeto.totalHoras
          : 0,
        horasPorFoto: fotoProjeto.fotosVendidas > 0
          ? fotoProjeto.totalHoras / fotoProjeto.fotosVendidas
          : 0,
        eficienciaFotos: fotoProjeto.fotosEnviadas > 0
          ? (fotoProjeto.fotosVendidas / fotoProjeto.fotosEnviadas) * 100
          : 0,
        temVenda: !!venda,
        temDadosFotos: true
      });
      
      numerosProcessados.add(fotoProjeto.numeroProjeto);
    });

    // Adicionar vendas que não têm dados de fotos
    vendasMap.forEach((venda, numeroProjeto) => {
      if (!numerosProcessados.has(numeroProjeto)) {
        projetosCombinados.push({
          numeroProjeto,
          cliente: venda.cliente,
          codigoVenda: venda.codigo,
          dataVenda: venda.dataVenda,
          receita: venda.receita,
          fotosVendidas: 0,
          fotosEnviadas: 0,
          fotosTiradas: 0,
          totalHoras: 0,
          valorPorFoto: 0,
          valorPorHora: 0,
          fotosPorHora: 0,
          horasPorFoto: 0,
          eficienciaFotos: 0,
          temVenda: true,
          temDadosFotos: false
        });
      }
    });

    return projetosCombinados.sort((a, b) => 
      parseInt(b.numeroProjeto) - parseInt(a.numeroProjeto)
    );
  }, [fotosProjetos, vendasMap]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const projetosCompletos = projetos.filter(p => p.temVenda && p.temDadosFotos);
    
    const totalReceita = projetos.reduce((sum, p) => sum + p.receita, 0);
    const totalFotos = projetos.reduce((sum, p) => sum + p.fotosVendidas, 0);
    const totalHoras = projetos.reduce((sum, p) => sum + p.totalHoras, 0);

    const metrics: MetricasProjetos = {
      totalProjetos: projetos.length,
      totalReceita,
      totalFotos,
      totalHoras,
      receitaMedia: 0,
      valorMedioPorFoto: 0,
      valorMedioPorHora: 0,
      horasMediasPorFoto: 0
    };

    if (projetosCompletos.length > 0) {
      metrics.receitaMedia = projetosCompletos.reduce((sum, p) => sum + p.receita, 0) / projetosCompletos.length;
      metrics.valorMedioPorFoto = projetosCompletos.reduce((sum, p) => sum + p.valorPorFoto, 0) / projetosCompletos.length;
      metrics.valorMedioPorHora = projetosCompletos.reduce((sum, p) => sum + p.valorPorHora, 0) / projetosCompletos.length;
      metrics.horasMediasPorFoto = projetosCompletos.reduce((sum, p) => sum + p.horasPorFoto, 0) / projetosCompletos.length;
    }

    return metrics;
  }, [projetos]);

  const projetosCompletos = useMemo(() => 
    projetos.filter(p => p.temVenda && p.temDadosFotos), 
    [projetos]
  );

  const projetosSemVenda = useMemo(() => 
    projetos.filter(p => !p.temVenda), 
    [projetos]
  );

  const projetosSemFotos = useMemo(() => 
    projetos.filter(p => !p.temDadosFotos), 
    [projetos]
  );

  return {
    projetos,
    metrics,
    projetosCompletos,
    projetosSemVenda,
    projetosSemFotos
  };
}
