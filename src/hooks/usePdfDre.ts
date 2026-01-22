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

// Interface para resultado mensal
interface ResultadoMensal {
  mes: string;
  dados: GrupoMovimentacao[];
  contasPorTipo?: Record<string, ContaContabilAgrupamento[]>;
}

// Interface para dados da tabela
interface DadoTabelaPdf {
  conta: string;
  valor: string;
  isGrupo: boolean;
  isResultado: boolean;
  isNegativo: boolean;
}

// Lista de contas padrão do DRE
const contasDRE = [
  "Receita Bruta",
  "(-) Deduções",
  "Receita Líquida",
  "(-) Custos",
  "Lucro Bruto",
  "(-) Despesas Operacionais",
  "(+) Receitas Financeiras",
  "(-) Despesas Financeiras",
  "Resultado Antes IR",
  "(-) IRPJ/CSLL",
  "Lucro Líquido do Exercício",
  "(-) Distribuição de Lucros",
  "Resultado do Exercício"
];

// Contas que são linhas de resultado (calculadas, sem subcontas)
const contasResultado = [
  'Receita Líquida',
  'Lucro Bruto',
  'Resultado Operacional',
  'Resultado Antes IR',
  'Lucro Líquido do Exercício',
  'Resultado do Exercício'
];

// Nomes abreviados dos meses
const mesesAbreviados: Record<string, string> = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez"
};

export const usePdfDre = () => {
  // Função para formatar data atual
  const formatarDataAtual = (): string => {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
  };

  // Função para formatar valor como moeda
  const formatarValor = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    });
  };

  // PDF para visualização acumulada ou mês específico (Portrait)
  const gerarPdfDre = (
    dadosDRE: GrupoMovimentacao[],
    nomeEmpresa: string,
    periodoTexto: string
  ): boolean => {
    try {
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

      const adicionarCabecalho = () => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, marginLeft, marginTop);

        doc.setFontSize(14);
        doc.text('DRE - Demonstração do Resultado', pageWidth / 2, marginTop, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${formatarDataAtual()}`, pageWidth - marginRight, marginTop, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`Período: ${periodoTexto}`, marginLeft, marginTop + 8);

        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, marginTop + 12, pageWidth - marginRight, marginTop + 12);
      };

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

      const dadosTabela: DadoTabelaPdf[] = [];

      dadosDRE.forEach((grupo) => {
        const isResultado = contasResultado.includes(grupo.tipo);
        const valorNumerico = grupo.valor || 0;

        dadosTabela.push({
          conta: grupo.tipo,
          valor: formatCurrency(valorNumerico),
          isGrupo: true,
          isResultado: isResultado,
          isNegativo: valorNumerico < 0
        });

        if (!isResultado && grupo.contas && grupo.contas.length > 0) {
          grupo.contas.forEach((conta) => {
            const valorConta = conta.valor || 0;
            // Remover símbolo "%" do início da descrição, se existir
            let descricaoLimpa = conta.descricao;
            if (descricaoLimpa.startsWith('%')) {
              descricaoLimpa = descricaoLimpa.substring(1).trim();
            }
            dadosTabela.push({
              conta: `  └ ${descricaoLimpa}`,
              valor: formatCurrency(valorConta),
              isGrupo: false,
              isResultado: false,
              isNegativo: valorConta < 0
            });
          });
        }
      });

      adicionarCabecalho();

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
              if (rowData.isGrupo) {
                data.cell.styles.fontStyle = 'bold';
              }

              if (rowData.isResultado) {
                data.cell.styles.fillColor = [235, 235, 235];
                data.cell.styles.fontStyle = 'bold';
              }

              if (data.column.index === 1 && rowData.isNegativo) {
                data.cell.styles.textColor = [180, 0, 0];
              }
            }
          }
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            adicionarCabecalho();
          }
        },
        margin: { top: marginTop + 18, left: marginLeft, right: marginRight, bottom: 20 }
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        adicionarRodape(i, totalPages);
      }

      const dataAtual = new Date();
      const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}${String(dataAtual.getMonth() + 1).padStart(2, '0')}${dataAtual.getFullYear()}`;
      const nomeArquivo = `DRE_${periodoTexto.replace(/[^a-zA-Z0-9]/g, '_')}_${dataFormatada}.pdf`;

      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF do DRE:', error);
      return false;
    }
  };

  // PDF para comparação de anos (Landscape)
  const gerarPdfDreComparacaoAnos = (
    dadosPorAno: Record<string, GrupoMovimentacao[]>,
    anosComparar: string[],
    nomeEmpresa: string
  ): boolean => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 15;

      // Ordenar anos em ordem decrescente
      const anosOrdenados = [...anosComparar].sort((a, b) => parseInt(b) - parseInt(a));
      const temVariacao = anosOrdenados.length === 2;

      const adicionarCabecalho = () => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, marginLeft, marginTop);

        doc.setFontSize(14);
        doc.text('DRE - Comparativo Anual', pageWidth / 2, marginTop, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${formatarDataAtual()}`, pageWidth - marginRight, marginTop, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`Período: ${anosOrdenados.join(' vs ')}`, marginLeft, marginTop + 8);

        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, marginTop + 12, pageWidth - marginRight, marginTop + 12);
      };

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

      // Montar cabeçalhos
      const cabecalhos = ['Conta', ...anosOrdenados];
      if (temVariacao) {
        cabecalhos.push('Variação', '%');
      }

      // Coletar todas as subcontas únicas por conta
      const subcontasPorConta: Record<string, Set<string>> = {};
      contasDRE.forEach(conta => {
        subcontasPorConta[conta] = new Set();
        anosOrdenados.forEach(ano => {
          const grupo = dadosPorAno[ano]?.find(g => g.tipo === conta);
          grupo?.contas?.forEach(c => {
            subcontasPorConta[conta].add(c.descricao);
          });
        });
      });

      // Preparar dados para a tabela
      interface LinhaTabela {
        dados: string[];
        isGrupo: boolean;
        isResultado: boolean;
        isNegativo: boolean;
        variacaoNegativa?: boolean;
      }

      const linhasTabela: LinhaTabela[] = [];

      contasDRE.forEach(conta => {
        const isResultado = contasResultado.includes(conta);

        // Linha principal
        const linha: string[] = [conta];
        const valores: number[] = [];

        anosOrdenados.forEach(ano => {
          const grupo = dadosPorAno[ano]?.find(g => g.tipo === conta);
          const valor = grupo?.valor || 0;
          valores.push(valor);
          linha.push(formatarValor(valor));
        });

        let variacaoNegativa = false;
        if (temVariacao) {
          const valorAtual = valores[0];
          const valorAnterior = valores[1];
          const variacao = valorAtual - valorAnterior;
          const percentual = valorAnterior !== 0 ? (variacao / Math.abs(valorAnterior)) * 100 : 0;
          
          linha.push(formatarValor(variacao));
          linha.push(valorAnterior !== 0 ? `${percentual.toFixed(1)}%` : '-');
          variacaoNegativa = variacao < 0;
        }

        linhasTabela.push({
          dados: linha,
          isGrupo: true,
          isResultado,
          isNegativo: valores[0] < 0,
          variacaoNegativa
        });

        // Subcontas
        if (!isResultado) {
          const subcontas = Array.from(subcontasPorConta[conta]);
          subcontas.forEach(descricao => {
            // Remover símbolo "%" do início da descrição, se existir
            let descricaoLimpa = descricao;
            if (descricaoLimpa.startsWith('%')) {
              descricaoLimpa = descricaoLimpa.substring(1).trim();
            }
            const linhaSub: string[] = [`  └ ${descricaoLimpa}`];
            const valoresSub: number[] = [];

            anosOrdenados.forEach(ano => {
              const grupo = dadosPorAno[ano]?.find(g => g.tipo === conta);
              const subconta = grupo?.contas?.find(c => c.descricao === descricao);
              const valor = subconta?.valor || 0;
              valoresSub.push(valor);
              linhaSub.push(formatarValor(valor));
            });

            let variacaoSubNegativa = false;
            if (temVariacao) {
              const valorAtual = valoresSub[0];
              const valorAnterior = valoresSub[1];
              const variacao = valorAtual - valorAnterior;
              const percentual = valorAnterior !== 0 ? (variacao / Math.abs(valorAnterior)) * 100 : 0;
              
              linhaSub.push(formatarValor(variacao));
              linhaSub.push(valorAnterior !== 0 ? `${percentual.toFixed(1)}%` : '-');
              variacaoSubNegativa = variacao < 0;
            }

            linhasTabela.push({
              dados: linhaSub,
              isGrupo: false,
              isResultado: false,
              isNegativo: valoresSub[0] < 0,
              variacaoNegativa: variacaoSubNegativa
            });
          });
        }
      });

      adicionarCabecalho();

      // Configurar larguras das colunas
      const numColunas = cabecalhos.length;
      const larguraDisponivel = pageWidth - marginLeft - marginRight;
      const larguraConta = 70;
      const larguraValor = (larguraDisponivel - larguraConta) / (numColunas - 1);

      const columnStyles: Record<number, { cellWidth: number; halign: 'left' | 'right' | 'center' }> = {
        0: { cellWidth: larguraConta, halign: 'left' }
      };
      for (let i = 1; i < numColunas; i++) {
        columnStyles[i] = { cellWidth: larguraValor, halign: 'right' };
      }

      autoTable(doc, {
        startY: marginTop + 18,
        head: [cabecalhos],
        body: linhasTabela.map(row => row.dados),
        columnStyles,
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const rowData = linhasTabela[rowIndex];

            if (rowData) {
              if (rowData.isGrupo) {
                data.cell.styles.fontStyle = 'bold';
              }

              if (rowData.isResultado) {
                data.cell.styles.fillColor = [235, 235, 235];
                data.cell.styles.fontStyle = 'bold';
              }

              // Coluna de variação em vermelho se negativa
              if (temVariacao && data.column.index >= numColunas - 2 && rowData.variacaoNegativa) {
                data.cell.styles.textColor = [180, 0, 0];
              }

              // Valores negativos em vermelho
              if (data.column.index >= 1 && data.column.index < numColunas - (temVariacao ? 2 : 0) && rowData.isNegativo) {
                data.cell.styles.textColor = [180, 0, 0];
              }
            }
          }
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            adicionarCabecalho();
          }
        },
        margin: { top: marginTop + 18, left: marginLeft, right: marginRight, bottom: 20 }
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        adicionarRodape(i, totalPages);
      }

      const dataAtual = new Date();
      const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}${String(dataAtual.getMonth() + 1).padStart(2, '0')}${dataAtual.getFullYear()}`;
      const nomeArquivo = `DRE_Comparativo_${anosOrdenados.join('_')}_${dataFormatada}.pdf`;

      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF do DRE Comparativo:', error);
      return false;
    }
  };

  // PDF para resultado mensal com todos os meses (Landscape)
  const gerarPdfDreMensal = (
    resultadosMensais: ResultadoMensal[],
    anoMensal: string,
    nomeEmpresa: string
  ): boolean => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 8;
      const marginRight = 8;
      const marginTop = 15;

      // Ordenar meses
      const mesesOrdenados = [...resultadosMensais].sort((a, b) => a.mes.localeCompare(b.mes));

      const adicionarCabecalho = () => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, marginLeft, marginTop);

        doc.setFontSize(14);
        doc.text('DRE - Resultado Mensal', pageWidth / 2, marginTop, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${formatarDataAtual()}`, pageWidth - marginRight, marginTop, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`Ano: ${anoMensal}`, marginLeft, marginTop + 8);

        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, marginTop + 12, pageWidth - marginRight, marginTop + 12);
      };

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

      // Montar cabeçalhos: Conta + 12 meses + Acumulado
      const cabecalhos = ['Conta'];
      mesesOrdenados.forEach(r => {
        cabecalhos.push(mesesAbreviados[r.mes] || r.mes);
      });
      cabecalhos.push('Acumulado');

      // Coletar todas as subcontas únicas por conta
      const subcontasPorConta: Record<string, Set<string>> = {};
      contasDRE.forEach(conta => {
        subcontasPorConta[conta] = new Set();
        mesesOrdenados.forEach(resultado => {
          const grupo = resultado.dados?.find(g => g.tipo === conta);
          grupo?.contas?.forEach(c => {
            subcontasPorConta[conta].add(c.descricao);
          });
        });
      });

      // Preparar dados para a tabela
      interface LinhaTabela {
        dados: string[];
        isGrupo: boolean;
        isResultado: boolean;
        isNegativo: boolean;
      }

      const linhasTabela: LinhaTabela[] = [];

      contasDRE.forEach(conta => {
        const isResultado = contasResultado.includes(conta);

        // Linha principal
        const linha: string[] = [conta];
        let acumulado = 0;
        let temValorNegativo = false;

        mesesOrdenados.forEach(resultado => {
          const grupo = resultado.dados?.find(g => g.tipo === conta);
          const valor = grupo?.valor || 0;
          acumulado += valor;
          if (valor < 0) temValorNegativo = true;
          linha.push(formatarValor(valor));
        });

        linha.push(formatarValor(acumulado));

        linhasTabela.push({
          dados: linha,
          isGrupo: true,
          isResultado,
          isNegativo: temValorNegativo || acumulado < 0
        });

        // Subcontas
        if (!isResultado) {
          const subcontas = Array.from(subcontasPorConta[conta]);
          subcontas.forEach(descricao => {
            // Remover símbolo "%" do início da descrição, se existir
            let descricaoLimpa = descricao;
            if (descricaoLimpa.startsWith('%')) {
              descricaoLimpa = descricaoLimpa.substring(1).trim();
            }
            const linhaSub: string[] = [`  └ ${descricaoLimpa}`];
            let acumuladoSub = 0;
            let temValorSubNegativo = false;

            mesesOrdenados.forEach(resultado => {
              const grupo = resultado.dados?.find(g => g.tipo === conta);
              const subconta = grupo?.contas?.find(c => c.descricao === descricao);
              const valor = subconta?.valor || 0;
              acumuladoSub += valor;
              if (valor < 0) temValorSubNegativo = true;
              linhaSub.push(formatarValor(valor));
            });

            linhaSub.push(formatarValor(acumuladoSub));

            linhasTabela.push({
              dados: linhaSub,
              isGrupo: false,
              isResultado: false,
              isNegativo: temValorSubNegativo || acumuladoSub < 0
            });
          });
        }
      });

      adicionarCabecalho();

      // Configurar larguras das colunas
      const numColunas = cabecalhos.length;
      const larguraDisponivel = pageWidth - marginLeft - marginRight;
      const larguraConta = 55;
      const larguraValor = (larguraDisponivel - larguraConta) / (numColunas - 1);

      const columnStyles: Record<number, { cellWidth: number; halign: 'left' | 'right' | 'center' }> = {
        0: { cellWidth: larguraConta, halign: 'left' }
      };
      for (let i = 1; i < numColunas; i++) {
        columnStyles[i] = { cellWidth: larguraValor, halign: 'right' };
      }

      autoTable(doc, {
        startY: marginTop + 18,
        head: [cabecalhos],
        body: linhasTabela.map(row => row.dados),
        columnStyles,
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const rowData = linhasTabela[rowIndex];

            if (rowData) {
              if (rowData.isGrupo) {
                data.cell.styles.fontStyle = 'bold';
              }

              if (rowData.isResultado) {
                data.cell.styles.fillColor = [235, 235, 235];
                data.cell.styles.fontStyle = 'bold';
              }

              // Coluna Acumulado (última)
              if (data.column.index === numColunas - 1) {
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            adicionarCabecalho();
          }
        },
        margin: { top: marginTop + 18, left: marginLeft, right: marginRight, bottom: 20 }
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        adicionarRodape(i, totalPages);
      }

      const dataAtual = new Date();
      const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}${String(dataAtual.getMonth() + 1).padStart(2, '0')}${dataAtual.getFullYear()}`;
      const nomeArquivo = `DRE_Mensal_${anoMensal}_${dataFormatada}.pdf`;

      doc.save(nomeArquivo);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF do DRE Mensal:', error);
      return false;
    }
  };

  return { gerarPdfDre, gerarPdfDreComparacaoAnos, gerarPdfDreMensal };
};
