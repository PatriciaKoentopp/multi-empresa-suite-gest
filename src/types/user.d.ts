
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  razao_social: string;
  razaoSocial: string;
  nome_fantasia: string;
  nomeFantasia: string;
  cnpj: string;
  inscricao_estadual?: string | null;
  inscricaoEstadual?: string | null;
  inscricao_municipal?: string | null;
  inscricaoMunicipal?: string | null;
  cnae?: string | null;
  email?: string | null;
  telefone?: string | null;
  site?: string | null;
  logo?: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  regime_tributacao?: string | null;
  created_at?: string;
  updated_at?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
  };
}
