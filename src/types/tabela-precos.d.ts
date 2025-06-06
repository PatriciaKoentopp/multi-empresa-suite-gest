
export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  vigencia_inicial?: Date | null; // Mudança: aceita Date do banco
  vigencia_final?: Date | null; // Mudança: aceita Date do banco
  status: string; // Mudança: aceita string do banco
  created_at: Date; // Mudança: aceita Date do banco
  updated_at: Date; // Mudança: aceita Date do banco
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  produto_id?: string | null;
  servico_id?: string | null;
  preco: number;
  created_at: Date;
  updated_at: Date;
}
