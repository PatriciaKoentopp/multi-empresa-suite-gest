
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
}

export interface ParcelasFormProps {
  parcelas: any[];
  onValorChange: (valor: number) => void;
  onDataChange: (data: string) => void;
}
