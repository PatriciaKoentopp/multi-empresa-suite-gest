export interface ImpostoRetido {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_titulo_id: string;
  conta_despesa_id?: string;
  favorecido_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}
