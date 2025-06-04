
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
