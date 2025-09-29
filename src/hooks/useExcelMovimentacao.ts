import { useCallback } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface MovimentacaoItem {
  id: string;
  favorecido: string;
  descricao: string;
  dataLancamento?: string;
  mes_referencia?: string;
  tipo_operacao?: 'pagar' | 'receber' | 'transferencia';
  valor: number;
  numeroTitulo?: string;
  numeroParcela?: string;
}

export const useExcelMovimentacao = () => {
  const formatTipoOperacao = (tipo?: string) => {
    switch (tipo) {
      case "pagar":
        return "Pagar";
      case "receber":
        return "Receber";
      case "transferencia":
        return "Transferência";
      default:
        return tipo || "";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return format(date, "dd/MM/yyyy");
    } catch {
      return "";
    }
  };

  const exportToExcel = useCallback((movimentacoes: any[], searchTerm?: string, periodo?: string) => {
    try {
      if (!movimentacoes || movimentacoes.length === 0) {
        toast.error("Não há dados para exportar");
        return;
      }

      // Converter dados para o formato Excel
      const excelData = movimentacoes.map((mov: MovimentacaoItem) => ({
        "Data de Lançamento": formatDate(mov.dataLancamento),
        "Título/Parcela": mov.numeroTitulo && mov.numeroParcela 
          ? `${mov.numeroTitulo}/${mov.numeroParcela}` 
          : mov.numeroTitulo || mov.numeroParcela || "-",
        "Favorecido": mov.favorecido || "",
        "Descrição": mov.descricao || "",
        "Referência": mov.mes_referencia || "",
        "Tipo": formatTipoOperacao(mov.tipo_operacao),
        "Valor": mov.valor || 0
      }));

      // Calcular totais
      const totalGeral = movimentacoes.reduce((sum, mov) => sum + (mov.valor || 0), 0);
      const totalPagar = movimentacoes
        .filter(mov => mov.tipo_operacao === 'pagar')
        .reduce((sum, mov) => sum + (mov.valor || 0), 0);
      const totalReceber = movimentacoes
        .filter(mov => mov.tipo_operacao === 'receber')
        .reduce((sum, mov) => sum + (mov.valor || 0), 0);
      const totalTransferencia = movimentacoes
        .filter(mov => mov.tipo_operacao === 'transferencia')
        .reduce((sum, mov) => sum + (mov.valor || 0), 0);

      // Adicionar linhas de total
      excelData.push(
        {} as any, // Linha vazia
        {
          "Data de Lançamento": "",
          "Título/Parcela": "",
          "Favorecido": "",
          "Descrição": "",
          "Referência": "",
          "Tipo": "TOTAL GERAL",
          "Valor": totalGeral
        } as any,
        {
          "Data de Lançamento": "",
          "Título/Parcela": "",
          "Favorecido": "",
          "Descrição": "",
          "Referência": "",
          "Tipo": "Total a Pagar",
          "Valor": totalPagar
        } as any,
        {
          "Data de Lançamento": "",
          "Título/Parcela": "",
          "Favorecido": "",
          "Descrição": "",
          "Referência": "",
          "Tipo": "Total a Receber",
          "Valor": totalReceber
        } as any,
        {
          "Data de Lançamento": "",
          "Título/Parcela": "",
          "Favorecido": "",
          "Descrição": "",
          "Referência": "",
          "Tipo": "Total Transferências",
          "Valor": totalTransferencia
        } as any
      );

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Definir larguras das colunas
      ws['!cols'] = [
        { wch: 15 }, // Data de Lançamento
        { wch: 20 }, // Título/Parcela
        { wch: 30 }, // Favorecido
        { wch: 40 }, // Descrição
        { wch: 15 }, // Referência
        { wch: 15 }, // Tipo
        { wch: 15 }  // Valor
      ];

      // Formatação monetária para a coluna Valor
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 6 }); // Coluna G (Valor)
        const cell = ws[cellAddress];
        if (cell && typeof cell.v === 'number') {
          cell.z = '"R$ "#,##0.00';
        }
      }

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Movimentações");

      // Gerar nome do arquivo
      const dataAtual = format(new Date(), "dd-MM-yyyy");
      let nomeArquivo = `movimentacoes-${dataAtual}`;
      
      if (searchTerm) {
        nomeArquivo += `-busca-${searchTerm.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
      
      if (periodo && periodo !== "mes_atual") {
        nomeArquivo += `-${periodo}`;
      }
      
      nomeArquivo += ".xlsx";

      // Fazer download
      XLSX.writeFile(wb, nomeArquivo);
      
      toast.success(`Planilha exportada: ${nomeArquivo}`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar planilha Excel");
    }
  }, []);

  return {
    exportToExcel
  };
};