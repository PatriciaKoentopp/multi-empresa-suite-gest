
export interface Servico {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string | null;
  conta_receita_id?: string | null;
  status: string; // Mudança: aceita string do banco
  created_at: string;
  updated_at: string;
}
