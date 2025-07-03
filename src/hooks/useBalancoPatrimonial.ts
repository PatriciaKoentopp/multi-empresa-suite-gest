import { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

export const useBalancoPatrimonial = () => {
  const [dataReferencia, setDataReferencia] = useState<Date | null>(new Date());
  const [lancamentos, setLancamentos] = useState([
    {
      id: '1',
      data: new Date(),
      descricao: 'Lançamento 1',
      valor: 100,
      tipo: 'entrada',
    },
    {
      id: '2',
      data: new Date(),
      descricao: 'Lançamento 2',
      valor: 200,
      tipo: 'saida',
    },
  ]);

  const gerarRelatorio = () => {
    const doc = new jsPDF();

    // Cabeçalho do relatório
    doc.text('Balanço Patrimonial', 10, 10);

    // Formatar a data de referência
    const dataRelatorio = typeof dataReferencia === 'string' 
      ? dataReferencia 
      : format(dataReferencia, 'dd/MM/yyyy');

    doc.text(`Data de Referência: ${dataRelatorio}`, 10, 20);

    // Configuração da tabela
    const colunas = ['Data', 'Descrição', 'Valor', 'Tipo'];
    const linhas = [];

    lancamentos.forEach((lancamento) => {
      const valorFormatado = formatCurrency(lancamento.valor);
      const dataFormatada = typeof lancamento.data === 'string' 
        ? lancamento.data 
        : format(new Date(lancamento.data), 'dd/MM/yyyy');
      linhas.push([dataFormatada, lancamento.descricao, valorFormatado, lancamento.tipo]);
    });

    // Gerar a tabela
    (doc as any).autoTable({
      head: [colunas],
      body: linhas,
      startY: 30,
    });

    // Salvar o PDF
    doc.save('balanco_patrimonial.pdf');
  };

  return { dataReferencia, setDataReferencia, lancamentos, setLancamentos, gerarRelatorio };
};
