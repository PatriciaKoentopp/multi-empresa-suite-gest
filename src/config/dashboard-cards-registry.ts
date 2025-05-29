
export interface CardDefinition {
  id: string;
  name: string;
  description: string;
  category: 'vendas' | 'financeiro' | 'geral';
  component: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

export const DASHBOARD_CARDS_REGISTRY: Record<string, CardDefinition> = {
  'vendas-mes': {
    id: 'vendas-mes',
    name: 'Vendas do Mês',
    description: 'Total de vendas do mês atual',
    category: 'vendas',
    component: 'VendasMesCard',
    defaultVisible: true,
    defaultOrder: 1
  },
  'total-orcamentos': {
    id: 'total-orcamentos',
    name: 'Total de Orçamentos',
    description: 'Soma de todos os orçamentos ativos',
    category: 'vendas',
    component: 'TotalOrcamentosCard',
    defaultVisible: true,
    defaultOrder: 2
  },
  'contas-pagar': {
    id: 'contas-pagar',
    name: 'Contas a Pagar',
    description: 'Pagamentos pendentes',
    category: 'financeiro',
    component: 'ContasPagarCard',
    defaultVisible: true,
    defaultOrder: 3
  },
  'contas-receber': {
    id: 'contas-receber',
    name: 'Contas a Receber',
    description: 'Recebimentos pendentes',
    category: 'financeiro',
    component: 'ContasReceberCard',
    defaultVisible: true,
    defaultOrder: 4
  },
  'saldo-contas': {
    id: 'saldo-contas',
    name: 'Saldo das Contas',
    description: 'Saldo atual em contas correntes',
    category: 'financeiro',
    component: 'SaldoContasCard',
    defaultVisible: true,
    defaultOrder: 5
  },
  'top-clientes': {
    id: 'top-clientes',
    name: 'Top 5 Clientes',
    description: 'Maiores clientes por faturamento',
    category: 'vendas',
    component: 'TopClientesCard',
    defaultVisible: true,
    defaultOrder: 6
  },
  'alertas': {
    id: 'alertas',
    name: 'Alertas',
    description: 'Alertas de parcelas e interações pendentes',
    category: 'geral',
    component: 'AlertasCard',
    defaultVisible: true,
    defaultOrder: 7
  }
};

export const getDashboardCards = () => {
  return Object.values(DASHBOARD_CARDS_REGISTRY);
};

export const getCardById = (cardId: string) => {
  return DASHBOARD_CARDS_REGISTRY[cardId];
};
