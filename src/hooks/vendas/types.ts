
import { SaleData } from "@/types";

export interface SalesData {
  total_vendas: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  variacao_percentual: number;
  media_ticket: number;
  media_ticket_projeto: number;
  clientes_ativos: number;
}

export interface ChartData {
  name: string;
  faturado: number;
  [key: string]: any;
}

export interface TicketMedioData {
  name: string;
  ticket_medio: number;
  contagem_projetos: number;
  total_vendas: number;
  variacao_percentual: number | null;
}
