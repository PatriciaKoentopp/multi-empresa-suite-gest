
export interface ContaContabil {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  considerar_dre: boolean;
  classificacao_dre: string;
  status: string;
  created_at: string;
  updated_at: string;
  empresa_id: string;
}

export interface LancamentoContabil {
  id: string;
  data: string;
  historico: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  movimentacao_id?: string;
  parcela_id?: string;
  tipo_lancamento?: string;
  // Propriedades adicionais que estão sendo usadas nas páginas
  conta?: string;
  conta_nome?: string;
  conta_codigo?: string;
  favorecido?: string;
  tipo?: "debito" | "credito";
  saldo?: number;
}
