export interface RelogioTipoProjeto {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface RelogioTarefa {
  id: string;
  tipo_projeto_id: string;
  nome: string;
  status: "ativo" | "inativo";
  percentual_tempo_estimado: number;
  created_at: string;
  updated_at: string;
}
