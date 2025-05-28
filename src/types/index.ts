
export interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  email?: string;
  telefone?: string;
  site?: string;
  logo?: string;
  regime_tributacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  tipo: 'cliente' | 'fornecedor' | 'ambos';
  tipo_documento: 'cpf' | 'cnpj';
  documento: string;
  nome: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  grupo_id?: string;
  profissao_id?: string;
  data_aniversario?: Date;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface GrupoFavorecido {
  id: string;
  empresa_id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  empresa_id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  empresa_id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Origem {
  id: string;
  empresa_id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  empresa_id?: string;
  email: string;
  nome: string;
  tipo: 'Admin' | 'Usuário';
  status: 'ativo' | 'inativo';
  vendedor: 'sim' | 'nao';
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  empresa_id: string;
  favorecido_id: string;
  codigo: string;
  tipo: 'orcamento' | 'venda';
  data: string;
  data_venda?: string;
  observacoes?: string;
  forma_pagamento: string;
  numero_parcelas: number;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total?: number;
  media_mensal: number;
  variacao_media?: number;
  num_meses: number;
}

export interface ModuleNavItem {
  title: string;
  icon: any;
  href?: string;
  items?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
}
