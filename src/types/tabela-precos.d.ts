
export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  vigencia_inicial: string;
  vigencia_final: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id?: string;
  produto_id?: string;
  preco: number;
  nome: string;
  created_at: string;
  updated_at: string;
}
