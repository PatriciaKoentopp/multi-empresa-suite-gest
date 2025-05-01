
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
            data={data}
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
              tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
            />
            <Tooltip content={<ChartTooltipContent labelKey="name" />} />
            {isYearly ? (
              // Para o gráfico anual, mostramos apenas uma barra por ano
              <Bar
                dataKey="faturado"
                fill="#4CAF50"
                radius={[4, 4, 0, 0]}
              />
            ) : multiColor ? (
              // Para gráficos com múltiplas cores, iteramos sobre os dados
              data.map((entry, index) => (
                <Bar 
                  key={`bar-${entry.name}`}
                  dataKey="faturado" 
                  name={entry.name}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))
            ) : (
              // Para gráficos normais de um só tipo
              <Bar
                dataKey="faturado"
                fill="var(--color-faturado)"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
