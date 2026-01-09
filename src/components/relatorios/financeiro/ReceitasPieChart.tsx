
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoriaFinanceira } from "@/hooks/useRelatorioFinanceiro";

interface ReceitasPieChartProps {
  categorias: CategoriaFinanceira[];
  loading?: boolean;
}

// Cores para as categorias de receitas
const CORES_RECEITAS = [
  "#22c55e", // verde
  "#3b82f6", // azul
  "#10b981", // esmeralda
  "#06b6d4", // ciano
  "#14b8a6", // teal
  "#0ea5e9", // sky
  "#84cc16", // lima
  "#6366f1", // indigo
  "#8b5cf6", // violeta
  "#a855f7", // roxo
];

export function ReceitasPieChart({ categorias, loading }: ReceitasPieChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="animate-pulse h-[200px] w-[200px] rounded-full bg-muted"></div>
        </CardContent>
      </Card>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma receita no período</p>
        </CardContent>
      </Card>
    );
  }

  const data = categorias.map((cat, index) => ({
    name: cat.categoria_nome,
    value: cat.total,
    percentual: cat.percentual,
    color: CORES_RECEITAS[index % CORES_RECEITAS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentual }) => `${name}: ${percentual.toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(name) => `Categoria: ${name}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {data.slice(0, 6).map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
