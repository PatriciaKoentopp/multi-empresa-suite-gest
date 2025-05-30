
export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  conta_corrente_id: string | null;
  situacao: string | null;
}

export interface FluxoCaixaItem {
  id: string;
  data: Date;
  descricao: string;
  conta_nome: string;
  conta_id: string;
  valor: number;
  tipo: "entrada" | "saida";
  favorecido: string;
  origem: string;
  situacao: string;
}

export interface FluxoCaixaSaldo {
  saldoAnterior: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
}

export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  favorecido_id: string;
  tipo_operacao: "receber" | "pagar";
  status: "ativa" | "inativa";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
}

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
  entradas: number;
  saidas: number;
  saldo: number;
  total_recebido: number;
  total_pago: number;
}
