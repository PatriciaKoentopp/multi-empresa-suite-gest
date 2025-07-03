
export interface Parcela {
  valor: number;
  dataVencimento: string;
  numeroParcela: string;
}

export interface OrcamentoItem {
  servicoId: string;
  valor: number;
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

// Interface específica para orçamentos no contexto do fluxo de caixa
export interface OrcamentoFluxoCaixa {
  id: string;
  codigo: string;
  numero_nota_fiscal: string;
  tipo: 'venda' | 'compra';
}
