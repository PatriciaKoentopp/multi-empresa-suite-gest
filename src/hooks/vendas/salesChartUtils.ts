
import { format } from "date-fns";
import { ChartData } from "./types";

// Função auxiliar para formatar dados do gráfico
export const formatChartData = (data: any[] | null): ChartData[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  return data.map((item) => ({
    name: String(item.name || ''),
    faturado: Number(item.faturado || 0)
  }));
};

// Função para processar dados trimestrais a partir dos dados mensais
export const processQuarterlyData = (monthlyData: ChartData[]): ChartData[] => {
  const dadosTrimestrais = [
    { name: '1º Trim', faturado: 0 },
    { name: '2º Trim', faturado: 0 },
    { name: '3º Trim', faturado: 0 },
    { name: '4º Trim', faturado: 0 }
  ];
  
  // Somar os meses para formar os trimestres
  monthlyData.forEach((mes, index) => {
    const trimestre = Math.floor(index / 3);
    if (trimestre >= 0 && trimestre < 4) {
      dadosTrimestrais[trimestre].faturado += mes.faturado;
    }
  });
  
  return dadosTrimestrais;
};

// Mapear nomes de meses para números
export const getMesesMap = (): {[key: string]: number} => {
  return {
    "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4,
    "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
    "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
  };
};

// Obter todos os nomes de meses em ordem
export const getMesesNomes = (): string[] => {
  return [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
};

// Obter abreviações de meses
export const getMesesAbreviados = (): string[] => {
  return [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
};

// Formatar data para o formato do supabase
export const formatDateForSupabase = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Calcular valores totais para um ano a partir de dados de vendas
export const calcularTotalVendasAno = (vendas: any[] | null): number => {
  if (!vendas || !Array.isArray(vendas) || vendas.length === 0) return 0;
  
  return vendas.reduce((total, venda) => {
    const valorTotal = venda.orcamentos_itens.reduce(
      (sum: number, item: any) => sum + (Number(item.valor) || 0), 0
    );
    return total + valorTotal;
  }, 0);
};

