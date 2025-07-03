
// Interface para empresas
export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  email?: string;
  telefone?: string;
  site?: string;
  cnae?: string;
  regime_tributacao?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pais: string;
  };
}

// Interface para favorecidos
export interface Favorecido {
  id: string;
  empresa_id: string;
  grupo_id?: string;
  profissao_id?: string;
  data_aniversario?: string;
  created_at: string;
  updated_at: string;
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
  status: string;
  tipo: string;
  tipo_documento: string;
}

// Interface para grupo de favorecidos
export interface GrupoFavorecido {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  status: string;
}

// Interface para profissões
export interface Profissao {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  status: string;
}

// Interface para origens
export interface Origem {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  status: string;
}

// Interface para motivos de perda
export interface MotivoPerda {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  status: string;
}

// Interface para usuários
export interface Usuario {
  id: string;
  empresa_id?: string;
  tipo: string;
  status: string;
  vendedor: string;
  created_at: string;
  updated_at: string;
  nome: string;
  email: string;
}

// Interface para serviços
export interface Servico {
  id: string;
  empresa_id: string;
  conta_receita_id?: string;
  created_at: string;
  updated_at: string;
  descricao?: string;
  status: string;
  nome: string;
}

// Interface para orçamentos
export interface Orcamento {
  id: string;
  empresa_id: string;
  favorecido_id: string;
  data: Date;
  numero_parcelas: number;
  data_nota_fiscal?: Date;
  created_at: string;
  updated_at: string;
  data_venda?: Date;
  numero_nota_fiscal?: string;
  nota_fiscal_pdf?: string;
  status: string;
  codigo: string;
  tipo: string;
  codigo_projeto?: string;
  observacoes?: string;
  forma_pagamento: string;
}

// Interface para comparação anual de vendas
export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total?: number;
  media_mensal: number;
  variacao_media?: number;
  num_meses: number;
}

// Interfaces para navegação
export interface ModuleNavItem {
  key: string;
  title: string;
  icon: React.ComponentType<any>;
  href?: string;
  items?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
  description?: string;
}
