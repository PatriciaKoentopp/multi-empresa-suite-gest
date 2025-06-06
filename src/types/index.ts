
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
