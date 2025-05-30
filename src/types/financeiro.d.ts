
export interface MovimentacaoParcela {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  forma_pagamento?: string;
  conta_corrente_id?: string;
  antecipacao_id?: string;
  valor_antecipacao_utilizado?: number;
  created_at: string;
  updated_at: string;
}

export interface Movimentacao {
  id: string;
  empresa_id: string;
  tipo_operacao: 'pagamento' | 'recebimento' | 'transferencia';
  numero_documento?: string;
  descricao?: string;
  data_emissao?: string;
  data_lancamento: string;
  mes_referencia?: string;
  tipo_titulo_id?: string;
  favorecido_id?: string;
  categoria_id?: string;
  valor: number;
  numero_parcelas: number;
  primeiro_vencimento?: string;
  forma_pagamento?: string;
  conta_origem_id?: string;
  conta_destino_id?: string;
  considerar_dre: boolean;
  documento_pdf?: string;
  created_at: string;
  updated_at: string;
}

export interface Antecipacao {
  id: string;
  empresa_id: string;
  tipo_operacao: string;
  numero_documento?: string;
  descricao?: string;
  data_emissao: string;
  data_lancamento: string;
  mes_referencia?: string;
  tipo_titulo_id?: string;
  favorecido_id?: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel?: number;
  forma_pagamento: string;
  conta_corrente_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
}

export interface ContasAPagar {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  forma_pagamento?: string;
  conta_corrente_id?: string;
  antecipacao_id?: string;
  valor_antecipacao_utilizado?: number;
  created_at: string;
  updated_at: string;
  movimentacao?: Movimentacao;
}

export interface ContasAReceber {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  forma_pagamento?: string;
  conta_corrente_id?: string;
  antecipacao_id?: string;
  valor_antecipacao_utilizado?: number;
  created_at: string;
  updated_at: string;
  movimentacao?: Movimentacao;
}

export interface FluxoCaixa {
  id: string;
  empresa_id: string;
  data_movimentacao: string;
  tipo_operacao: 'entrada' | 'saida';
  origem: string;
  descricao?: string;
  valor: number;
  saldo: number;
  situacao: 'conciliado' | 'nao_conciliado';
  forma_pagamento?: string;
  conta_corrente_id?: string;
  movimentacao_id?: string;
  movimentacao_parcela_id?: string;
  antecipacao_id?: string;
  created_at: string;
  updated_at: string;
}
