
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

export interface Origem {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}

export interface Favorecido {
  id: string;
  tipo: "cliente" | "fornecedor" | "publico" | "funcionario";
  tipoDocumento: "cpf" | "cnpj";
  documento: string;
  grupoId?: string;
  profissaoId?: string;
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

// Interface para usuário do sistema (atualizada)
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  createdAt: Date;
  updatedAt: Date;
}

// Interface de etapa do funil
export interface EtapaFunil {
  id: number;
  nome: string;
  cor: string;
  ordem: number;
}

// Interface de funil de vendas
export interface Funil {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  dataCriacao: string;
  etapas: EtapaFunil[];
}

// Interface de Lead atualizada para usar o id do responsável e do funil
export interface Lead {
  id: number;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: number;
  funilId: number; // Adicionado referência ao funil
  valor: number;
  origemId: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavelId: string; 
}

// Importando e exportando a interface PlanoConta
export * from './plano-contas';
