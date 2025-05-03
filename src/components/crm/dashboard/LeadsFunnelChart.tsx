
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  nome: string;
  quantidade: number;
  valor: number;
  color: string;
}

interface LeadsFunnelChartProps {
  data: FunnelData[];
  title: string;
  emptyMessage?: string;
}

export function LeadsFunnelChart({ data, title, emptyMessage = "Nenhum dado disponível" }: LeadsFunnelChartProps) {
  // Configuração para o tooltip e cores
  const chartConfig = data.reduce((config, item) => {
    return {
      ...config,
      [item.nome]: {
        label: item.nome,
        color: item.color,
      },
    };
  }, {});

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer className="h-[300px]" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="nome"
                  tickLine={false}
                  axisLine={true}
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="quantidade"
                  name="Leads"
                  radius={[4, 4, 0, 0]}
                  fill="var(--color-quantidade)"
                  fillOpacity={0.9}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
