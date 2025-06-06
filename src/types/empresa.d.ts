
export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  cnae?: string | null;
  email?: string | null;
  site?: string | null;
  telefone?: string | null;
  logo?: string | null;
  regime_tributacao?: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  created_at?: string;
  updated_at?: string;
}
