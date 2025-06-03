
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
  contasAPagar: {
    vencendo: number;
    vencidas: number;
    total: number;
  };
  contasAReceber: {
    vencendo: number;
    vencidas: number;
    total: number;
  };
  saldoContas: number;
}

export interface FluxoCaixaItem {
  id: string;
  data_movimentacao: string;
  tipo_operacao: string;
  valor: number;
  saldo: number;
  descricao?: string;
  origem: string;
  situacao: string;
}

export interface FluxoMensal {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
}
