
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
}
