
export interface PlanoConta {
  id: string;
  codigo: string;
  descricao: string;
  tipo: "ativo" | "passivo" | "receita" | "despesa" | "patrimonio";
  considerarDRE: boolean;
  status: "ativo" | "inativo";
  createdAt: Date;
  updatedAt: Date;
}
