
export interface LancamentoContabil {
  id: string;
  empresa_id: string;
  data: string;
  historico: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

export interface PlanoContas {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  considerar_dre: boolean;
  classificacao_dre: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}
