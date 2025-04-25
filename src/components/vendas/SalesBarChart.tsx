
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

interface SalesData {
  name: string;
  faturado: number;
  projetado: number;
}

interface SalesBarChartProps {
  data: SalesData[];
  className?: string;
}

export const SalesBarChart = ({ data, className }: SalesBarChartProps) => {
  return (
    <div className={className}>
      <ChartContainer
        className="h-[300px]"
        config={{
          faturado: {
            label: "Faturado",
            color: "#1E88E5",
          },
          projetado: {
            label: "Projetado",
            color: "#90CAF9",
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={true}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
            />
            <Tooltip content={<ChartTooltipContent labelKey="name" />} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="faturado" name="Faturado" fill="var(--color-faturado)" barSize={20} radius={[4, 4, 0, 0]} />
            <Bar dataKey="projetado" name="Projetado" fill="var(--color-projetado)" barSize={20} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
