
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FluxoMensal } from "@/hooks/useRelatorioFinanceiro";

interface ReceitasDespesasBarChartProps {
  fluxoMensal: FluxoMensal[];
  loading?: boolean;
}

export function ReceitasDespesasBarChart({ fluxoMensal, loading }: ReceitasDespesasBarChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas x Despesas - Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="animate-pulse w-full h-[300px] bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!fluxoMensal || fluxoMensal.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas x Despesas - Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado no período</p>
        </CardContent>
      </Card>
    );
  }

  const data = fluxoMensal.map(item => ({
    ...item,
    name: item.mes,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas x Despesas - Evolução Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas" : "Saldo"
                ]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={(value) => 
                  value === "receitas" ? "Receitas" : value === "despesas" ? "Despesas" : "Saldo"
                }
              />
              <Bar dataKey="receitas" fill="#22c55e" name="receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" name="despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
