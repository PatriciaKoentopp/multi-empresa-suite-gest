
export interface GrupoProduto {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  createdAt: Date;
  updatedAt: Date;
}
