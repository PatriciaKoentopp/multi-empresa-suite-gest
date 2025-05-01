
export interface MonthlyComparison {
  month: string;
  year: number;
  total: number;
  monthlyVariation: number | null;
  yearlyVariation: number | null;
  sortDate: Date;
}

export interface YearlyComparison {
  year: number;
  total: number;
  variacao_total: number | null;
  media_mensal: number;
  variacao_media: number | null;
  num_meses: number;
}
