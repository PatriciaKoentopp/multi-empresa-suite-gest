
export interface ContaReceber {
  id: string;
  cliente: string;
  descricao: string;
  dataVencimento: Date;
  data_vencimento: string;
  valor: number;
  status: 'em_aberto' | 'pago' | 'vencido';
  numeroParcela: string;
  origem: string;
  tipo?: string;
  movimentacao?: any;
}

export interface ContaPagar {
  id: string;
  fornecedor: string;
  descricao: string;
  dataVencimento: Date;
  valor: number;
  status: 'em_aberto' | 'pago' | 'vencido';
  numeroParcela: string;
}

export interface MovimentacaoFinanceira {
  id: string;
  tipo_operacao: 'receber' | 'pagar';
  descricao: string;
  valor: number;
  data_lancamento: string;
  favorecido_id?: string;
  empresa_id: string;
  numero_documento?: string;
  forma_pagamento?: string;
  categoria_id?: string;
  conta_origem_id?: string;
  conta_destino_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ParcelaMovimentacao {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  valor_pago?: number;
  multa?: number;
  juros?: number;
  desconto?: number;
  created_at: string;
  updated_at: string;
}
