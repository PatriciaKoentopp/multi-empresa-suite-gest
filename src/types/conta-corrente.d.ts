
export interface ContaCorrente {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  numero: string;
  contaContabilId: string;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
  data?: Date; // nova data (campo opcional para cadastro)
  saldoInicial?: number; // novo saldo inicial (campo opcional para cadastro)
}
