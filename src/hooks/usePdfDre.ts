import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

// Interface para detalhes de movimentação
interface MovimentacaoDetalhe {
  data_movimentacao: string;
  descricao: string;
  valor: number;
  categoria?: string;
  conta_id?: string;
  conta_descricao?: string;
}

// Interface para agrupamento de movimentações por conta contábil
interface ContaContabilAgrupamento {
  conta_id: string;
  descricao: string;
  valor: number;
  detalhes: MovimentacaoDetalhe[];
}

// Interface para grupo de movimentações
interface GrupoMovimentacao {
  tipo: string;
  valor: number;
  detalhes: MovimentacaoDetalhe[];
  contas?: ContaContabilAgrupamento[];
}

// Interface para dados da tabela
interface DadoTabelaPdf {
  conta: string;
  valor: string;
  isGrupo: boolean;
  isResultado: boolean;
  isNegativo: boolean;
}

export const usePdfDre = () => {
  const gerarPdfDre = (
    dadosDRE: GrupoMovimentacao[],
    nomeEmpresa: string,
    periodoTexto: string
  ): boolean => {
    try {
      // Criar documento PDF em portrait (A4)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 14;
      const marginRight = 14;
      const marginTop = 15;

      // Função para formatar data
      const formatarDataAtual = (): string => {
        const now = new Date();
        const dia = String(now.getDate()).padStart(2, '0');
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const ano = now.getFullYear();
        const hora = String(now.getHours()).padStart(2, '0');
        const minuto = String(now.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
      };

      // Função para adicionar cabeçalho
      const adicionarCabecalho = () => {
        // Nome da empresa
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, marginLeft, marginTop);

        // Título centralizado
        doc.setFontSize(14);
        doc.text('DRE - Demonstração do Resultado', pageWidth / 2, marginTop, { align: 'center' });

        // Data de geração
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${formatarDataAtual()}`, pageWidth - marginRight, marginTop, { align: 'right' });

        // Período
        doc.setFontSize(10);
        doc.text(`Período: ${periodoTexto}`, marginLeft, marginTop + 8);

        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, marginTop + 12, pageWidth - marginRight, marginTop + 12);
      };

      // Função para adicionar rodapé
      const adicionarRodape = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${pageNumber} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      };

      // Contas que são linhas de resultado (calculadas, sem subcontas)
      const contasResultado = [
        'Receita Líquida',
        'Lucro Bruto',
        'Resultado Operacional',
        'Resultado Antes IR',
        'Lucro Líquido do Exercício',
        'Resultado do Exercício'
      ];

      // Preparar dados para a tabela
      const dadosTabela: DadoTabelaPdf[] = [];

      dadosDRE.forEach((grupo) => {
        const isResultado = contasResultado.includes(grupo.tipo);
        const valorNumerico = grupo.valor || 0;
        
        // Linha principal do grupo
        dadosTabela.push({
          conta: grupo.tipo,
          valor: formatCurrency(valorNumerico),
          isGrupo: true,
          isResultado: isResultado,
          isNegativo: valorNumerico < 0
        });

        // Subcontas (se existirem e não for linha de resultado)
        if (!isResultado && grupo.contas && grupo.contas.length > 0) {
          grupo.contas.forEach((conta) => {
            const valorConta = conta.valor || 0;
            dadosTabela.push({
              conta: `  └ ${conta.descricao}`,
              valor: formatCurrency(valorConta),
              isGrupo: false,
              isResultado: false,
              isNegativo: valorConta < 0
            });
          });
        }
      });

      // Adicionar cabeçalho na primeira página
      adicionarCabecalho();

      // Gerar tabela
      autoTable(doc, {
        startY: marginTop + 18,
        head: [['Conta', 'Valor']],
        body: dadosTabela.map(row => [row.conta, row.valor]),
        columnStyles: {
          0: { cellWidth: 130, halign: 'left' },
          1: { cellWidth: 40, halign: 'right' }
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const rowData = dadosTabela[rowIndex];
            
            if (rowData) {
              // Estilo para grupos principais (negrito)
              if (rowData.isGrupo) {
                data.cell.styles.fontStyle = 'bold';
              }
              
              // Estilo para linhas de resultado (fundo cinza)
              if (rowData.isResultado) {
                data.cell.styles.fillColor = [235, 235, 235];
                data.cell.styles.fontStyle = 'bold';
              }
              
              // Cor vermelha para valores negativos (apenas na coluna de valor)
              if (data.column.index === 1 && rowData.isNegativo) {
                data.cell.styles.textColor = [180, 0, 0];
              }
            }
          }
        },
        didDrawPage: (data) => {
          // Adicionar cabeçalho em páginas subsequentes
          if (data.pageNumber > 1) {
            adicionarCabecalho();
          }
        },
        margin: { top: marginTop + 18, left: marginLeft, right: marginRight, bottom: 20 }
      });

      // Adicionar rodapé em todas as páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        adicionarRodape(i, totalPages);
      }

      // Gerar nome do arquivo
      const dataAtual = new Date();
      const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}${String(dataAtual.getMonth() + 1).padStart(2, '0')}${dataAtual.getFullYear()}`;
      const nomeArquivo = `DRE_${periodoTexto.replace(/[^a-zA-Z0-9]/g, '_')}_${dataFormatada}.pdf`;

      // Salvar PDF
      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF do DRE:', error);
      return false;
    }
  };

  return { gerarPdfDre };
};
