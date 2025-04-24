
export interface TabelaPreco {
  id: string;
  empresa_id: string;
  nome: string;
  vigencia_inicial: Date | null;
  vigencia_final: Date | null;
  status: "ativo" | "inativo";
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
  nome?: string; // Adicionado para compatibilidade com o serviço
}

export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

// Outros tipos necessários para resolver erros
export interface GrupoFavorecido {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profissao {
  id: string;
  empresa_id: string;
  nome: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface Favorecido {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: string;
  tipo_documento: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  status: string;
  grupo_id: string | null;
  profissao_id: string | null;
  data_aniversario: Date | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  pais: string | null;
  nome_fantasia: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MotivoPerda {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface Origem {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface PlanoConta {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string | null;
  status: "ativo" | "inativo";
  tipo: "Administrador" | "Usuário";
  vendedor: "sim" | "nao";
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  pais: string;
  telefone: string | null;
  email: string | null;
  site: string | null;
  cnae: string | null;
  regime_tributacao: string | null;
  logo: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface Funil {
  id: string;
  nome: string;
  etapas: EtapaFunil[];
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
  status: string;
}

export interface EtapaFunil {
  id: string;
  funil_id: string;
  nome: string;
  ordem: number;
  cor: string;
  created_at: Date;
  updated_at: Date;
}

export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: JSX.Element;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  items?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
}
