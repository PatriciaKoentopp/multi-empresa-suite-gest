
// Se o arquivo não existir, vamos criar com o tipo correto
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
