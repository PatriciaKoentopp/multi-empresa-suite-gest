
export interface Produto {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string | null;
  grupo_id?: string | null;
  unidade: string;
  conta_receita_id?: string | null;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string | null;
  conta_receita_id?: string | null;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}
