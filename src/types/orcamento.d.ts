
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

// Interface para orçamentos com favorecido
export interface Orcamento {
  id: string;
  codigo: string;
  favorecido_id: string;
  favorecido?: {
    nome: string;
  };
  numero_nota_fiscal?: string;
  tipo: 'orcamento' | 'venda';
  status: string;
  data_venda?: string;
  created_at: string;
  updated_at: string;
}
