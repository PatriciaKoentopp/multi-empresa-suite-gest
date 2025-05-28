
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode | string;
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
}

export interface TipoTitulo {
  id: string;
  nome: string;
  tipo: string;
  empresa_id: string;
  conta_contabil_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Favorecido {
  id: string;
  nome: string;
  documento: string;
  tipo: string;
  email?: string;
  telefone?: string;
  status: string;
  empresa_id: string;
  grupo_id?: string;
  profissao_id?: string;
  nome_fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  tipo_documento: string;
  data_aniversario?: string;
  created_at: string;
  updated_at: string;
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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  tipo: 'Administrador' | 'Usuário';
  vendedor: 'sim' | 'nao';
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

// Re-export das interfaces do arquivo financeiro
export * from './financeiro';
