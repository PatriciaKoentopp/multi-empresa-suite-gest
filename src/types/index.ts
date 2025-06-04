export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  nome: string;
  cpf_cnpj: string;
  tipo: "fisica" | "juridica";
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  banco: string;
  agencia: string;
  conta: string;
  observacoes?: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  unidade_medida: string;
  preco_custo: number;
  preco_venda: number;
  codigo_barras?: string;
  ncm?: string;
  observacoes?: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  vigencia_inicial: string;
  vigencia_final: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id: string;
  preco: number;
  created_at: string;
  updated_at: string;
}

export interface GrupoProduto {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id: string;
  ativo: boolean;
  data_criacao: string;
  created_at: string;
  updated_at: string;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id: string;
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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}
