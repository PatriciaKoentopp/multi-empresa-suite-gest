
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
}

export interface TipoTitulo {
  id: string;
  nome: string;
  tipo: string;
  empresa_id: string;
  conta_contabil_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interfaces para fluxo de caixa
export interface FluxoCaixaItem {
  id: string;
  data_movimentacao: string;
  descricao: string;
  tipo_operacao: 'receber' | 'pagar' | 'transferencia';
  valor: number;
  origem: string;
  situacao: string;
  conta_corrente_id?: string;
  favorecido?: string;
  conta_nome?: string;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  conta_corrente_id: string;
  situacao: string;
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
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}
