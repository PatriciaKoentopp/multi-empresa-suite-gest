
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

interface FluxoCaixaItem {
  id: string;
  data_movimentacao: string;
  descricao?: string;
  valor: number;
  situacao: string;
  origem: string;
  saldo_calculado: number;
  movimentacoes?: {
    favorecido_id?: string;
    descricao?: string;
  };
  antecipacoes?: {
    favorecido_id?: string;
    numero_documento?: string;
  };
  movimentacao_parcela_id?: string;
  movimentacao_id?: string;
}

export const usePdfFluxoCaixa = () => {
  const gerarPdfFluxoCaixa = (
    movimentacoes: FluxoCaixaItem[],
    nomeEmpresa: string,
    contaCorrenteSelecionada: any,
    dataInicial?: Date,
    dataFinal?: Date,
    saldoInicial: number,
    favorecidosCache: Record<string, any>,
    documentosCache: Record<string, any>,
    parcelasCache: Record<string, any>
  ) => {
    try {
      // Criar documento PDF em formato landscape para comportar mais colunas
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Função para formatar data DD/MM/YYYY
      const formatDateBR = (dateStr: string) => {
        const [yyyy, mm, dd] = dateStr.split("-");
        return `${dd}/${mm}/${yyyy}`;
      };

      // Função para obter favorecido
      const getFavorecidoNome = (linha: FluxoCaixaItem) => {
        if (linha.origem === "antecipacao" && linha.antecipacoes?.favorecido_id) {
          const favorecido = favorecidosCache[linha.antecipacoes.favorecido_id];
          return favorecido?.nome || "-";
        } else if (linha.movimentacoes?.favorecido_id) {
          const favorecido = favorecidosCache[linha.movimentacoes.favorecido_id];
          return favorecido?.nome || "-";
        }
        return "-";
      };

      // Função para obter título/parcela
      const getTituloParcela = (linha: FluxoCaixaItem) => {
        if (linha.origem === "antecipacao" && linha.antecipacoes?.numero_documento) {
          return `${linha.antecipacoes.numero_documento}/1`;
        }
        
        if (linha.movimentacao_parcela_id) {
          const parcela = parcelasCache[linha.movimentacao_parcela_id];
          if (parcela && parcela.movimentacao_id) {
            const movimentacaoId = parcela.movimentacao_id;
            const movPai = documentosCache[movimentacaoId];
            const numeroDoc = movPai?.numero_documento || '-';
            const numeroParcela = parcela.numero || '1';
            return `${numeroDoc}/${numeroParcela}`;
          }
        }
        
        if (linha.movimentacao_id) {
          const movimento = documentosCache[linha.movimentacao_id];
          if (movimento) {
            return `${movimento.numero_documento || '-'}/1`;
          }
        }
        
        return "-";
      };

      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pageNumber: number) => {
        // Nome da empresa (canto esquerdo)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, 15, 15);

        // Nome do relatório (centro)
        const tituloRelatorio = 'Fluxo de Caixa';
        const tituloWidth = doc.getTextWidth(tituloRelatorio);
        doc.text(tituloRelatorio, (pageWidth - tituloWidth) / 2, 15);

        // Data de geração (canto direito)
        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        const dataWidth = doc.getTextWidth(`Gerado em: ${dataGeracao}`);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${dataGeracao}`, pageWidth - dataWidth - 15, 15);

        // Informações do período e conta
        doc.setFontSize(9);
        let yPos = 25;

        if (contaCorrenteSelecionada) {
          doc.text(`Conta: ${contaCorrenteSelecionada.nome}`, 15, yPos);
          yPos += 5;
        }

        if (dataInicial && dataFinal) {
          const dataInicialStr = dataInicial.toLocaleDateString('pt-BR');
          const dataFinalStr = dataFinal.toLocaleDateString('pt-BR');
          doc.text(`Período: ${dataInicialStr} a ${dataFinalStr}`, 15, yPos);
          yPos += 5;
        }

        doc.text(`Saldo Inicial: ${formatCurrency(saldoInicial)}`, 15, yPos);

        return yPos + 10;
      };

      // Função para adicionar rodapé
      const adicionarRodape = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const textoPagina = `Página ${pageNumber} de ${totalPages}`;
        const textoWidth = doc.getTextWidth(textoPagina);
        doc.text(textoPagina, pageWidth - textoWidth - 15, pageHeight - 10);
      };

      // Preparar dados para a tabela
      const dadosTabela: string[][] = [];

      // Linha do saldo inicial
      dadosTabela.push([
        '-',
        '-',
        '-',
        'Saldo Inicial',
        '-',
        '-',
        formatCurrency(saldoInicial)
      ]);

      // Adicionar movimentações ordenadas por data
      const movimentacoesOrdenadas = [...movimentacoes].sort((a, b) => {
        const dataA = new Date(a.data_movimentacao).getTime();
        const dataB = new Date(b.data_movimentacao).getTime();
        return dataA - dataB;
      });

      movimentacoesOrdenadas.forEach((linha) => {
        const valorFormatado = Number(linha.valor) >= 0 
          ? formatCurrency(Number(linha.valor)) 
          : `(${formatCurrency(Math.abs(Number(linha.valor)))})`;

        dadosTabela.push([
          formatDateBR(linha.data_movimentacao),
          getTituloParcela(linha),
          getFavorecidoNome(linha),
          linha.descricao || linha.movimentacoes?.descricao || '-',
          linha.situacao === 'conciliado' ? 'Conciliado' : 'Não Conciliado',
          valorFormatado,
          formatCurrency(linha.saldo_calculado)
        ]);
      });

      // Adicionar cabeçalho da primeira página
      let startY = adicionarCabecalho(1);

      // Gerar tabela
      autoTable(doc, {
        head: [['Data', 'Título/Parcela', 'Favorecido', 'Descrição', 'Situação', 'Valor', 'Saldo']],
        body: dadosTabela,
        startY: startY,
        margin: { left: 15, right: 15 },
        styles: {
          fontSize: 7,
          cellPadding: 1,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [45, 55, 72],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 40, halign: 'left' },
          3: { cellWidth: 60, halign: 'left' },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        },
        didDrawPage: (data) => {
          // Adicionar rodapé em cada página
          const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
          const totalPages = doc.internal.getNumberOfPages();
          
          if (pageNumber > 1) {
            adicionarCabecalho(pageNumber);
          }
          adicionarRodape(pageNumber, totalPages);
        }
      });

      // Calcular totais para o rodapé da tabela
      const totalEntradas = movimentacoes
        .filter(item => Number(item.valor) > 0)
        .reduce((sum, item) => sum + Number(item.valor), 0);
      
      const totalSaidas = movimentacoes
        .filter(item => Number(item.valor) < 0)
        .reduce((sum, item) => sum + Math.abs(Number(item.valor)), 0);
      
      const saldoFinal = movimentacoes.length > 0 
        ? movimentacoes[movimentacoes.length - 1].saldo_calculado 
        : saldoInicial;

      // Adicionar linha de totais
      const finalY = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      doc.text('Resumo do Período:', 15, finalY);
      doc.text(`Total de Entradas: ${formatCurrency(totalEntradas)}`, 15, finalY + 8);
      doc.text(`Total de Saídas: ${formatCurrency(totalSaidas)}`, 15, finalY + 16);
      doc.text(`Saldo Final: ${formatCurrency(saldoFinal)}`, 15, finalY + 24);

      // Gerar nome do arquivo
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const nomeArquivo = `fluxo-caixa-${dataAtual}.pdf`;

      // Fazer download do PDF
      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return false;
    }
  };

  return { gerarPdfFluxoCaixa };
};
