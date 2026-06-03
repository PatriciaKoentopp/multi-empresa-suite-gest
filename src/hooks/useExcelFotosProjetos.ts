import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ProjetoFotosAgrupado {
  numeroProjeto: string;
  cliente: string;
  totalHoras: number;
  fotosVendidas: number;
  fotosEnviadas: number;
  fotosTiradas: number;
  tempoPorFotoVendida: number;
  percentualTotal: number;
  projetos: string[];
}

const formatHoursMinutes = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

export function useExcelFotosProjetos() {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportToExcel = useCallback(async (projetos: ProjetoFotosAgrupado[]) => {
    if (!projetos || projetos.length === 0) {
      toast.error("Nenhum projeto para exportar", {
        description: "Não há dados disponíveis para gerar o relatório.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const dadosFormatados = projetos.map((projeto) => ({
        'Número do Projeto': projeto.numeroProjeto || '',
        'Cliente': projeto.cliente || '',
        'Fotos Vendidas': projeto.fotosVendidas || 0,
        'Fotos Enviadas': projeto.fotosEnviadas || 0,
        'Fotos Tiradas': projeto.fotosTiradas || 0,
        '% Enviadas/Tiradas': projeto.fotosTiradas > 0 ? formatNumber((projeto.fotosEnviadas / projeto.fotosTiradas) * 100) + '%' : '0%',
        '% Vendidas/Enviadas': projeto.fotosEnviadas > 0 ? formatNumber((projeto.fotosVendidas / projeto.fotosEnviadas) * 100) + '%' : '0%',
        '% Vendidas/Tiradas': projeto.fotosTiradas > 0 ? formatNumber((projeto.fotosVendidas / projeto.fotosTiradas) * 100) + '%' : '0%',
        'Total de Horas': formatHoursMinutes(projeto.totalHoras || 0),
        'Tempo/Foto Vendida': projeto.tempoPorFotoVendida > 0 ? formatHoursMinutes(projeto.tempoPorFotoVendida) : '-',
        '% do Total de Horas': formatNumber(projeto.percentualTotal || 0) + '%',
      }));

      const totalFotosVendidas = projetos.reduce((s, p) => s + (p.fotosVendidas || 0), 0);
      const totalFotosEnviadas = projetos.reduce((s, p) => s + (p.fotosEnviadas || 0), 0);
      const totalFotosTiradas = projetos.reduce((s, p) => s + (p.fotosTiradas || 0), 0);
      const totalHoras = projetos.reduce((s, p) => s + (p.totalHoras || 0), 0);

      dadosFormatados.push({
        'Número do Projeto': '',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'TOTAIS E MÉDIAS',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Projetos',
        'Cliente': projetos.length.toString(),
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Fotos Vendidas',
        'Cliente': '',
        'Fotos Vendidas': totalFotosVendidas as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Fotos Enviadas',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': totalFotosEnviadas as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Fotos Tiradas',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': totalFotosTiradas as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Horas',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': formatHoursMinutes(totalHoras),
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Média Fotos Vendidas/Projeto',
        'Cliente': '',
        'Fotos Vendidas': (projetos.length > 0 ? (totalFotosVendidas / projetos.length).toFixed(2) : '0') as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': '',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Média Horas/Projeto',
        'Cliente': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        '% Enviadas/Tiradas': '',
        '% Vendidas/Enviadas': '',
        '% Vendidas/Tiradas': '',
        'Total de Horas': projetos.length > 0 ? formatHoursMinutes(totalHoras / projetos.length) : '0h 0m',
        'Tempo/Foto Vendida': '',
        '% do Total de Horas': '',
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosFormatados);

      const columnWidths = [
        { wch: 20 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 16 },
        { wch: 20 },
        { wch: 20 },
      ];
      ws['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Projetos');

      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = `relatorio-fotos-projetos-${dataAtual}.xlsx`;

      XLSX.writeFile(wb, nomeArquivo);

      toast.success("Relatório gerado com sucesso", {
        description: `Arquivo ${nomeArquivo} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      toast.error("Erro ao gerar relatório", {
        description: "Ocorreu um erro ao gerar o arquivo Excel. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    exportToExcel,
    isGenerating,
  };
}
