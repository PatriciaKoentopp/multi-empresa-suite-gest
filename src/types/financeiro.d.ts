
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

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}

export interface FluxoCaixaItem {
  id: string;
  data: Date;
  descricao: string;
  conta_nome?: string;
  conta_id?: string;
  valor: number;
  tipo: 'entrada' | 'saida';
}

export interface ContaCorrenteItem {
  id: string;
  nome: string;
  saldo: number;
  considerar_saldo: boolean;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  contaId: string | null;
  situacao?: string | null;
}
