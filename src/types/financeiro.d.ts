
export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  contaId?: string | null;
  conta_corrente_id?: string | null;
  situacao?: string | null;
}

export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  saldo_inicial: number;
  status: string;
  saldo?: number;
  considerar_saldo?: boolean;
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
  valor_utilizado?: number;
}

export interface DadosFinanceiros {
  total_a_receber: number;
  total_a_pagar: number;
  saldo_contas: number;
  previsao_saldo: number;
  contas_vencidas_receber: number;
  contas_vencidas_pagar: number;
  contas_a_vencer_receber: number;
  contas_a_vencer_pagar: number;
  fluxo_por_mes: FluxoMensal[];
  fluxo_caixa: FluxoCaixaItem[];
  contas_correntes: ContaCorrenteItem[];
}

export interface FluxoCaixaItem {
  id: string;
  data: Date;
  data_movimentacao: string;
  tipo_operacao: string;
  tipo: string;
  valor: number;
  saldo: number;
  saldo_calculado?: number;
  descricao?: string;
  origem: string;
  situacao: string;
  conta_nome?: string;
  conta_id?: string;
  favorecido?: string;
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  entradas: number;
  saidas: number;
  saldo: number;
  total_recebido: number;
  total_pago: number;
}
