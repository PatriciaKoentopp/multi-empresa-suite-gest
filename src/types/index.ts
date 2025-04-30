

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  logoUrl?: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Favorecido {
  id: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
  documento: string;
  grupo_id: string;
  profissao_id: string;
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
  data_aniversario?: Date;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Origem {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: SubNavItem[];
  permission?: string;
}

export interface SubNavItem {
  title: string;
  href: string;
  permission?: string;
}

export interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cnae?: string;
  email?: string;
  site?: string;
  telefone?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais?: string;
  };
  regimeTributacao?: "simples" | "lucro_presumido" | "lucro_real" | "mei";
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  conta_receita_id?: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  vigencia_inicial?: Date;
  vigencia_final?: Date;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  servico_id: string;
  preco: number;
  created_at: Date;
  updated_at: Date;
}

export interface Orcamento {
  id: string;
  codigo: string;
  empresa_id: string;
  favorecido_id: string;
  data: Date;
  tipo: "orcamento" | "venda";
  status: "ativo" | "inativo" | "aprovado" | "faturado" | "cancelado";
  forma_pagamento: string;
  numero_parcelas: number;
  codigo_projeto?: string;
  observacoes?: string;
  numero_nota_fiscal?: string;
  data_nota_fiscal?: Date;
  nota_fiscal_pdf?: string;
  data_venda?: Date;
  created_at: Date;
  updated_at: Date;
}

