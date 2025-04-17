
// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  companies: Company[];
  currentCompanyId?: string;
}

// Multi-tenant types
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
  endereco?: Address;
  regimeTributacao?: "simples" | "lucro_presumido" | "lucro_real" | "mei";
  logo?: string;
  contatos?: Contact[];
  theme?: CompanyTheme;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyTheme {
  primaryColor?: string;
  logoUrl?: string;
}

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais?: string;
}

export interface Contact {
  id: string;
  tipo: 'email' | 'telefone' | 'celular' | 'whatsapp' | 'outro';
  valor: string;
  principal: boolean;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// Common types
export interface Favorecido {
  id: string;
  tipo: 'cliente' | 'fornecedor' | 'funcionario' | 'publico';
  nome: string;
  documento: string;
  tipoDocumento: 'cpf' | 'cnpj';
  grupoId?: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  endereco?: Address;
  dataAniversario?: Date;
  status: 'ativo' | 'inativo';
  dadosBancarios?: BankAccount[];
  categorias?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca';
  titular: string;
  documento: string;
  pix?: string;
}

// Group types
export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  createdAt: Date;
  updatedAt: Date;
}

// Module navigation types
export interface ModuleNavItem {
  name: string;
  icon: string;
  href: string;
  description?: string;
  permissions?: string[];
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  name: string;
  href: string;
  description?: string;
  permissions?: string[];
}
