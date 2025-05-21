
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

// Interfaces auxiliares para navegação
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

// Interfaces auxiliares referenciadas no código
export interface Company {
  id: string;
  nome: string;
  cnpj: string;
  email?: string;
  status: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  status: 'ativo' | 'inativo';
  admin: boolean;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface GrupoFavorecido {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profissao {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Origem {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface MotivoPerda {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

export interface Orcamento {
  id: string;
  empresa_id: string;
  data: string;
  data_venda?: string | null;
  codigo?: string | null;
  favorecido_id: string;
  codigo_projeto?: string | null;
  observacoes?: string | null;
  forma_pagamento: string;
  numero_parcelas: number;
  valor_total: number;
  status: 'ativo' | 'inativo' | 'cancelado' | 'venda';
  tipo: 'orcamento' | 'venda';
  data_nota_fiscal?: string | null;
  numero_nota_fiscal?: string | null;
  nota_fiscal_url?: string | null;
  created_at: string;
  updated_at: string;
}
