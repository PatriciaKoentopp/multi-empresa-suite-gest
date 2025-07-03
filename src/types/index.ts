export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Orcamento {
  id: string;
  cliente_id: string;
  vendedor_id: string;
  data_criacao: string;
  data_validade: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  total: number;
  observacoes?: string;
  cliente?: Favorecido;
  vendedor?: Usuario;
  itens?: OrcamentoItem[];
  favorecido_id?: string;
  data_venda?: string;
}

export interface OrcamentoItem {
  id: string;
  orcamento_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  produto?: Produto;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria_id: string;
  categoria?: Categoria;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Favorecido {
  id: string;
  tipo: 'fisica' | 'juridica' | 'publico' | 'funcionario';
  tipo_documento: 'cpf' | 'cnpj';
  documento: string;
  grupo_id?: string | null;
  profissao_id?: string | null;
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
  data_aniversario?: string;
  status: 'ativo' | 'inativo';
  grupo?: GrupoFavorecido;
  profissao?: Profissao;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Profissao {
  id: string;
  nome: string;
  descricao?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: 'Administrador' | 'Usuário';
  vendedor: 'sim' | 'não';
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

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

export interface EmpresaParametro {
  id: string;
  empresa_id: string;
  modulo: string;
  parametro: string;
  valor: string;
}

export interface Parcela {
  id?: string;
  orcamento_id?: string;
  numeroParcela: string;
  dataVencimento: string;
  valor: number;
  status?: 'pendente' | 'pago';
  dataPagamento?: string;
}

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
  created_at?: string;
  updated_at?: string;
  
  // Aliases para compatibilidade
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributacao?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Objeto endereco para compatibilidade
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
}
