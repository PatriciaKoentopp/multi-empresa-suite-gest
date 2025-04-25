
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

interface SalesTrendData {
  name: string;
  value: number;
}

interface SalesLineChartProps {
  data: SalesTrendData[];
  className?: string;
}

export const SalesLineChart = ({ data, className }: SalesLineChartProps) => {
  return (
    <div className={className}>
      <ChartContainer
        className="h-[250px]"
        config={{
          value: {
            label: "Vendas",
            color: "#4CAF50",
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
