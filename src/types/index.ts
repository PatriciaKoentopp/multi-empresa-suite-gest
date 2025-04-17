
export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleNavItem {
  name: string;
  href: string;
  description: string;
  icon?: string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  name: string;
  href: string;
  description: string;
}

export interface Company {
  id: string;
  name: string;
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
    pais: string;
  };
  regimeTributacao?: "simples" | "lucro_presumido" | "lucro_real" | "mei";
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  companies: Company[];
  currentCompanyId?: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorecido {
  id: string;
  tipo: string;
  tipoDocumento: string;
  documento: string;
  grupoId?: string;
  nome: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  dataAniversario?: Date;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}
