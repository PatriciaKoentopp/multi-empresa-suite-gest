
export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  created_at: Date;
  updated_at: Date;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  nome: string;
  documento: string;
  telefone?: string;
  email?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo';
  created_at: Date;
  updated_at: Date;
}

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
  servico_id: string | null;
  produto_id: string | null;
  preco: number;
  created_at: Date;
  updated_at: Date;
  nome?: string; // Nome do serviço ou produto (não persistido)
}

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

