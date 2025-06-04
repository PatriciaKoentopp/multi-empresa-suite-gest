
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
