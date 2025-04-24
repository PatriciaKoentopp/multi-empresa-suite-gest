
export interface TipoTitulo {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: "pagar" | "receber";
  conta_contabil_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}
