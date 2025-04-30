
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  logoUrl?: string;
  status: "ativo" | "inativo";
  created_at: Date;
  updated_at: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  created_at: Date;
  updated_at: Date;
  empresa_id: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Favorecido {
  id: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
  documento: string;
  grupo_id: string;
  profissao_id: string;
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
  data_aniversario?: Date;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: Date;
  updated_at: Date;
}
