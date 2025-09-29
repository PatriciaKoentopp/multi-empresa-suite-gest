import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function useExcelContasReceber() {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return "";
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  };

  const getStatusLabel = (status: string): string => {
    if (status === "recebido") return "Recebido";
    if (status === "recebido_em_atraso") return "Recebido em Atraso";
    return "Em Aberto";
  };

  const exportToExcel = async (contas: any[], filtros?: {
    searchTerm?: string;
    statusFilter?: string;
    dataVencInicio?: string;
    dataVencFim?: string;
  }) => {
    if (!contas || contas.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    setIsGenerating(true);

    try {
      // Preparar dados para o Excel
      const dadosExcel = contas.map(conta => ({
        "Data de Vencimento": formatDate(conta.dataVencimento),
        "Data de Recebimento": conta.dataRecebimento ? formatDate(conta.dataRecebimento) : "",
        "Parcela": conta.numeroParcela,
        "Cliente": conta.cliente,
        "Descrição": conta.descricao,
        "Status": getStatusLabel(conta.status),
        "Valor": conta.valor
      }));

      // Calcular totais
      const totalGeral = contas.reduce((sum, conta) => sum + conta.valor, 0);
      const totalRecebido = contas
        .filter(conta => conta.status === "recebido" || conta.status === "recebido_em_atraso")
        .reduce((sum, conta) => sum + conta.valor, 0);
      const totalEmAberto = contas
        .filter(conta => conta.status === "em_aberto")
        .reduce((sum, conta) => sum + conta.valor, 0);

      // Adicionar linha de totais
      dadosExcel.push({
        "Data de Vencimento": "",
        "Data de Recebimento": "",
        "Parcela": "" as any,
        "Cliente": "",
        "Descrição": "TOTAIS:",
        "Status": "",
        "Valor": totalGeral
      });

      dadosExcel.push({
        "Data de Vencimento": "",
        "Data de Recebimento": "",
        "Parcela": "" as any,
        "Cliente": "",
        "Descrição": "Total Recebido:",
        "Status": "",
        "Valor": totalRecebido
      });

      dadosExcel.push({
        "Data de Vencimento": "",
        "Data de Recebimento": "",
        "Parcela": "" as any,
        "Cliente": "",
        "Descrição": "Total em Aberto:",
        "Status": "",
        "Valor": totalEmAberto
      });

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExcel);

      // Configurar largura das colunas
      const colWidths = [
        { wch: 15 }, // Data de Vencimento
        { wch: 15 }, // Data de Recebimento
        { wch: 20 }, // Parcela
        { wch: 30 }, // Cliente
        { wch: 40 }, // Descrição
        { wch: 15 }, // Status
        { wch: 15 }  // Valor
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Contas a Receber");

      // Gerar nome do arquivo com data atual
      const hoje = new Date();
      const dataAtual = hoje.toLocaleDateString('pt-BR').replace(/\//g, '-');
      let nomeArquivo = `contas-a-receber-${dataAtual}`;

      // Adicionar filtros ao nome do arquivo se houver
      if (filtros?.statusFilter && filtros.statusFilter !== "todas") {
        nomeArquivo += `-${filtros.statusFilter}`;
      }

      nomeArquivo += ".xlsx";

      // Fazer download do arquivo
      XLSX.writeFile(wb, nomeArquivo);

      toast.success(`Planilha exportada como ${nomeArquivo}`);

    } catch (error) {
      console.error("Erro ao gerar planilha Excel:", error);
      toast.error("Erro ao gerar planilha Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    exportToExcel,
    isGenerating
  };
}