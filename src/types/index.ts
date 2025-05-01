
export interface MonthlyComparison {
  month: string;
  year: number;
  total: number;
  monthlyVariation: number | null;
  yearlyVariation: number | null;
  sortDate: Date;
}

export interface YearlyComparison {
  year: number;
  total: numeric;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

// Tipos que estavam faltando (re-declarando para evitar erros com imports)
export interface Favorecido {
  id: string;
  nome: string;
  documento: string;
  email?: string;
  telefone?: string;
  tipo: string;
  status: string;
  tipo_documento?: string;
  grupo_id?: string;
  profissao_id?: string;
  nome_fantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  data_aniversario?: Date;
  // Outros campos necessários
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: string;
  empresa_id?: string;
  // Outros campos necessários
}

export interface Profissao {
  id: string;
  nome: string;
  status: string;
  empresa_id?: string;
  // Outros campos necessários
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  status: string;
  vendedor?: string;
  created_at?: Date;
  empresa_id?: string;
  // Outros campos necessários
}

export interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  // Outros campos necessários
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: string;
  // Outros campos necessários
}

export interface Origem {
  id: string;
  nome: string;
  status: string;
  // Outros campos necessários
}

export interface Funil {
  id: string;
  nome: string;
  // Outros campos necessários
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  // Outros campos necessários
}

export interface TabelaPreco {
  id: string;
  nome: string;
  // Outros campos necessários
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id: string;
  preco: number;
  // Outros campos necessários
}

export interface Orcamento {
  id: string;
  codigo: string;
  favorecido_id?: string;
  forma_pagamento?: string;
  favorecido?: any;
  // Outros campos necessários
}

export interface ModuleNavItem {
  title: string;
  name?: string; // Adicionado para compatibilidade
  icon?: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  name?: string; // Adicionado para compatibilidade
  href?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
}
