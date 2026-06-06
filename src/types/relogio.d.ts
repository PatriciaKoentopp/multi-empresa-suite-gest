export interface RelogioTipoProjeto {
  id: string;
  empresa_id: string;
  nome: string;
  status: "ativo" | "inativo";
  created_at: string;
  updated_at: string;
}

export interface RelogioTarefa {
  id: string;
  tipo_projeto_id: string;
  nome: string;
  status: "ativo" | "inativo";
  percentual_tempo_estimado: number;
  created_at: string;
  updated_at: string;
}

export interface RelogioProjeto {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  favorecido_id: string | null;
  tipo_projeto_id: string | null;
  fotos_tiradas: number;
  fotos_enviadas: number;
  fotos_vendidas: number;
  status: "ativo" | "arquivado";
  data_fotos: string | null;
  data_previa: string | null;
  data_selecao: string | null;
  data_prazo: string | null;
  data_entrega: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelogioApontamento {
  id: string;
  empresa_id: string;
  projeto_id: string;
  tarefa_id: string | null;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fim: string | null; // HH:MM:SS
  duracao_decimal: number;
  origem: "manual" | "cronometro";
  status: "em_andamento" | "concluido";
  observacao: string | null;
  created_at: string;
  updated_at: string;
}
