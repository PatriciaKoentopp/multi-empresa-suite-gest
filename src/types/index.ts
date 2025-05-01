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
  yearlyVariation: number | null;
  mediaMensal: number;
  mediaVariacao: number | null;
  months: MonthlyComparison[];
}
