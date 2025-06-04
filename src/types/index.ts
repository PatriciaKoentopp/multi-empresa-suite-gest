
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
  documento: string;
  grupo_id?: string;
  profissao_id?: string;
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
  data_aniversario?: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
  // Propriedades antigas para compatibilidade
  cpf_cnpj?: string;
  endereco?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  observacoes?: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
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

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  unidade_medida?: string;
  preco_custo?: number;
  preco_venda?: number;
  codigo_barras?: string;
  ncm?: string;
  observacoes?: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
  conta_receita_id?: string;
}

export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  vigencia_inicial: string;
  vigencia_final: string;
  status: "ativo" | "inativo";
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

export interface GrupoProduto {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id: string;
  ativo: boolean;
  data_criacao: string;
  created_at: string;
  updated_at: string;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id: string;
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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id: string;
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
  email?: string;
  telefone?: string;
  site?: string;
  cnae?: string;
  regime_tributacao?: string;
  logo?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  empresa_id: string;
  favorecido_id: string;
  data: string;
  tipo: "orcamento" | "venda";
  status: "ativo" | "inativo";
  forma_pagamento: string;
  numero_parcelas: number;
  observacoes?: string;
  data_venda?: string;
  created_at: string;
  updated_at: string;
  favorecido?: Favorecido;
}

export interface YearlyComparison {
  year: number;
  total: number;
  qtde_vendas: number;
  media_mensal: number;
  variacao_total?: number | null;
  variacao_media?: number | null;
}

export interface SaleData {
  month: string;
  faturado: number;
  qtde_vendas: number;
}

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

export interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  etapaId: string;
  funilId: string;
  valor?: number;
  origemId?: string;
  dataCriacao: string;
  ultimoContato?: string;
  responsavelId?: string;
  produto?: string;
  status: string;
  origemNome?: string;
  responsavelNome?: string;
}

export interface LeadInteracao {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string;
  data: string;
  responsavel_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
