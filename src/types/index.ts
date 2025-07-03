
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
}

export interface TipoTitulo {
  id: string;
  nome: string;
  tipo: string;
  empresa_id: string;
  conta_contabil_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Favorecido {
  id: string;
  nome: string;
  documento: string;
  tipo: string;
  email?: string;
  telefone?: string;
  status: string;
  empresa_id: string;
  grupo_id?: string;
  profissao_id?: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  tipo_documento: string;
  data_aniversario?: string | Date; // Permitir tanto string quanto Date
  created_at: string | Date; // Permitir tanto string quanto Date
  updated_at: string | Date; // Permitir tanto string quanto Date
}

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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string | null;
  tipo: 'Administrador' | 'Usuário';
  vendedor: 'sim' | 'nao';
  status: 'ativo' | 'inativo';
  created_at: string | Date; // Permitir tanto string quanto Date
  updated_at: string | Date; // Permitir tanto string quanto Date
}

// Interfaces para vendas
export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  data: string;
  favorecido_id: string;
  empresa_id: string;
  forma_pagamento: string;
  numero_parcelas: number;
  status: string;
  tipo: string;
  data_venda?: string;
  observacoes?: string;
  codigo_projeto?: string;
  created_at: string;
  updated_at: string;
  favorecido?: { // Adicionar propriedade favorecido
    nome: string;
    [key: string]: any;
  };
  [key: string]: any; // Permitir propriedades adicionais flexíveis
}

export interface TabelaPreco {
  id: string;
  nome: string;
  vigencia_inicial?: string;
  vigencia_final?: string;
  empresa_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  produto_id?: string;
  servico_id?: string;
  preco: number;
  created_at: string;
  updated_at: string;
}

// Interfaces para comparação de vendas
export interface YearlyComparison {
  year: number;
  total: number;
  qtde_vendas: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

export interface SaleData {
  name: string;
  faturado: number;
}

// Interface para empresa - mais flexível
export interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  created_at: string | Date; // Permitir tanto string quanto Date
  updated_at: string | Date; // Permitir tanto string quanto Date
  // Propriedades adicionais opcionais para flexibilidade
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  site?: string;
  cnae?: string;
  regime_tributacao?: string;
  logo?: string;
  endereco?: any;
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  [key: string]: any; // Permitir qualquer propriedade adicional
}

// Re-export das interfaces do arquivo financeiro
export * from './financeiro';
