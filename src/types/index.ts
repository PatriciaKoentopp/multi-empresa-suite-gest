
export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  email?: string;
  site?: string;
  telefone?: string;
  logo?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  regime_tributacao?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyUpdate {
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  email?: string;
  site?: string;
  telefone?: string;
  logo?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  regime_tributacao?: string;
}

// Adicionando tipos que faltam
export interface Favorecido {
  id: string;
  nome: string;
  empresa_id: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
  documento: string;
  email?: string;
  telefone?: string;
  nome_fantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  data_aniversario?: string;
  profissao_id?: string;
  grupo_id?: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Origem {
  id: string;
  nome: string;
  empresa_id: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface ModuleNavItem {
  label: string;
  title: string;
  icon: string;
  path?: string;
  href?: string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  label: string;
  title: string;
  path: string;
  href: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  empresa_id: string;
  favorecido_id: string;
  favorecido?: Favorecido;
  data: string;
  data_venda?: string;
  tipo: "orcamento" | "venda";
  forma_pagamento: string;
  numero_parcelas: number;
  observacoes?: string;
  codigo_projeto?: string;
  numero_nota_fiscal?: string;
  data_nota_fiscal?: string;
  nota_fiscal_pdf?: string;
  status: "ativo" | "inativo";
  valor?: number;
  itens?: Array<{
    id: string;
    orcamento_id: string;
    servico_id: string;
    valor: number;
  }>;
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
  qtde_vendas: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  grupo_id?: string;
  conta_receita_id?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  conta_receita_id?: string;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  vendedor: string;
  status: string;
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}
