

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

// Interfaces para antecipações
export interface Antecipacao {
  id: string;
  empresa_id: string;
  favorecido_id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
  data_emissao: string;
  data_lancamento: string;
  forma_pagamento: string;
  tipo_operacao: 'receber' | 'pagar';
  status: 'ativa' | 'inativa';
  created_at: string;
  updated_at: string;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
  valor_utilizado: number;
}

// Interfaces para dados financeiros do dashboard
export interface DadosFinanceiros {
  total_a_receber: number;
  total_a_pagar: number;
  saldo_contas: number;
  previsao_saldo: number;
  contas_vencidas_receber: number;
  contas_a_vencer_receber: number;
  contas_vencidas_pagar: number;
  contas_a_vencer_pagar: number;
  contas_correntes: ContaCorrenteItem[];
  fluxo_caixa: FluxoCaixaItem[];
  fluxo_por_mes: FluxoMensal[];
}

export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  saldo_inicial: number;
  considerar_saldo: boolean;
  status: string;
  empresa_id: string;
}

// Interfaces para fluxo de caixa
export interface FluxoCaixaItem {
  id: string;
  data: string;
  data_movimentacao: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  tipo_operacao: 'receber' | 'pagar';
  origem: string;
  situacao: string;
  forma_pagamento?: string;
  conta_corrente_id?: string;
  movimentacao_id?: string;
  movimentacao_parcela_id?: string;
  antecipacao_id?: string;
  empresa_id: string;
  entradas?: number;
  saidas?: number;
  saldo?: number;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  contaId: string | null;
  conta_corrente_id?: string | null;
  situacao: string | null;
}

export interface FluxoMensal {
  mes: string;
  ano: number;
  entradas: number;
  saidas: number;
  saldo: number;
}

// Interfaces para análise DRE
export interface AnaliseVariacao {
  conta_id: string;
  conta_descricao: string;
  valor_atual: number;
  valor_anterior: number;
  variacao_absoluta: number;
  variacao_percentual: number;
}

export interface DetalhesMensaisConta {
  conta_id: string;
  conta_descricao: string;
  valores_mensais: ValorMensal[];
  total: number;
}

export interface ValorMensal {
  mes: number;
  ano: number;
  valor: number;
}

export interface FiltroAnaliseDre {
  ano: number;
  meses_selecionados: number[];
  contas_selecionadas: string[];
  incluir_subcategorias: boolean;
}

