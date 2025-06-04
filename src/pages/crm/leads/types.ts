
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

// Interface local para o formulário de leads - alinhada com a tabela do Supabase
export interface LeadFormData {
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  etapaId: string;
  funilId?: string;
  valor: number;
  origemId?: string;
  dataCriacao: string;
  ultimoContato?: string;
  responsavelId?: string;
  produto?: string;
  status: "ativo" | "inativo" | "fechado";
}
