
export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel?: number;
  empresa_id: string;
  favorecido_id: string;
  tipo_operacao: string;
  status: string;
  data_lancamento: string;
  data_emissao: string;
  forma_pagamento: string;
  created_at: string;
  updated_at: string;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  conta_corrente_id?: string;
  situacao: string;
}
