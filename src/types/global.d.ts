
export interface ModuleNavItem {
  title: string;
  href?: string;
  icon?: any;
  disabled?: boolean;
  external?: boolean;
  items?: SubNavItem[];
  subItems?: SubNavItem[];
}

export interface SubNavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface YearlyComparison {
  year: number;
  total: number;
  qtde_vendas: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}

export interface SaleData {
  id: string;
  valor: number;
  data: string;
  servico?: string;
  cliente?: string;
}
