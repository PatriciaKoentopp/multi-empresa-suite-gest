
export interface Parcela {
  valor: number;
  dataVencimento: string;
  numeroParcela: string;
}

export interface OrcamentoItem {
  servicoId?: string;
  produtoId?: string;
  valor: number;
  tipoItem: "servico" | "produto";
}

export interface OrcamentoFormData {
  data: Date | undefined;
  codigoVenda: string;
  favorecidoId: string;
  codigoProjeto: string;
  observacoes: string;
  formaPagamento: string;
  numeroParcelas: number;
  dataNotaFiscal: string;
  numeroNotaFiscal: string;
  notaFiscalPdf: File | null;
  notaFiscalPdfUrl: string;
  servicos: OrcamentoItem[];
  parcelas: Parcela[];
}
