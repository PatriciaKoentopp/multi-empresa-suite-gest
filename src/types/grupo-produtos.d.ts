
export interface GrupoProduto {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Origem {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}
