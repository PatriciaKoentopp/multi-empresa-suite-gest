
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
