
export interface Movimentacao {
  id: string;
  empresa_id: string;
  tipo_operacao: 'pagar' | 'receber' | 'transferencia';
  data_emissao?: string;
  data_lancamento: string;
  numero_documento?: string;
  tipo_titulo_id?: string;
  favorecido_id?: string;
  categoria_id?: string;
  descricao?: string;
  valor: number;
  forma_pagamento?: string;
  numero_parcelas: number;
  primeiro_vencimento?: string;
  considerar_dre: boolean;
  conta_origem_id?: string;
  conta_destino_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoParcela {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  created_at: string;
  updated_at: string;
  data_pagamento?: string;
  conta_corrente_id?: string;
  multa?: number;
  juros?: number;
  desconto?: number;
  forma_pagamento?: string;
}

// Extensão para compatibilidade com ContaPagar
declare module "@/components/contas-a-pagar/contas-a-pagar-table" {
  interface ContaPagar {
    tipo_operacao?: 'pagar' | 'receber' | 'transferencia';
    tipo_titulo_id?: string;
    forma_pagamento?: string;
    numeroTitulo?: string;
  }
}
