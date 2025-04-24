
export interface PlanoConta {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  categoria: "título" | "movimentação";
  considerar_dre: boolean;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}
