
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
        color: item.color || "#9b87f5", // Usando roxo principal como cor padrão
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
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={true}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="quantidade"
                  name="Leads"
                  fill="#9b87f5" // Cor roxa principal definida explicitamente
                  fillOpacity={0.9}
                  barSize={20}
                  radius={[0, 4, 4, 0]} // Raio nos cantos direitos das barras
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
