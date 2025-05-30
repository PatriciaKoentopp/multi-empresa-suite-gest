export interface SalesData {
  total_receitas: number;
  total_despesas: number;
  total_investimentos: number;
  saldo_atual: number;
  contas_receber: number;
  contas_pagar: number;
  ticket_medio: number;
  novos_clientes: number;
  clientes_ativos: number;
}

export interface YearlyComparison {
  year: number;
  total: number;
  qtde_vendas: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

export interface FinanceiroDashboardData {
  saldo_total: number;
  total_receitas: number;
  total_despesas: number;
  contas_receber: number;
  contas_pagar: number;
  investimentos: number;
  fluxo_caixa: FluxoDeCaixa[];
  fluxo_por_mes: FluxoMensal[];
  contas_correntes: ContaCorrente[];
}

export interface FluxoDeCaixa {
  data: string;
  saldo: number;
}

export interface FluxoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ContaCorrente {
  id: number;
  nome: string;
  saldo: number;
  instituicao: string;
  considerar_saldo: boolean;
}
