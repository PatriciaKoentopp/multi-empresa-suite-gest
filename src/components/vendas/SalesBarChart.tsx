
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
}

// Array de cores para barras múltiplas
const barColors = ["#4CAF50", "#8B5CF6", "#F97316", "#0EA5E9"];

export const SalesBarChart = ({ data, className, multiColor = false }: SalesBarChartProps) => {
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
            {!multiColor ? (
              <Bar
                dataKey="faturado"
                fill="var(--color-faturado)"
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Bar
                dataKey="faturado"
                radius={[4, 4, 0, 0]}
                fill={barColors[0]}
              >
                {data.map((entry, index) => (
                  <rect
                    key={`bar-${index}`}
                    fill={barColors[index % barColors.length]}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
