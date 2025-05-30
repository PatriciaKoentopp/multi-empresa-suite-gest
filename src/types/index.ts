

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
  created_at?: string | null;
  updated_at?: string | null;
  
  // Aliases em camelCase para compatibilidade
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  
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

export interface Favorecido {
  id: string;
  tipo: string;
  tipo_documento: string;
  documento: string;
  grupo_id?: string | null;
  profissao_id?: string | null;
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
  data_aniversario?: Date | string;
  status: string;
  empresa_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  conta_receita_id?: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  vigencia_inicial?: string;
  vigencia_final?: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id?: string;
  produto_id?: string;
  preco: number;
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
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

export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total?: number;
  media_mensal: number;
  variacao_media?: number;
  num_meses: number;
  qtde_vendas?: number;
}

export interface SaleData {
  name: string;
  faturado: number;
}

export interface ModuleNavItem {
  title: string;
  icon: any;
  href?: string;
  subItems?: SubNavItem[];
  module?: string;
}

export interface SubNavItem {
  title: string;
  href: string;
  module?: string;
}

