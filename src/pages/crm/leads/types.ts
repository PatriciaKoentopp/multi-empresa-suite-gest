export interface LeadInteracao {
  id: number | string;
  leadId: string;
  tipo: "email" | "ligacao" | "reuniao" | "mensagem" | "whatsapp" | "telegram" | "instagram" | "facebook" | "outro";
  descricao: string;
  data: string;
  responsavelId: string;
  responsavelNome?: string;
  status: string; // Adicionado campo de status
}

export interface Lead {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  etapaId: string;
  funilId?: string; // Tornando explícito que pode existir
  valor: number;
  origemId: string;
  dataCriacao: string;
  ultimoContato: string;
  responsavelId: string;
  produto?: string;
  status: "ativo" | "inativo" | "fechado";
  origemNome?: string;
  responsavelNome?: string;
}

export interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  funil_id?: string;
}
