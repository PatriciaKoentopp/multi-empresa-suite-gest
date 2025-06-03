
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
