
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
  created_at?: string;
  updated_at?: string;
  
  // Aliases para compatibilidade
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Objeto endereco para compatibilidade
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  empresa_id?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo: string;
  status: string;
  vendedor: string;
  created_at?: string;
  updated_at?: string;
  empresa_id?: string | null;
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

export interface Favorecido {
  id: string;
  nome: string;
  tipo: string;
  tipo_documento: string;
  documento: string;
  grupo_id?: string | null;
  profissao_id?: string | null;
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
  data_aniversario?: string | null;
  status: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  tipo: string;
  data_orcamento: string;
  data_venda?: string;
  favorecido_id: string;
  vendedor_id: string;
  forma_pagamento: string;
  observacoes?: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
  favorecido?: Favorecido;
}

export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
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
  empresa_id: string;
  conta_receita_id?: string;
  status: string;
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
  produto_id?: string;
  servico_id?: string;
  preco: number;
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

// Interfaces para módulos financeiros
export interface DadosFinanceiros {
  total_a_receber: number;
  total_a_pagar: number;
  saldo_contas: number;
  previsao_saldo: number;
  contas_vencidas_receber: number;
  contas_a_vencer_receber: number;
  contas_vencidas_pagar: number;
  contas_a_vencer_pagar: number;
}

export interface FluxoCaixaItem {
  id: string;
  data_movimentacao: string;
  data: string; // alias para data_movimentacao
  tipo_operacao: string;
  tipo: string; // alias para tipo_operacao
  valor: number;
  saldo: number;
  descricao?: string;
  origem: string;
  situacao: string;
  favorecido?: string;
  conta_nome?: string;
  saldoAcumulado?: number;
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  total_recebido: number;
  total_pago: number;
  saldo: number;
}
