
import React from 'react';

export interface Orcamento {
  id: string;
  codigo: string;
  empresa_id: string;
  cliente_id: string;
  data_criacao: string;
  data_validade: string;
  status: string;
  tipo: string;
  forma_pagamento: string;
  observacoes: string;
  vendedor_id: string;
  favorecido_id: string;
  total: number;
  desconto: number;
  acrescimo: number;
  usuario_criacao: string;
  usuario_atualizacao: string;
  data_atualizacao: string;
  data_venda: string;
  cliente?: Cliente;
  favorecido?: Favorecido;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cpf_cnpj: string;
  rg_ie: string;
  data_nascimento: string;
}

export interface Favorecido {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cpf_cnpj: string;
  rg_ie: string;
  data_nascimento: string;
  tipo: string;
  tipo_documento: string;
  documento: string;
  grupo_id: string;
  profissao_id: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  pais: string;
  data_aniversario: string;
  status: string;
}

export interface SubNavItem {
  name: string;
  href: string;
}

export interface ModuleNavItem {
  name: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}

// Interfaces adicionadas para corrigir erros de tipo
export interface GrupoFavorecido {
  id: string;
  nome: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  nome: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Origem {
  id: string;
  nome: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  empresa_id: string;
  conta_receita_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  empresa_id: string;
  vigencia_inicial?: string;
  vigencia_final?: string;
  status: string;
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

export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributacao?: string;
  cnae?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  telefone?: string;
  email?: string;
  site?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  status: string;
  vendedor: string;
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface YearlyComparison {
  year: number;
  total: number;
  yearlyVariation: number | null;
  months: MonthlyComparison[];
  mediaMensal: number;
  mediaVariacao: number | null;
}

export interface MonthlyComparison {
  month: string; // Nome do mês
  year: number; // Ano
  total: number; // Total de vendas
  monthlyVariation: number | null; // Variação percentual mensal
  yearlyVariation: number | null; // Variação percentual anual
  sortDate: Date; // Data para ordenação
}
