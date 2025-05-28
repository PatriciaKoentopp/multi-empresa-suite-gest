
export interface ContaCorrente {
  id: string;
  empresa_id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  saldo_inicial: number;
  considerar_saldo: boolean;
  status: 'ativo' | 'inativo';
  conta_contabil_id: string;
  data?: Date;
  created_at: string;
  updated_at: string;
}

export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  saldo_inicial: number;
}

export interface FluxoCaixa {
  id: string;
  empresa_id: string;
  conta_corrente_id?: string;
  data_movimentacao: Date;
  valor: number;
  saldo: number;
  tipo_operacao: 'receber' | 'pagar' | 'transferencia';
  origem: 'movimentacao' | 'antecipacao' | 'transferencia';
  movimentacao_parcela_id?: string;
  movimentacao_id?: string;
  antecipacao_id?: string;
  situacao: 'conciliado' | 'nao_conciliado';
  descricao?: string;
  forma_pagamento?: string;
  created_at: string;
  updated_at: string;
}

export interface FluxoCaixaItem {
  id: string;
  data: string;
  descricao: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface FluxoMensal {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  contaCorrenteId?: string;
}

export interface DadosFinanceiros {
  contasAPagar: {
    total: number;
    vencidas: number;
    vencendoHoje: number;
    proximos7Dias: number;
  };
  contasAReceber: {
    total: number;
    vencidas: number;
    vencendoHoje: number;
    proximos7Dias: number;
  };
  fluxoCaixa: {
    saldoAtual: number;
    receitasPrevistas: number;
    despesasPrevistas: number;
    saldoProjetado: number;
  };
}

export interface PainelFinanceiroData {
  contasAPagar: {
    total: number;
    vencidas: number;
    vencendoHoje: number;
    proximos7Dias: number;
  };
  contasAReceber: {
    total: number;
    vencidas: number;
    vencendoHoje: number;
    proximos7Dias: number;
  };
  fluxoCaixa: {
    saldoAtual: number;
    receitasPrevistas: number;
    despesasPrevistas: number;
    saldoProjetado: number;
  };
}

export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
}
