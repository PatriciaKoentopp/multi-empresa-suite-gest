
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

export interface FiltroFluxoCaixa {
  dataInicio: Date | undefined;
  dataFim: Date | undefined;
  conta_corrente_id?: string;
  situacao?: string;
  contaId?: string;
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

// Interfaces para antecipações
export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
  data_lancamento: string;
  status: 'ativa' | 'utilizada' | 'cancelada';
  favorecido?: {
    nome: string;
  };
}

export interface AntecipacaoSelecionada {
  id: string;
  valor_utilizado?: number;
  valor?: number;
  [key: string]: any; // Permitir propriedades adicionais
}

// Interface para conta corrente
export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  agencia: string;  
  numero: string;
}
