
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart";

interface SalesByCategoryData {
  name: string;
  value: number;
  color: string;
}

interface SalesPieChartProps {
  data: SalesByCategoryData[];
  className?: string;
}

export const SalesPieChart = ({ data, className }: SalesPieChartProps) => {
  // Configuração dinâmica para o ChartContainer
  const chartConfig = data.reduce((config, item) => {
    return {
      ...config,
      [item.name]: {
        label: item.name,
        color: item.color,
      },
    };
  }, {});

  return (
    <div className={className}>
      <ChartContainer className="h-[300px]" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent formatter={(value) => `R$ ${Number(value).toLocaleString()}`} />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-4 flex justify-center">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">
                {item.name}: R$ {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
