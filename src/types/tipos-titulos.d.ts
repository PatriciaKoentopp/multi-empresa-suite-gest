
export interface TipoTitulo {
  id: string;
  empresa_id: string;
  tipo: "pagar" | "receber";
  nome: string;
  status: "ativo" | "inativo";
  conta_contabil_id: string;
  created_at: string;
  updated_at: string;
}
