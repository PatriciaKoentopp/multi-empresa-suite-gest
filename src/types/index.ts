
export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  vigencia_inicial: Date | null;
  vigencia_final: Date | null;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id: string;
  preco: number;
  created_at: Date;
  updated_at: Date;
}
