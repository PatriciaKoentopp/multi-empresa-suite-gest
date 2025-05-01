
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

interface SalesBarChartProps {
  data: {
    name: string;
    faturado: number;
  }[];
  className?: string;
  multiColor?: boolean;
  isYearly?: boolean;
}

const CHART_COLORS = [
  "#4CAF50", // Verde
  "#2196F3", // Azul
  "#FFC107", // Amarelo
  "#9C27B0", // Roxo
  "#FF5722", // Laranja
  "#795548", // Marrom
  "#607D8B", // Azul Acinzentado
  "#E91E63", // Rosa
  "#3F51B5", // Índigo
  "#CDDC39", // Lima
  "#009688", // Verde-azulado
  "#FF9800"  // Âmbar
];

export const SalesBarChart = ({ data, className, multiColor = false, isYearly = false }: SalesBarChartProps) => {
  // Verificar se os dados estão presentes e em formato correto
  const chartData = Array.isArray(data) ? data.map(item => ({
    name: (item.name !== undefined && item.name !== null) ? String(item.name) : '',
    faturado: (item.faturado !== undefined && item.faturado !== null) ? Number(item.faturado) : 0
  })) : [];
  
  console.log("Dados do gráfico processados:", chartData);

  // Verificar se temos dados válidos para o gráfico
  if (!chartData.length) {
    console.warn("Sem dados válidos para o gráfico");
    return (
      <div className={className || "h-[300px] flex items-center justify-center"}>
        <p className="text-muted-foreground">Sem dados disponíveis para visualização</p>
      </div>
    );
  }

  // Adicionando verificação adicional: se todos os valores são zero
  const allZeros = chartData.every(item => item.faturado === 0);
  if (allZeros) {
    console.warn("Todos os valores do gráfico são zero");
    return (
      <div className={className || "h-[300px] flex items-center justify-center"}>
        <p className="text-muted-foreground">Sem dados de faturamento para o período selecionado</p>
      </div>
    );
  }

  // Formatador para valores em reais
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className={className}>
      <ChartContainer
        className="h-[300px]"
        config={{
          faturado: {
            label: "Faturado",
            color: "#4CAF50",
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 40,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={true}
              tick={{ fontSize: 12 }}
              height={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              content={<ChartTooltipContent labelKey="name" formatter={(value) => formatCurrency(Number(value))} />} 
            />
            {multiColor ? (
              // Para gráficos com múltiplas cores, iteramos sobre os dados
              chartData.map((entry, index) => (
                <Bar 
                  key={`bar-${entry.name}-${index}`}
                  dataKey="faturado" 
                  name={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))
            ) : (
              // Para gráficos normais de um só tipo ou anuais
              <Bar
                dataKey="faturado"
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
