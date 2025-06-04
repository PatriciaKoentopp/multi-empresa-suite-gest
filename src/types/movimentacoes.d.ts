
export interface MovimentacaoItem {
  id: string;
  data: string;
  tipo: "entrada" | "saida" | "transferencia";
  tipo_operacao: string;
  valor: number;
  descricao: string;
  conta_corrente_id: string;
  favorecido_id?: string;
  categoria?: string;
  observacoes?: string;
  documento?: string;
  situacao: "pendente" | "efetivada" | "cancelada";
  created_at: string;
  updated_at: string;
  empresa_id: string;
  conta_corrente?: {
    nome: string;
    banco: string;
  };
  favorecido?: {
    nome: string;
  };
  dataLancamento?: string;
  mes_referencia?: string;
  documento_pdf?: string;
  numeroTitulo?: string;
  numeroParcela?: string;
  dataVencimento?: string;
  dataPagamento?: string;
}

export interface MovimentacaoFormData {
  tipo: "entrada" | "saida" | "transferencia";
  valor: number;
  descricao: string;
  data: string;
  conta_corrente_id: string;
  favorecido_id?: string;
  categoria?: string;
  observacoes?: string;
  documento?: string;
  empresa_id: string;
}

// Tipos específicos para as páginas de contas a pagar/receber
export interface Movimentacao {
  id: string;
  tipo_operacao: string;
  valor: number;
  descricao: string;
  data_emissao: string;
  data_lancamento: string;
  favorecido_id?: string;
  empresa_id: string;
  status: "em_aberto" | "pago" | "atrasado" | "cancelado";
  created_at: string;
  updated_at: string;
  parcelas?: MovimentacaoParcela[];
}

export interface MovimentacaoParcela {
  id: string;
  movimentacao_id: string;
  numero: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: "em_aberto" | "pago" | "atrasado" | "cancelado";
  created_at: string;
  updated_at: string;
}
