import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';
import { ProjetoCompleto } from '@/hooks/useRelatorioProjetos';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};

const formatNumber = (value: number): string => {
  return value.toFixed(2);
};

const formatPercentage = (value: number): string => {
  return value.toFixed(2) + '%';
};

export function useExcelProjetos() {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportToExcel = useCallback(async (projetos: ProjetoCompleto[]) => {
    if (!projetos || projetos.length === 0) {
      toast({
        title: "Nenhum projeto para exportar",
        description: "Não há dados disponíveis para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Formatar os dados para o Excel
      const dadosFormatados = projetos.map((projeto) => ({
        'Número do Projeto': projeto.numeroProjeto || '',
        'Cliente': projeto.cliente || '',
        'Códigos de Venda': projeto.codigosVenda?.join(', ') || '',
        'Data da Venda': formatDate(projeto.dataVenda),
        'Receita (R$)': formatCurrency(projeto.receita || 0),
        'Fotos Vendidas': projeto.fotosVendidas || 0,
        'Fotos Enviadas': projeto.fotosEnviadas || 0,
        'Fotos Tiradas': projeto.fotosTiradas || 0,
        'Total de Horas': formatNumber(projeto.totalHoras || 0),
        'Valor/Foto (R$)': formatCurrency(projeto.valorPorFoto || 0),
        'Valor/Hora (R$)': formatCurrency(projeto.valorPorHora || 0),
        'Horas/Foto': formatNumber(projeto.horasPorFoto || 0),
        'Eficiência de Fotos (%)': formatPercentage(projeto.eficienciaFotos || 0),
      }));

      // Calcular totais e médias
      const projetosComVenda = projetos.filter(p => p.temVenda);
      const totalReceita = projetosComVenda.reduce((sum, p) => sum + (p.receita || 0), 0);
      const totalFotos = projetosComVenda.reduce((sum, p) => sum + (p.fotosVendidas || 0), 0);
      const totalHoras = projetosComVenda.reduce((sum, p) => sum + (p.totalHoras || 0), 0);

      // Adicionar linhas de resumo (usando 'any' para evitar erros de tipo)
      dadosFormatados.push({
        'Número do Projeto': '',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'TOTAIS E MÉDIAS',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Projetos',
        'Cliente': projetosComVenda.length.toString(),
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Receita Total',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': formatCurrency(totalReceita),
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Fotos Vendidas',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': totalFotos as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Total de Horas',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': formatNumber(totalHoras),
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Receita Média',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': formatCurrency(projetosComVenda.length > 0 ? totalReceita / projetosComVenda.length : 0),
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Valor Médio/Foto',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': formatCurrency(totalFotos > 0 ? totalReceita / totalFotos : 0),
        'Valor/Hora (R$)': '',
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Valor Médio/Hora',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': formatCurrency(totalHoras > 0 ? totalReceita / totalHoras : 0),
        'Horas/Foto': '',
        'Eficiência de Fotos (%)': '',
      });

      dadosFormatados.push({
        'Número do Projeto': 'Horas Médias/Foto',
        'Cliente': '',
        'Códigos de Venda': '',
        'Data da Venda': '',
        'Receita (R$)': '',
        'Fotos Vendidas': '' as any,
        'Fotos Enviadas': '' as any,
        'Fotos Tiradas': '' as any,
        'Total de Horas': '',
        'Valor/Foto (R$)': '',
        'Valor/Hora (R$)': '',
        'Horas/Foto': formatNumber(totalFotos > 0 ? totalHoras / totalFotos : 0),
        'Eficiência de Fotos (%)': '',
      });

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosFormatados);

      // Configurar largura das colunas
      const columnWidths = [
        { wch: 20 }, // Número do Projeto
        { wch: 30 }, // Cliente
        { wch: 20 }, // Códigos de Venda
        { wch: 15 }, // Data da Venda
        { wch: 15 }, // Receita
        { wch: 15 }, // Fotos Vendidas
        { wch: 15 }, // Fotos Enviadas
        { wch: 15 }, // Fotos Tiradas
        { wch: 15 }, // Total de Horas
        { wch: 15 }, // Valor/Foto
        { wch: 15 }, // Valor/Hora
        { wch: 15 }, // Horas/Foto
        { wch: 20 }, // Eficiência de Fotos
      ];
      ws['!cols'] = columnWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Projetos');

      // Gerar nome do arquivo com data atual
      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = `relatorio-projetos-${dataAtual}.xlsx`;

      // Baixar arquivo
      XLSX.writeFile(wb, nomeArquivo);

      toast({
        title: "Relatório gerado com sucesso",
        description: `Arquivo ${nomeArquivo} baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o arquivo Excel. Tente novamente.",
        variant: "destructive",
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
