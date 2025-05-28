
export interface Contrato {
  id: string;
  empresa_id: string;
  favorecido_id: string;
  codigo: string;
  servico_id: string;
  descricao?: string;
  valor_mensal: number;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  dia_vencimento: number;
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  forma_pagamento: string;
  observacoes?: string;
  status: 'ativo' | 'suspenso' | 'encerrado';
  gerar_automatico: boolean;
  created_at: string;
  updated_at: string;
  
  // Campos relacionados
  favorecido?: {
    nome: string;
    documento: string;
  };
  servico?: {
    nome: string;
  };
}

export interface ContratoParcela {
  id: string;
  contrato_id: string;
  numero_parcela: string;
  valor: number;
  data_vencimento: string;
  data_geracao_conta?: string;
  movimentacao_id?: string;
  status: 'pendente' | 'gerada' | 'paga';
  created_at: string;
  updated_at: string;
}

export interface ContratoFormData {
  codigo: string;
  favorecido_id: string;
  servico_id: string;
  descricao: string;
  valor_mensal: number;
  data_inicio: Date | undefined;
  data_fim: Date | undefined;
  dia_vencimento: number;
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  forma_pagamento: string;
  observacoes: string;
  gerar_automatico: boolean;
}
