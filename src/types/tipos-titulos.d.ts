
export interface TipoTitulo {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: "pagar" | "receber";
  conta_contabil_id: string;
  conta_juros_id?: string;
  conta_multa_id?: string;
  conta_desconto_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
