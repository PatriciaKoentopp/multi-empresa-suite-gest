import { useMemo } from "react";
import { extractProjectNumber } from "@/utils/timeUtils";
import { useRelatorioFotos } from "./useRelatorioFotos";

export interface ProjetoCompleto {
  numeroProjeto: string;
  cliente: string;
  codigosVenda: string[];
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

interface ProjetoVendas {
  codigos: string[];
  clientes: string[];
  dataVenda: Date | null;
  receitaTotal: number;
}

export function useRelatorioProjetos(vendasData: any[], fotosSpreadsheetData: any[]) {
  // Processar vendas agrupando por projeto
  const vendasMap = useMemo(() => {
    const map = new Map<string, ProjetoVendas>();
    
    console.log('=== DEBUG VENDAS ===');
    console.log('Total de vendas:', vendasData.length);
    console.log('Primeiras 3 vendas:', vendasData.slice(0, 3).map(v => ({
      codigo: v.codigo,
      codigo_projeto: v.codigo_projeto,
      valor: v.valor_total
    })));
    
    vendasData.forEach(venda => {
      if (venda.codigo_projeto) {
        // Normalizar: remover espaços e zeros à esquerda
        const numeroProjeto = String(venda.codigo_projeto).trim().replace(/^0+/, '') || String(venda.codigo_projeto).trim();
        const existing = map.get(numeroProjeto);
        const vendaData = {
          codigo: venda.codigo,
          dataVenda: venda.data_venda ? new Date(venda.data_venda) : null,
          cliente: venda.cliente || '',
          receita: Number(venda.valor_total) || 0
        };
        
        if (existing) {
          existing.codigos.push(vendaData.codigo);
          if (!existing.clientes.includes(vendaData.cliente)) {
            existing.clientes.push(vendaData.cliente);
          }
          existing.receitaTotal += vendaData.receita;
          // Manter a data da venda mais recente
          if (vendaData.dataVenda && (!existing.dataVenda || vendaData.dataVenda > existing.dataVenda)) {
            existing.dataVenda = vendaData.dataVenda;
          }
        } else {
          map.set(numeroProjeto, {
            codigos: [vendaData.codigo],
            clientes: [vendaData.cliente],
            dataVenda: vendaData.dataVenda,
            receitaTotal: vendaData.receita
          });
        }
      }
    });
    
    console.log('=== VENDAS AGRUPADAS ===');
    console.log('Números de projeto com vendas:', Array.from(map.keys()));
    console.log('Total de projetos com vendas:', map.size);
    
    return map;
  }, [vendasData]);

  // Processar dados de fotos
  const { projetosAgrupados: fotosProjetos } = useRelatorioFotos(fotosSpreadsheetData);

  // Combinar dados
  const projetos = useMemo(() => {
    console.log('=== DEBUG FOTOS ===');
    console.log('Total de projetos com fotos:', fotosProjetos.length);
    console.log('Primeiros 3 projetos:', fotosProjetos.slice(0, 3).map(p => ({
      numero: p.numeroProjeto,
      cliente: p.cliente,
      fotos: p.fotosVendidas,
      horas: p.totalHoras
    })));
    
    const projetosCombinados: ProjetoCompleto[] = [];
    const numerosProcessados = new Set<string>();

    // Processar projetos que têm fotos
    fotosProjetos.forEach(fotoProjeto => {
      // Normalizar: remover espaços e zeros à esquerda
      const numeroProjeto = String(fotoProjeto.numeroProjeto).trim().replace(/^0+/, '') || String(fotoProjeto.numeroProjeto).trim();
      const vendas = vendasMap.get(numeroProjeto);
      
      console.log(`Projeto ${numeroProjeto}:`, {
        cliente: fotoProjeto.cliente,
        temVenda: !!vendas,
        fotosVendidas: fotoProjeto.fotosVendidas,
        fotosEnviadas: fotoProjeto.fotosEnviadas,
        fotosTiradas: fotoProjeto.fotosTiradas,
        horas: fotoProjeto.totalHoras,
        receita: vendas?.receitaTotal || 0
      });
      
      projetosCombinados.push({
        numeroProjeto,
        cliente: vendas ? vendas.clientes.join(', ') : fotoProjeto.cliente,
        codigosVenda: vendas ? vendas.codigos : [],
        dataVenda: vendas?.dataVenda || null,
        receita: vendas?.receitaTotal || 0,
        fotosVendidas: fotoProjeto.fotosVendidas,
        fotosEnviadas: fotoProjeto.fotosEnviadas,
        fotosTiradas: fotoProjeto.fotosTiradas,
        totalHoras: fotoProjeto.totalHoras,
        valorPorFoto: fotoProjeto.fotosVendidas > 0 && vendas 
          ? vendas.receitaTotal / fotoProjeto.fotosVendidas 
          : 0,
        valorPorHora: fotoProjeto.totalHoras > 0 && vendas
          ? vendas.receitaTotal / fotoProjeto.totalHoras
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
        temVenda: !!vendas,
        temDadosFotos: true
      });
      
      numerosProcessados.add(numeroProjeto);
    });

    // Adicionar vendas que não têm dados de fotos
    vendasMap.forEach((vendas, numeroProjeto) => {
      if (!numerosProcessados.has(numeroProjeto)) {
        projetosCombinados.push({
          numeroProjeto,
          cliente: vendas.clientes.join(', '),
          codigosVenda: vendas.codigos,
          dataVenda: vendas.dataVenda,
          receita: vendas.receitaTotal,
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
