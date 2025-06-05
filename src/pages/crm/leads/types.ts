
export interface LeadInteracao {
  id: string;
  leadId: string;
  tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
  descricao: string;
  data: string | Date;
  responsavelId: string;
  responsavelNome?: string;
  status: string;
  leadNome?: string;
  leadEmpresa?: string;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id: string;
}

// Interface para dados do formulário - alinhada com a tabela do Supabase
export interface LeadFormData {
  id?: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  etapa_id: string;
  funil_id: string;
  valor?: number;
  origem_id?: string;
  data_criacao: string;
  ultimo_contato?: string;
  responsavel_id?: string;
  produto?: string;
  observacoes?: string;
  status: "ativo" | "inativo" | "fechado";
  empresa_id: string;
  favorecido_id?: string;
  servico_id?: string;
  produto_id?: string;
}
