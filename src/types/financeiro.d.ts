
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

// Novas interfaces para a análise do DRE
export interface AnaliseVariacao {
  nome: string;
  valor_atual: number;
  valor_comparacao: number;
  variacao_valor: number;
  variacao_percentual: number;
  tipo_conta: string;
  grupo_pai?: string;
  subcontas?: AnaliseVariacao[];
  avaliacao: 'positiva' | 'negativa' | 'estavel' | 'atencao';
  nivel: 'principal' | 'subconta';
  detalhes_mensais?: DetalhesMensaisConta; // Adicionando detalhes mensais
}

export interface FiltroAnaliseDre {
  tipo_comparacao: 'mes_anterior' | 'ano_anterior' | 'media_12_meses';
  ano: number;
  mes: number; 
  percentual_minimo: number;
}

// Nova interface para detalhes mensais das contas
export interface DetalhesMensaisConta {
  nome_conta: string;
  valores_mensais: ValorMensal[];
  media: number;
}

export interface ValorMensal {
  mes: number;
  ano: number;
  mes_nome: string;
  valor: number;
}
