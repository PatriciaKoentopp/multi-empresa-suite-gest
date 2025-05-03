
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
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  created_at: Date | null;
  updated_at: Date | null;

  // Aliases em camelCase para compatibilidade
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  createdAt: Date | null;
  updatedAt: Date | null;

  // Objeto endereco para compatibilidade
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  status: "ativo" | "inativo";
  vendedor: "sim" | "nao";
  empresa_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
