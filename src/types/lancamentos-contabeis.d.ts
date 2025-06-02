
export interface LancamentoContabil {
  id: string;
  empresa_id?: string;
  data: string | Date;
  historico: string;
  conta_debito_id?: string;
  conta_credito_id?: string;
  conta?: string; // Campo usado na visualização (mantido para compatibilidade)
  conta_nome?: string;
  conta_codigo?: string;
  tipo?: 'debito' | 'credito';
  valor: number;
  saldo?: number;
  movimentacao_id?: string;
  parcela_id?: string;
  tipo_lancamento?: 'principal' | 'juros' | 'multa' | 'desconto';
  favorecido?: string; // Nome do favorecido para exibição no histórico
}
