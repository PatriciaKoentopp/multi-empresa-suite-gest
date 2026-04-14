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
  numero_documento?: string;
  numero_parcela?: number;
}

interface PlanoContas {
  id: string;
  codigo: string;
  descricao: string;
}

interface ContaGrupo {
  contaCodigo: string;
  contaNome: string;
  lancamentos: LancamentoContabil[];
  totalDebitos: number;
  totalCreditos: number;
  saldoFinal: number;
}

const formatDateBR = (dateStr: string | Date): string => {
  if (typeof dateStr === "string") {
    if (dateStr.includes("/")) return dateStr;
    const [anoMesDia] = dateStr.split('T');
    const [ano, mes, dia] = anoMesDia.split('-');
    return `${dia}/${mes}/${ano}`;
  } else if (dateStr instanceof Date) {
    const dia = String(dateStr.getDate()).padStart(2, '0');
    const mes = String(dateStr.getMonth() + 1).padStart(2, '0');
    const ano = dateStr.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  return "";
};

const parseData = (data: string | Date): Date => {
  if (data instanceof Date) return data;
  if (typeof data === "string") {
    if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [d, m, y] = data.split("/").map(Number);
      return new Date(y, m - 1, d);
    }
    if (data.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [y, m, d] = data.split("T")[0].split("-").map(Number);
      return new Date(y, m - 1, d);
    }
  }
  return new Date(data);
};

const formatNfParcela = (lanc: LancamentoContabil): string => {
  const parts = [
    lanc.numero_documento,
    lanc.numero_parcela ? `P${lanc.numero_parcela}` : ''
  ].filter(Boolean);
  return parts.join('/') || '-';
};

export const usePdfLancamentos = () => {
  const gerarPdfLancamentos = (
    lancamentos: LancamentoContabil[],
    nomeEmpresa: string,
    contaSelecionada?: PlanoContas,
    dataInicial?: Date,
    dataFinal?: Date,
    tipoLancamentoFiltro?: string
  ) => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Agrupar por conta (mesma lógica da tela)
      const grupos = new Map<string, ContaGrupo>();

      lancamentos.forEach(lanc => {
        const key = lanc.conta_codigo || "sem-conta";
        if (!grupos.has(key)) {
          grupos.set(key, {
            contaCodigo: lanc.conta_codigo || "-",
            contaNome: lanc.conta_nome || "-",
            lancamentos: [],
            totalDebitos: 0,
            totalCreditos: 0,
            saldoFinal: 0,
          });
        }
        grupos.get(key)!.lancamentos.push(lanc);
      });

      // Ordenar grupos por código de conta
      const sortedKeys = Array.from(grupos.keys()).sort();
      const contasAgrupadas: ContaGrupo[] = [];

      sortedKeys.forEach(key => {
        const grupo = grupos.get(key)!;

        // Ordenar lançamentos por data dentro do grupo
        grupo.lancamentos.sort((a, b) => parseData(a.data).getTime() - parseData(b.data).getTime());

        // Calcular saldo acumulado
        let saldoAcumulado = 0;
        grupo.lancamentos.forEach(lanc => {
          if (lanc.tipo === "debito") {
            saldoAcumulado += lanc.valor;
            grupo.totalDebitos += lanc.valor;
          } else {
            saldoAcumulado -= lanc.valor;
            grupo.totalCreditos += lanc.valor;
          }
          lanc.saldo = saldoAcumulado;
        });
        grupo.saldoFinal = saldoAcumulado;
        contasAgrupadas.push(grupo);
      });

      // Função cabeçalho da página
      const adicionarCabecalho = (): number => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(nomeEmpresa, 15, 15);

        const titulo = 'Razão Contábil';
        const tituloW = doc.getTextWidth(titulo);
        doc.text(titulo, (pageWidth - tituloW) / 2, 15);

        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        doc.setFont('helvetica', 'normal');
        const geradoTxt = `Gerado em: ${dataGeracao}`;
        doc.text(geradoTxt, pageWidth - doc.getTextWidth(geradoTxt) - 15, 15);

        doc.setFontSize(9);
        let yPos = 25;

        if (contaSelecionada) {
          doc.text(`Conta: ${contaSelecionada.codigo} - ${contaSelecionada.descricao}`, 15, yPos);
          yPos += 5;
        }

        if (dataInicial && dataFinal) {
          doc.text(`Período: ${dataInicial.toLocaleDateString('pt-BR')} a ${dataFinal.toLocaleDateString('pt-BR')}`, 15, yPos);
          yPos += 5;
        }

        if (tipoLancamentoFiltro && tipoLancamentoFiltro !== "todos") {
          const tipos: Record<string, string> = { juros: "Juros", multa: "Multa", desconto: "Desconto", principal: "Principal" };
          doc.text(`Tipo: ${tipos[tipoLancamentoFiltro] || "Principal"}`, 15, yPos);
          yPos += 5;
        }

        return yPos + 5;
      };

      // Rodapé
      const adicionarRodape = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const txt = `Página ${pageNumber} de ${totalPages}`;
        doc.text(txt, pageWidth - doc.getTextWidth(txt) - 15, pageHeight - 10);
      };

      let startY = adicionarCabecalho();
      let headerHeight = startY;
      let totalGeralDebitos = 0;
      let totalGeralCreditos = 0;

      // Montar todos os dados em uma única tabela
      const dadosTabela: (string | { content: string; colSpan?: number; styles?: any })[][] = [];

      contasAgrupadas.forEach((grupo) => {
        totalGeralDebitos += grupo.totalDebitos;
        totalGeralCreditos += grupo.totalCreditos;

        // Linha de cabeçalho da conta
        dadosTabela.push([
          { content: `${grupo.contaCodigo} - ${grupo.contaNome}`, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [220, 230, 241], fontSize: 9, halign: 'left' } } as any
        ]);

        // Lançamentos
        grupo.lancamentos.forEach(lanc => {
          dadosTabela.push([
            formatDateBR(lanc.data),
            formatNfParcela(lanc),
            lanc.historico || '',
            lanc.tipo === "debito" ? formatCurrency(lanc.valor) : "-",
            lanc.tipo === "credito" ? formatCurrency(lanc.valor) : "-",
            formatCurrency(lanc.saldo || 0)
          ]);
        });

        // Linha de totais da conta
        dadosTabela.push([
          { content: `Totais - ${grupo.contaCodigo}`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [235, 235, 235], halign: 'left' } } as any,
          { content: formatCurrency(grupo.totalDebitos), styles: { fontStyle: 'bold', fillColor: [235, 235, 235], halign: 'right' } } as any,
          { content: formatCurrency(grupo.totalCreditos), styles: { fontStyle: 'bold', fillColor: [235, 235, 235], halign: 'right' } } as any,
          { content: formatCurrency(grupo.saldoFinal), styles: { fontStyle: 'bold', fillColor: [235, 235, 235], halign: 'right' } } as any,
        ]);
      });

      autoTable(doc, {
        head: [['Data', 'NF/Parcela', 'Histórico', 'Débito', 'Crédito', 'Saldo']],
        body: dadosTabela,
        startY: startY,
        margin: { left: 15, right: 15, top: headerHeight, bottom: 20 },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 7,
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
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 30, halign: 'left' },
          2: { cellWidth: 115, halign: 'left' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        },
        showHead: 'firstPage',
        didDrawPage: (data) => {
          const pageNumber = data.pageNumber || 1;
          if (pageNumber > 1) {
            adicionarCabecalho();
          }
          const totalPages = doc.internal.pages.length - 1;
          adicionarRodape(pageNumber, totalPages);
        },
      });

      // Resumo geral no final
      const finalY = ((doc as any).lastAutoTable?.finalY || 50) + 8;
      if (finalY > pageHeight - 40) {
        doc.addPage();
        adicionarCabecalho();
      }

      const resumoY = finalY > pageHeight - 40 ? 50 : finalY;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Geral:', 15, resumoY);
      doc.text(`Total de Débitos: ${formatCurrency(totalGeralDebitos)}`, 15, resumoY + 8);
      doc.text(`Total de Créditos: ${formatCurrency(totalGeralCreditos)}`, 15, resumoY + 16);
      doc.text(`Diferença: ${formatCurrency(totalGeralDebitos - totalGeralCreditos)}`, 15, resumoY + 24);

      // Atualizar rodapés com total correto de páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Limpar área do rodapé
        doc.setFillColor(255, 255, 255);
        doc.rect(pageWidth - 80, pageHeight - 15, 70, 10, 'F');
        adicionarRodape(i, totalPages);
      }

      const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      doc.save(`razao-contabil-${dataAtual}.pdf`);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return false;
    }
  };

  return { gerarPdfLancamentos };
};
