
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

interface LancamentoContabil {
  id: string;
  data: string | Date;
  historico: string;
  conta_codigo?: string;
  conta_nome?: string;
  tipo: 'debito' | 'credito';
  valor: number;
  saldo?: number;
  tipo_lancamento?: string;
  favorecido?: string;
}

interface PlanoContas {
  id: string;
  codigo: string;
  descricao: string;
}

export const usePdfLancamentos = () => {
  const gerarPdfLancamentos = (
    lancamentos: LancamentoContabil[],
    nomeEmpresa: string,
    contaSelecionada: PlanoContas,
    dataInicial: Date,
    dataFinal: Date,
    tipoLancamentoFiltro: string
  ) => {
    try {
      // Criar documento PDF em formato landscape
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Função para formatar data DD/MM/YYYY
      const formatDateBR = (dateStr: string | Date) => {
        if (typeof dateStr === "string") {
          if (dateStr.includes("/")) {
            return dateStr;
          } else {
            const [anoMesDia] = dateStr.split('T');
            const [ano, mes, dia] = anoMesDia.split('-');
            return `${dia}/${mes}/${ano}`;
          }
        } else if (dateStr instanceof Date) {
          const dia = String(dateStr.getDate()).padStart(2, '0');
          const mes = String(dateStr.getMonth() + 1).padStart(2, '0');
          const ano = dateStr.getFullYear();
          return `${dia}/${mes}/${ano}`;
        }
        return "";
      };

      // Função para traduzir tipo de lançamento
      const getTipoLancamentoTexto = (tipo?: string) => {
        switch (tipo) {
          case 'juros':
            return "Juros";
          case 'multa':
            return "Multa";
          case 'desconto':
            return "Desconto";
          case 'principal':
          default:
            return "Principal";
        }
      };

      // Função para formatar código e descrição da conta
      const formatarCodigoConta = (lancamento: LancamentoContabil) => {
        const codigo = lancamento.conta_codigo || '-';
        const nome = lancamento.conta_nome || '';
        
        if (codigo === '-' || !nome) {
          return codigo;
        }
        
        return `${codigo} - ${nome}`;
      };

      // Função para formatar histórico com favorecido
      const formatarHistorico = (lancamento: LancamentoContabil) => {
        let historico = lancamento.historico || '';
        
        // Adicionar favorecido se disponível
        if (lancamento.favorecido) {
          historico = `${historico} - ${lancamento.favorecido}`;
        }
        
        return historico;
      };

      // Função para adicionar cabeçalho
      const adicionarCabecalho = () => {
        // Nome da empresa (canto esquerdo)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, 15, 15);

        // Nome do relatório (centro)
        const tituloRelatorio = 'Razão Contábil';
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

        if (contaSelecionada) {
          doc.text(`Conta: ${contaSelecionada.codigo} - ${contaSelecionada.descricao}`, 15, yPos);
          yPos += 5;
        }

        if (dataInicial && dataFinal) {
          const dataInicialStr = dataInicial.toLocaleDateString('pt-BR');
          const dataFinalStr = dataFinal.toLocaleDateString('pt-BR');
          doc.text(`Período: ${dataInicialStr} a ${dataFinalStr}`, 15, yPos);
          yPos += 5;
        }

        if (tipoLancamentoFiltro && tipoLancamentoFiltro !== "todos") {
          doc.text(`Tipo: ${getTipoLancamentoTexto(tipoLancamentoFiltro)}`, 15, yPos);
          yPos += 5;
        }

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

      // Adicionar lançamentos ordenados por data
      const lancamentosOrdenados = [...lancamentos].sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        return dataA - dataB;
      });

      lancamentosOrdenados.forEach((lanc) => {
        const valorDebito = lanc.tipo === "debito" ? formatCurrency(lanc.valor) : "-";
        const valorCredito = lanc.tipo === "credito" ? formatCurrency(lanc.valor) : "-";

        dadosTabela.push([
          formatDateBR(lanc.data),
          formatarCodigoConta(lanc), // Código e descrição da conta
          formatarHistorico(lanc), // Histórico com favorecido
          valorDebito,
          valorCredito,
          formatCurrency(lanc.saldo || 0)
        ]);
      });

      // Adicionar cabeçalho da primeira página
      let startY = adicionarCabecalho();

      // Variável para armazenar a altura do cabeçalho
      let headerHeight = startY;

      // Gerar tabela com colunas otimizadas
      autoTable(doc, {
        head: [['Data', 'Conta', 'Histórico', 'Débito', 'Crédito', 'Saldo']],
        body: dadosTabela,
        startY: startY,
        margin: { left: 15, right: 15, top: headerHeight, bottom: 20 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 8,
          overflow: 'ellipsize',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [45, 55, 72],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          minCellHeight: 10
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center', overflow: 'ellipsize' }, // Data
          1: { cellWidth: 60, halign: 'left', overflow: 'ellipsize' },   // Conta (aumentada para comportar código + descrição)
          2: { cellWidth: 85, halign: 'left', overflow: 'ellipsize' },   // Histórico (reduzida para compensar)
          3: { cellWidth: 30, halign: 'right', overflow: 'ellipsize' },  // Débito
          4: { cellWidth: 30, halign: 'right', overflow: 'ellipsize' },  // Crédito
          5: { cellWidth: 25, halign: 'right', overflow: 'ellipsize' }   // Saldo
        },
        didDrawPage: (data) => {
          const pageInfo = (doc as any).internal;
          const pageNumber = pageInfo.getCurrentPageInfo ? pageInfo.getCurrentPageInfo().pageNumber : 1;
          
          // Se não é a primeira página, adicionar cabeçalho
          if (pageNumber > 1) {
            headerHeight = adicionarCabecalho();
            // Definir margem superior para a próxima página
            if (data.settings.margin) {
              data.settings.margin.top = headerHeight;
            }
          }
          
          // Adicionar rodapé
          const totalPages = pageInfo.getNumberOfPages ? pageInfo.getNumberOfPages() : 1;
          adicionarRodape(pageNumber, totalPages);
        },
        showHead: 'everyPage',
        didDrawCell: (data) => {
          // Se é uma nova página e não é a primeira, ajustar a posição
          if (data.section === 'head' && data.pageNumber > 1) {
            const currentHeaderHeight = adicionarCabecalho();
            if (data.settings.margin) {
              data.settings.margin.top = currentHeaderHeight;
            }
          }
        }
      });

      // Calcular totais para o rodapé da tabela
      const totalDebitos = lancamentos
        .filter(item => item.tipo === 'debito')
        .reduce((sum, item) => sum + Number(item.valor), 0);
      
      const totalCreditos = lancamentos
        .filter(item => item.tipo === 'credito')
        .reduce((sum, item) => sum + Number(item.valor), 0);

      // Adicionar linha de totais
      const finalY = (doc as any).lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      doc.text('Resumo do Período:', 15, finalY);
      doc.text(`Total de Débitos: ${formatCurrency(totalDebitos)}`, 15, finalY + 8);
      doc.text(`Total de Créditos: ${formatCurrency(totalCreditos)}`, 15, finalY + 16);
      doc.text(`Diferença: ${formatCurrency(totalDebitos - totalCreditos)}`, 15, finalY + 24);

      // Gerar nome do arquivo
      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const nomeArquivo = `razao-contabil-${dataAtual}.pdf`;

      // Fazer download do PDF
      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return false;
    }
  };

  return { gerarPdfLancamentos };
};
