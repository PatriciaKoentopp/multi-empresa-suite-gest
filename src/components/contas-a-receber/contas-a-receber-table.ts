
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

// Este arquivo é apenas para exportação do tipo
// O componente real está no arquivo contas-a-receber-table.tsx
