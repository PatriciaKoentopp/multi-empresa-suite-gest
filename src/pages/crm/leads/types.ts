
export interface LeadInteracao {
  id: string;
  leadId: string;
  tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
  descricao: string;
  data: string;
  responsavelId: string;
  responsavelNome?: string;
  status: string; // Status pode ser "Aberto" ou "Realizado"
  leadNome?: string;
  leadEmpresa?: string;
}

export interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  etapaId: string;
  funilId?: string;
  valor?: number;
  origemId?: string;
  dataCriacao: string;
  ultimoContato?: string;
  responsavelId?: string;
  produto?: string;
  status: "ativo" | "inativo" | "fechado";
  origemNome?: string;
  responsavelNome?: string;
  favorecido_id?: string;
  produto_id?: string;
  servico_id?: string;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id?: string;
}
