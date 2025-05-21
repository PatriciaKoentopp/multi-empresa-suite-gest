
export interface GrupoProduto {
  id: string;
  empresa_id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}
