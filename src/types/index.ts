
export interface Empresa {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  email?: string;
  logo?: string;
  updated_at: Date;
  created_at: Date;
  telefone?: string;
  regime_tributacao?: string;
  site?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface ContaCorrente {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  conta_contabil_id: string;
  saldo_inicial: number;
  data: Date;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
  considerar_saldo: boolean;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
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
  data_aniversario?: string;
  grupo_id?: string;
  profissao_id?: string;
  status: "ativo" | "inativo";
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

export interface ServicoPrestado {
  id: string;
  nome: string;
  descricao?: string;
  valor: number;
  created_at: Date;
  updated_at: Date;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: "ativo" | "inativo";
  conta_receita_id?: string;
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
  favorecido_id: string;
  data: Date;
  tipo: string;
  forma_pagamento: string;
  numero_parcelas: number;
  status: string;
  observacoes?: string;
  codigo_projeto?: string;
  data_venda?: Date;
  numero_nota_fiscal?: string;
  data_nota_fiscal?: Date;
  nota_fiscal_pdf?: string;
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  servico_id: string;
  valor: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrcamentoParcela {
  id: string;
  orcamento_id: string;
  numero_parcela: string;
  valor: number;
  data_vencimento: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  valor?: number;
  produto?: string;
  observacoes?: string;
  status: string;
  data_criacao: Date;
  ultimo_contato?: Date;
  empresa_id: string;
  funil_id: string;
  etapa_id: string;
  origem_id?: string;
  responsavel_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SaleData {
  id: string;
  month: string;
  total: number;
}

export interface TipoTitulo {
  id: string;
  nome: string;
  tipo: string;
  conta_contabil_id: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

// Adicione outros tipos conforme necessário
