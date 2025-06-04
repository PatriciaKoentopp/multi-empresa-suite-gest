
export interface ContaContabil {
  id: string;
  codigo: string;
  descricao: string;
  tipo: "ativo" | "passivo" | "receita" | "despesa" | "patrimonio";
  categoria: "título" | "movimentação";
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
  // Campos opcionais para vincular com movimentações
  movimentacao_id?: string;
  parcela_id?: string;
  tipo_lancamento?: "principal" | "juros" | "multa" | "desconto";
  // Propriedades computadas para exibição
  conta_codigo?: string;
  conta_nome?: string;
  favorecido?: string;
  tipo?: "debito" | "credito";
  saldo?: number;
}
