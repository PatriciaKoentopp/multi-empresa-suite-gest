
export interface Orcamento {
  id: string;
  empresa_id: string;
  favorecido_id: string;
  favorecido?: {
    nome: string;
    documento: string;
  };
  codigo: string;
  data: string;
  tipo: 'orcamento' | 'venda';
  status: 'ativo' | 'inativo';
  forma_pagamento: string;
  numero_parcelas: number;
  observacoes?: string | null;
  codigo_projeto?: string | null;
  data_venda?: string | null;
  data_nota_fiscal?: string | null;
  numero_nota_fiscal?: string | null;
  nota_fiscal_pdf?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  servico_id: string;
  servicoId: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoParcela {
  id: string;
  orcamento_id: string;
  numero_parcela: string;
  valor: number;
  data_vencimento: string;
  created_at: string;
  updated_at: string;
}
