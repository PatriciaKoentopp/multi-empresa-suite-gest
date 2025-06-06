
export interface TabelaPreco {
  id: string;
  nome: string;
  empresa_id: string;
  vigencia_inicial?: Date | null;
  vigencia_final?: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id?: string | null;
  produto_id?: string | null;
  preco: number;
  created_at: string;
  updated_at: string;
}
