
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: any;
  disabled?: boolean;
  external?: boolean;
  items?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface YearlyComparison {
  ano: number;
  vendas: number;
  variacao: number;
  tipo_variacao: 'aumento' | 'reducao';
}

export interface SaleData {
  id: string;
  valor: number;
  data: string;
  servico?: string;
  cliente?: string;
}
