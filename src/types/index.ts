
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
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  created_at: Date | null;
  updated_at: Date | null;

  // Aliases em camelCase para compatibilidade
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  createdAt: Date | null;
  updatedAt: Date | null;

  // Objeto endereco para compatibilidade
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// Adicionar interfaces que estão faltando
export interface Origem {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at?: Date;
  updated_at?: Date;
}

export interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  empresa_id: string;
  data_criacao: string;
  etapas: EtapaFunil[];
  created_at?: Date;
  updated_at?: Date;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at?: Date;
  updated_at?: Date;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at?: Date;
  updated_at?: Date;
}

export interface Profissao {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at?: Date;
  updated_at?: Date;
}

export interface Favorecido {
  id: string;
  nome: string;
  tipo: string;
  empresa_id: string;
  tipo_documento: string;
  documento: string;
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
  status: "ativo" | "inativo";
  nome_fantasia?: string;
  data_aniversario?: string;
  profissao_id?: string;
  grupo_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  conta_receita_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  vigencia_inicial?: string;
  vigencia_final?: string;
  created_at?: Date;
  updated_at?: Date;
  itens?: TabelaPrecoItem[];
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id: string;
  preco: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Orcamento {
  id: string;
  codigo: string;
  tipo: "orcamento" | "venda";
  status: "ativo" | "inativo";
  empresa_id: string;
  favorecido_id: string;
  data: string;
  data_venda?: string;
  forma_pagamento: string;
  numero_parcelas: number;
  codigo_projeto?: string;
  observacoes?: string;
  numero_nota_fiscal?: string;
  data_nota_fiscal?: string;
  nota_fiscal_pdf?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

export interface ModuleNavItem {
  title: string;
  icon?: any;
  href?: string;
  items?: SubNavItem[];
  disabled?: boolean;
}

export interface SubNavItem {
  title: string;
  href: string;
  disabled?: boolean;
}
