
export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel?: number;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
  valor_utilizado?: number;
}
