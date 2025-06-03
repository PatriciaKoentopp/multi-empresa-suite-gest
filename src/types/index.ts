
export interface SaleData {
  id: string;
  data: string;
  valor: number;
  cliente: string;
  produto?: string;
  servico?: string;
  vendedor?: string;
  status: string;
}

export interface GrupoProduto {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface GrupoFavorecido {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profissao {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Origem {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface MotivoPerda {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Favorecido {
  id: string;
  nome: string;
  nome_fantasia?: string;
  tipo: "fisica" | "juridica" | "publico" | "funcionario" | "cliente" | "fornecedor";
  tipo_documento: "cpf" | "cnpj";
  documento: string;
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
  status: "ativo" | "inativo";
  grupo_id?: string;
  profissao_id?: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "Administrador" | "Usuário";
  vendedor: "sim" | "nao";
  status: "ativo" | "inativo";
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  logo?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae?: string;
  site?: string;
  regime_tributacao?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  status: "ativo" | "inativo";
  empresa_id: string;
  conta_receita_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Orcamento {
  id: string;
  codigo: string;
  tipo: "orcamento" | "venda";
  data: string;
  favorecido_id: string;
  favorecido?: {
    nome: string;
  };
  empresa_id: string;
  forma_pagamento: string;
  numero_parcelas: number;
  observacoes?: string;
  codigo_projeto?: string;
  status: "ativo" | "inativo" | "cancelado";
  data_venda?: string;
  numero_nota_fiscal?: string;
  data_nota_fiscal?: string;
  nota_fiscal_pdf?: string;
  valor?: number;
  created_at: string;
  updated_at: string;
}

export interface TabelaPreco {
  id: string;
  nome: string;
  status: "ativo" | "inativo";
  vigencia_inicial?: string;
  vigencia_final?: string;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface TabelaPrecoItem {
  id: string;
  tabela_id: string;
  produto_id?: string;
  servico_id?: string;
  preco: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyComparison {
  year: number;
  total: number;
  qtde_vendas: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
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

export interface MovimentacaoItem {
  id: string;
  data: string;
  tipo: "entrada" | "saida" | "transferencia";
  tipo_operacao: string;
  valor: number;
  descricao: string;
  conta_corrente_id: string;
  favorecido_id?: string;
  categoria?: string;
  observacoes?: string;
  documento?: string;
  situacao: "pendente" | "efetivada" | "cancelada";
  created_at: string;
  updated_at: string;
  empresa_id: string;
  conta_corrente?: {
    nome: string;
    banco: string;
  };
  favorecido?: string;
  dataLancamento?: string;
  mes_referencia?: string;
  documento_pdf?: string;
  numeroTitulo?: string;
  numeroParcela?: string;
  dataVencimento?: string;
  dataPagamento?: string;
}

export interface MovimentacaoFormData {
  tipo: "entrada" | "saida" | "transferencia";
  valor: number;
  descricao: string;
  data: string;
  conta_corrente_id: string;
  favorecido_id?: string;
  categoria?: string;
  observacoes?: string;
  documento?: string;
  empresa_id: string;
}

export interface FiltroFluxoCaixa {
  dataInicio: Date;
  dataFim: Date;
  contaId?: string | null;
  conta_corrente_id?: string | null;
  situacao?: string | null;
}

export interface ContaCorrenteItem {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  saldo_inicial: number;
  status: string;
  saldo?: number;
  considerar_saldo?: boolean;
}

export interface Antecipacao {
  id: string;
  descricao: string;
  valor_total: number;
  valor_utilizado: number;
  valor_disponivel: number;
}

export interface AntecipacaoSelecionada {
  id: string;
  valor: number;
  valor_utilizado?: number;
}

export interface DadosFinanceiros {
  total_a_receber: number;
  total_a_pagar: number;
  saldo_contas: number;
  previsao_saldo: number;
  contas_vencidas_receber: number;
  contas_vencidas_pagar: number;
  contas_a_vencer_receber: number;
  contas_a_vencer_pagar: number;
  fluxo_por_mes: FluxoMensal[];
  fluxo_caixa: FluxoCaixaItem[];
  contas_correntes: ContaCorrenteItem[];
}

export interface FluxoCaixaItem {
  id: string;
  data: Date;
  data_movimentacao: string;
  tipo_operacao: string;
  tipo: string;
  valor: number;
  saldo: number;
  saldo_calculado?: number;
  descricao?: string;
  origem: string;
  situacao: string;
  conta_nome?: string;
  conta_id?: string;
  favorecido?: string;
}

export interface FluxoMensal {
  mes: string;
  mes_numero: number;
  ano: number;
  entradas: number;
  saidas: number;
  saldo: number;
  total_recebido: number;
  total_pago: number;
}
