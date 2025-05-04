
// Definição do tipo ContaReceber
export interface ContaReceber {
  id: string;
  cliente: string;
  descricao: string;
  dataVencimento: Date;
  valor: number;
  status: 'em_aberto' | 'pago' | 'atrasado' | 'cancelado';
  numeroParcela: string;
  origem: string;
  movimentacao_id?: string;
  tipo?: string;
}

// Exportando o componente da tabela de contas a receber
// Esta linha é necessária pois há imports deste componente em outros arquivos
export { ContasAReceberTable } from "./contas-a-receber-table";
