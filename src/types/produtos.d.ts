
export interface Produto {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  grupo_id?: string;
  unidade: string;
  conta_receita_id?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}
