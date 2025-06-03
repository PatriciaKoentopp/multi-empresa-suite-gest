
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

// Interfaces para fluxo de caixa
export interface FluxoCaixaItem {
  id: string;
  data: Date;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  origem: string;
  situacao: string;
  conta_corrente_id?: string;
  favorecido?: string;
  conta_nome?: string;
  conta_id?: string;
}

// Interfaces para dados financeiros
export interface DadosFinanceiros {
  total_a_receber: number;
  total_a_pagar: number;
  saldo_contas: number;
  previsao_saldo: number;
  contas_vencidas_receber: number;
  contas_a_vencer_receber: number;
  contas_vencidas_pagar: number;
  contas_a_vencer_pagar: number;
  fluxo_por_mes?: FluxoMensal[];
  fluxo_caixa?: FluxoCaixaItem[];
  contas_correntes?: any[];
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}

// Interface para conta corrente
export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
}
